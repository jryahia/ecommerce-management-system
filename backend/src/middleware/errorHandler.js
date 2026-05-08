const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  // PostgreSQL unique violation (e.g., duplicate email/sku)
  if (err.code === '23505') {
    const detail = err.detail || '';
    const match = detail.match(/\(([^)]+)\)/);
    const field = match ? match[1] : 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate value: a record with this ${field} already exists.`,
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Operation failed: referenced record does not exist or is still in use.',
    });
  }

  // PostgreSQL not-null violation
  if (err.code === '23502') {
    return res.status(400).json({
      success: false,
      message: `Missing required field: ${err.column || 'unknown'}.`,
    });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Value violates a check constraint.',
    });
  }

  // PostgreSQL invalid text representation (e.g., bad UUID)
  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Invalid input format (e.g., malformed ID).',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // express-validator / Joi validation errors
  if (err.name === 'ValidationError') {
    const messages = err.details
      ? err.details.map((d) => d.message)
      : [err.message];
    return res.status(400).json({ success: false, message: messages });
  }

  // Default
  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message || 'Server Error',
  });
};

module.exports = errorHandler;
