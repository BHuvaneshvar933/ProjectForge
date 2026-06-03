const errorHandler = (err, req, res, next) => {
  console.error(err);

  // Handle CORS errors explicitly; otherwise frontend sees a 500.
  if (err && typeof err.message === "string" && err.message.startsWith("CORS:")) {
    return res.status(err.statusCode || 403).json({
      success: false,
      message: err.message,
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

export default errorHandler;
