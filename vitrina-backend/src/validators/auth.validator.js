// ============================================================
//  validators/auth.validator.js
//  Validaciones de entrada con express-validator
// ============================================================

const { body, validationResult } = require('express-validator');

// Middleware que verifica si hay errores y responde 422
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      ok     : false,
      message: 'Datos inválidos',
      errors : errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 6 }).withMessage('Mínimo 6 caracteres'),
];

const changePasswordRules = [
  body('new_password')
    .notEmpty().withMessage('La nueva contraseña es requerida')
    .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
    .matches(/[A-Z]/).withMessage('Debe contener al menos una mayúscula')
    .matches(/[0-9]/).withMessage('Debe contener al menos un número'),
];

module.exports = { validate, loginRules, changePasswordRules };
