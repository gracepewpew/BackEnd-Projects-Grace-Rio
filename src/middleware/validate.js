function validate(requiredFields = []) {
  return (req, res, next) => {
    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || String(value).trim() === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Data belum lengkap.',
        missingFields
      });
    }

    next();
  };
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^[0-9+\-\s]{8,20}$/.test(phone);
}

module.exports = { validate, validateEmail, validatePhone };
