const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test PostgreSQL connectivity
    const client = await pool.connect();
    console.log('[Database] PostgreSQL connection pool established successfully.');
    client.release();

    const server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(` Team Task Manager Server is running!    `);
      console.log(` Mode:        ${process.env.NODE_ENV || 'development'}`);
      console.log(` Port:        ${PORT}`);
      console.log(` Health:      http://localhost:${PORT}/health`);
      console.log(` Client URL:  ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(`=========================================`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        try {
          await pool.end();
          console.log('[Database] PostgreSQL connection pool drained.');
          process.exit(0);
        } catch (err) {
          console.error('[Database] Error closing pool:', err);
          process.exit(1);
        }
      });

      // Force shutdown after 10s if graceful fails
      setTimeout(() => {
        console.error('[Server] Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[Server] Failed to connect to database on startup:', err.message);
    console.log('[Server] Starting server anyway (database may be offline or starting up)...');
    
    app.listen(PORT, () => {
      console.log(`[Server] Server listening on port ${PORT} (Database offline)`);
    });
  }
}

startServer();
