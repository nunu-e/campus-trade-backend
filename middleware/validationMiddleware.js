const { validationResult } = require("express-validator");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

const validateAAUEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@aau\.edu\.et$/;
  return regex.test(email);
};

const validateEthiopianPhone = (phone) => {
  const regex = /^(\+251|0)[79]\d{8}$/;
  return regex.test(phone);
};

module.exports = {
  validate,
  validateAAUEmail,
  validateEthiopianPhone,
};
