const ApiError = require('../utils/ApiError');

// Converts known Mongoose / JWT errors into clean ApiErrors
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return new ApiError(400, message);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new ApiError(409, `An entry with this ${field} already exists`);
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return new ApiError(400, `Invalid value for ${err.path}: ${err.value}`);
  }

  if (err.name === 'JsonWebTokenError') return new ApiError(401, 'Invalid token');
  if (err.name === 'TokenExpiredError') return new ApiError(401, 'Token expired, please log in again');

  return new ApiError(err.statusCode || 500, err.message || 'Internal server error');
};

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }

  res.status(normalized.statusCode || 500).json({
    success: false,
    message: normalized.message || 'Something went wrong',
  });
};

module.exports = { notFound, errorHandler };
