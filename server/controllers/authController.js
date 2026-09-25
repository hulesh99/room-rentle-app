import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';
import { uploadImageBuffer, deleteImage } from '../utils/uploadToCloudinary.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  refreshCookieOptions,
  REFRESH_TTL_MS,
} from '../utils/generateToken.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  city: user.city || '',
  phone: user.phone || '',
  createdAt: user.createdAt,
});

const issueSession = async (user, res) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user._id);
  const now = Date.now();

  user.refreshTokens = [
    ...user.refreshTokens.filter((rt) => rt.expiresAt.getTime() > now),
    { tokenHash: hashToken(refreshToken), expiresAt: new Date(now + REFRESH_TTL_MS) },
  ].slice(-5);

  await user.save();
  res.cookie('refreshToken', refreshToken, refreshCookieOptions());
  return accessToken;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = 'RENTER', city } = req.body;

  if (!name || String(name).trim().length < 2)
    throw new ApiError(422, 'Name must be at least 2 characters');
  if (!email || !EMAIL_REGEX.test(email))
    throw new ApiError(422, 'A valid email is required');
  if (!password || password.length < 6)
    throw new ApiError(422, 'Password must be at least 6 characters');
  if (!['OWNER', 'RENTER'].includes(role))
    throw new ApiError(422, 'Role must be either OWNER or RENTER');

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const user = await User.create({
    name: String(name).trim(),
    email: email.toLowerCase().trim(),
    password,
    role,
    city: city ? String(city).trim() : '',
  });

  const accessToken = await issueSession(user, res);

  res.status(201).json({
    success: true,
    user: sanitizeUser(user),
    accessToken,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) throw new ApiError(422, 'Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password)))
    throw new ApiError(401, 'Invalid email or password');

  const accessToken = await issueSession(user, res);

  res.json({
    success: true,
    user: sanitizeUser(user),
    accessToken,
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, 'No refresh token provided');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch (error) {
    res.clearCookie('refreshToken', refreshCookieOptions());
    throw new ApiError(401, 'Refresh token invalid or expired');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.clearCookie('refreshToken', refreshCookieOptions());
    throw new ApiError(401, 'Account no longer exists');
  }

  const hash = hashToken(token);
  const storedIndex = user.refreshTokens.findIndex((rt) => rt.tokenHash === hash);

  if (storedIndex === -1) {
    user.refreshTokens = [];
    await user.save();
    res.clearCookie('refreshToken', refreshCookieOptions());
    throw new ApiError(401, 'Session revoked. Please log in again');
  }

  user.refreshTokens.splice(storedIndex, 1);
  const accessToken = await issueSession(user, res);

  res.json({
    success: true,
    user: sanitizeUser(user),
    accessToken,
  });
});

export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshTokens = user.refreshTokens.filter(
          (rt) => rt.tokenHash !== hashToken(token)
        );
        await user.save();
      }
    } catch {}
  }

  res.clearCookie('refreshToken', refreshCookieOptions());
  res.json({ success: true, message: 'Logged out successfully' });
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found');

  const { name, city, phone } = req.body;

  if (name !== undefined) {
    const trimmedName = String(name).trim();
    if (trimmedName.length < 2 || trimmedName.length > 50)
      throw new ApiError(422, 'Name must be between 2 and 50 characters');
    user.name = trimmedName;
  }

  if (city !== undefined) user.city = String(city).trim().slice(0, 60);

  if (phone !== undefined) {
    const cleaned = String(phone).replace(/[\s-]/g, '');
    if (cleaned && !/^(\+91)?[6-9]\d{9}$/.test(cleaned))
      throw new ApiError(422, 'Contact number must be a valid Indian mobile number');
    user.phone = cleaned;
  }

  if (req.file) {
    const result = await uploadImageBuffer(
      req.file.buffer,
      `room-rental-app/avatars/${user._id}`,
      req.file.originalname
    );
    if (user.avatar?.public_id) {
      await deleteImage(user.avatar.public_id);
    }
    user.avatar = { public_id: result.public_id, url: result.secure_url || result.url };
  }

  await user.save();

  res.json({ success: true, data: sanitizeUser(user), message: 'Profile updated' });
});
