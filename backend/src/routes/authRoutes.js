const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validation');
const { ensureAuthenticated } = require('../middleware/auth');

// POST /auth/register
router.post('/register', validateRegister, authController.register);

// POST /auth/login
router.post('/login', validateLogin, authController.login);

// POST /auth/logout
router.post('/logout', ensureAuthenticated, authController.logout);

// GET /auth/me
router.get('/me', ensureAuthenticated, authController.getMe);

module.exports = router;
