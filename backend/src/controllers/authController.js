const bcrypt = require('bcryptjs');
const passport = require('passport');
const db = require('../config/db');

/**
 * Register a new user
 * POST /auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = $1',
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash the password with bcrypt (salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const insertResult = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name.trim(), normalizedEmail, hashedPassword]
    );

    const newUser = insertResult.rows[0];

    // Automatically establish session via req.login
    req.login(newUser, (err) => {
      if (err) {
        console.error('[Register req.login Error]', err);
        return res.status(500).json({
          success: false,
          message: 'Account created, but error initiating session. Please log in.',
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Registration successful.',
        user: newUser,
      });
    });
  } catch (err) {
    console.error('[Register Error]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error registering user.',
    });
  }
}

/**
 * Login user via Passport Local Strategy
 * POST /auth/login
 */
function login(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('[Passport Login Error]', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication.',
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || 'Invalid email or password.',
      });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('[req.login Error]', loginErr);
        return res.status(500).json({
          success: false,
          message: 'Error saving login session.',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
      });
    });
  })(req, res, next);
}

/**
 * Logout user, destroy session and clear session cookie
 * POST /auth/logout
 */
function logout(req, res, next) {
  const cookieName = process.env.SESSION_COOKIE_NAME || 'connect.sid';

  req.logout((err) => {
    if (err) {
      console.error('[Logout Error]', err);
      return res.status(500).json({
        success: false,
        message: 'Error logging out.',
      });
    }

    if (req.session) {
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error('[Session Destroy Error]', destroyErr);
        }
        res.clearCookie(cookieName, { path: '/' });
        return res.status(200).json({
          success: true,
          message: 'Logged out successfully.',
        });
      });
    } else {
      res.clearCookie(cookieName, { path: '/' });
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully.',
      });
    }
  });
}

/**
 * Get current authenticated user
 * GET /auth/me
 */
function getMe(req, res) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated.',
    });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      created_at: req.user.created_at,
    },
  });
}

module.exports = {
  register,
  login,
  logout,
  getMe,
};
