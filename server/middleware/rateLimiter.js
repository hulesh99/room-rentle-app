import rateLimit from 'express-rate-limit';

const isProd = process.env.NODE_ENV === 'production';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 500 : 5000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET',
  message: { success: false, message: 'Too many requests, please try again later' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later' },
});
