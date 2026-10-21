const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const dotenv = require('dotenv');

dotenv.config();

const { pool } = require('./config/db');
const passport = require('./config/passport');

// Import route modules
const authRoutes = require('./routes/authRoutes');
const teamRoutes = require('./routes/teamRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

const isProduction = process.env.NODE_ENV === 'production';

// Trust reverse proxy (e.g. Cloud Run, Nginx, Render) for secure cookies
if (isProduction) {
  app.set('trust proxy', 1);
}

// 1. Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. CORS Configuration with credentials
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || !isProduction) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 3. Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Request Logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// 5. Session Setup with PostgreSQL Store
const sessionLifetime =
  (parseInt(process.env.SESSION_LIFETIME_HOURS, 10) || 24) * 60 * 60 * 1000;

app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'team_task_manager_default_session_secret_change_me',
    resave: false,
    saveUninitialized: false,
    name: process.env.SESSION_COOKIE_NAME || 'task_manager_sid',
    cookie: {
      maxAge: sessionLifetime,
      httpOnly: true, // Prevents client-side JS from reading the cookie
      secure: isProduction, // Send only over HTTPS in production
      sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-domain in production HTTPS
    },
  })
);

// 6. Passport Authentication Middleware
app.use(passport.initialize());
app.use(passport.session());

// 7. Health Check
app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// 8. Mount Routes (support both /api/* and root paths)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/teams', teamRoutes);
app.use('/teams', teamRoutes);

app.use('/api/tasks', taskRoutes);
app.use('/tasks', taskRoutes);

// 9. Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Team Task Manager API',
    documentation: {
      auth: ['POST /auth/register', 'POST /auth/login', 'POST /auth/logout', 'GET /auth/me'],
      teams: ['POST /teams', 'GET /teams', 'POST /teams/:id/members', 'GET /teams/:id/members'],
      tasks: ['POST /tasks', 'GET /tasks', 'PUT /tasks/:id', 'DELETE /tasks/:id'],
    },
  });
});

// 10. 404 Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// 11. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err.stack || err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

module.exports = app;
