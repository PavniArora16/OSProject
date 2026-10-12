
function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const message = error.message || "Internal server error";

  const status = message.startsWith("Unknown problem:") ||
    message.startsWith("Invalid mode") ||
    message.startsWith("Simulation ID already exists:")
    ? 400
    : 500;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({
    error: message,
  });
}

module.exports = errorHandler;
