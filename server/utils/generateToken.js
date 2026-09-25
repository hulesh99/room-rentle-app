import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export const signAccessToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

export const signRefreshToken = (userId) =>
  jwt.sign({ id: userId.toString() }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: REFRESH_TTL_MS,
});
