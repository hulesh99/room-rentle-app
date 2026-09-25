import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadAvatar } from '../middleware/uploadMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerSchema, loginSchema, validate } from '../../shared/schemas.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh-token', authLimiter, refreshToken);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, uploadAvatar, updateProfile);

export default router;
