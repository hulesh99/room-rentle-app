import ApiError from '../utils/ApiError.js';

export const notFound = (req, res, next) =>
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (!(err instanceof ApiError)) {
    if (err.name === 'CastError') {
      statusCode = 400;
      message = 'Invalid identifier format';
    } else if (err.code === 11000) {
      statusCode = 409;
      message = `Duplicate value for: ${Object.keys(err.keyValue || {}).join(', ')}`;
    } else if (err.name === 'ValidationError') {
      statusCode = 422;
      message = Object.values(err.errors)
        .map((e) => e.message)
        .join(', ');
    } else if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
    } else if (err.name === 'MulterError') {
      statusCode = 422;
      if (err.code === 'LIMIT_FILE_SIZE') message = 'Each image must be under 5 MB';
      else if (err.code === 'LIMIT_FILE_COUNT') message = 'Maximum 10 images allowed per listing';
      else if (err.code === 'LIMIT_UNEXPECTED_FILE') message = 'Unexpected file field. Use "images" for uploads';
      else message = `Upload error: ${err.message}`;
    }
  }

  if (res.headersSent) return next(err);

  res.status(statusCode).json({
    success: false,
    message,
    errors: Array.isArray(err.errors) && err.errors.length > 0 ? err.errors : undefined,
  });
};
