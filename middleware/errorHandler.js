const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Intercept Mongoose poorly formatted Object IDs globally
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not fully bound or improperly formatted id.';
  }

  // Intercept Mongoose unique Index Violations globally (i.e User Email unique constraint)
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field metric recorded. Provide a distinct unique value.';
  }

  // Safely flatten complex nested Mongoose constraints exclusively
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
  }

  // Respond securely without omitting sensitive database queries on un-secured networks
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
