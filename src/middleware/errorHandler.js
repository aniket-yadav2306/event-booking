'use strict';

/**
 * Global Express error handler.
 *
 * Expected error shape set by controllers:
 *   const err = new Error('Message');
 *   err.status = 404;   // optional HTTP status (defaults to 500)
 *   throw err;          // or next(err)
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status  = err.status  || 500;
  const message = err.message || 'Internal Server Error';

  // Log server errors for debugging (no stack trace exposed to clients)
  if (status >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${message}`);
    console.error(err.stack);
  }

  return res.status(status).json({ success: false, error: message });
};

module.exports = errorHandler;
