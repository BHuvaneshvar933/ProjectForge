const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Handle CORS errors explicitly; otherwise frontend sees a 500.
  if (err && typeof err.message === "string" && err.message.startsWith("CORS:")) {
    return res.status(err.statusCode || 403).json({
      success: false,
      message: err.message,
    });
  }

  if (err && err.name === "VersionError") {
    return res.status(409).json({
      success: false,
      message: err.message || "Conflict: This resource was modified by another user.",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: err.stack
  });
};

export default errorHandler;
