const { body, query, param, validationResult } = require('express-validator');

// Helper to inspect validation results and return formatted response
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
}

// User Registration Validation
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required.')
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters.'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),
  handleValidationErrors,
];

// User Login Validation
const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  handleValidationErrors,
];

// Team Creation Validation
const validateCreateTeam = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Team name is required.')
    .isLength({ min: 2, max: 255 })
    .withMessage('Team name must be between 2 and 255 characters.'),
  body('description')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters.'),
  handleValidationErrors,
];

// Add Team Member Validation
const validateAddMember = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid team ID is required in route parameter.'),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
  body('userId')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer.'),
  (req, res, next) => {
    if (!req.body.email && !req.body.userId) {
      return res.status(400).json({
        success: false,
        message: 'Must provide either member email or userId to add a team member.',
      });
    }
    next();
  },
  handleValidationErrors,
];

// Create Task Validation
const validateCreateTask = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required.')
    .isLength({ min: 2, max: 255 })
    .withMessage('Title must be between 2 and 255 characters.'),
  body('description')
    .optional({ nullable: true })
    .trim(),
  body('team_id')
    .notEmpty()
    .withMessage('Team ID is required.')
    .isInt({ min: 1 })
    .withMessage('Team ID must be a valid integer.'),
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed'])
    .withMessage("Status must be one of: 'Pending', 'In Progress', 'Completed'."),
  body('due_date')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid ISO8601 date string.'),
  body('assigned_to')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 })
    .withMessage('assigned_to must be a valid user ID.'),
  handleValidationErrors,
];

// Update Task Validation
const validateUpdateTask = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a valid integer in URL parameter.'),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty.')
    .isLength({ max: 255 })
    .withMessage('Title cannot exceed 255 characters.'),
  body('description')
    .optional({ nullable: true })
    .trim(),
  body('status')
    .optional()
    .isIn(['Pending', 'In Progress', 'Completed'])
    .withMessage("Status must be one of: 'Pending', 'In Progress', 'Completed'."),
  body('due_date')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      if (!isNaN(Date.parse(value))) return true;
      throw new Error('Due date must be a valid date string.');
    }),
  body('assigned_to')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '' || value === undefined) return true;
      if (Number.isInteger(Number(value)) && Number(value) > 0) return true;
      throw new Error('assigned_to must be a valid user ID or null.');
    }),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateCreateTeam,
  validateAddMember,
  validateCreateTask,
  validateUpdateTask,
};
