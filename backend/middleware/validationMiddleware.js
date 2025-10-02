const { body, param, validationResult } = require('express-validator');

// Middleware para tratar erros de validação
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Dados inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      })),
      code: 'VALIDATION_ERROR'
    });
  }
  next();
};

// Validações para registro de usuário
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nome deve ter entre 2 e 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
    .withMessage('Nome deve conter apenas letras e espaços'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email muito longo'),
  
  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Senha deve ter entre 6 e 128 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  
  handleValidationErrors
];

// Validações para login
const validateUserLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória'),
  
  handleValidationErrors
];

// Validações para vídeos
const validateVideo = [
  body('titulo')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Título deve ter entre 3 e 100 caracteres')
    .escape(), // Sanitizar HTML
  
  body('descripcion')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Descrição deve ter entre 10 e 500 caracteres (se fornecida)')
    .escape(),
  
  body('urlVideo')
    .optional()
    .isURL()
    .withMessage('URL do vídeo inválida'),
  
  handleValidationErrors
];

// Validações para documentos
const validateDocument = [
  body('titulo')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Título deve ter entre 3 e 100 caracteres')
    .escape(),
  
  body('descripcion')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Descrição deve ter entre 10 e 500 caracteres (se fornecida)')
    .escape(),
  
  body('urlDocumento')
    .optional()
    .isURL()
    .withMessage('URL do documento inválida'),
  
  handleValidationErrors
];

// Validação de parâmetros ID
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateVideo,
  validateDocument,
  validateId,
  handleValidationErrors
};
