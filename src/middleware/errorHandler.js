function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      message: 'Validasi database gagal.',
      errors: err.errors.map((item) => item.message)
    });
  }

  return res.status(err.status || 500).json({
    message: err.message || 'Terjadi kesalahan pada server.'
  });
}

module.exports = errorHandler;
