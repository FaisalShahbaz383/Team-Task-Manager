const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./db');

// Configure Passport Local Strategy using email as the identifier
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const normalizedEmail = email ? email.toLowerCase().trim() : '';

        const result = await db.query(
          'SELECT id, name, email, password, created_at FROM users WHERE LOWER(email) = $1',
          [normalizedEmail]
        );

        if (result.rows.length === 0) {
          return done(null, false, { message: 'Invalid email or password.' });
        }

        const user = result.rows[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password.' });
        }

        // Return user without the hashed password
        const safeUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        };

        return done(null, safeUser);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Save user id into session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Retrieve user from database based on session id
passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return done(null, false);
    }

    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
