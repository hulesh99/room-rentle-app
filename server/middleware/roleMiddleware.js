import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const requireRole = (role) =>
  asyncHandler((req, res, next) => {
    if (!req.user || req.user.role !== role) {
      const label = role.charAt(0) + role.slice(1).toLowerCase();
      return next(new ApiError(403, `Access denied. ${label} account required`));
    }
    next();
  });

export const isOwner = requireRole('OWNER');
export const isRenter = requireRole('RENTER');
