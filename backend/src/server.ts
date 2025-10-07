import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import passport from './config/oauth';
import { config } from './config';
import { db } from './database/connection';
import { redis } from './utils/redis';
import logger from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import fs from 'fs/promises';

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session (for OAuth flow)
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 15, // 15 minutes
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
app.use(rateLimiter);

// Routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize server
async function startServer() {
  try {
    // Create necessary directories
    await fs.mkdir(config.upload.uploadDir, { recursive: true });
    await fs.mkdir(config.upload.tempDir, { recursive: true });
    await fs.mkdir('./logs', { recursive: true });

    // Connect to database
    const dbHealthy = await db.healthCheck();
    if (!dbHealthy) {
      logger.error('Database health check failed');
      process.exit(1);
    }
    logger.info('Database connected successfully');

    // Connect to Redis (optional)
    try {
      await redis.connect();
    } catch (error) {
      logger.warn('Redis connection failed, continuing without cache', { error });
    }

    // Start server
    app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port}`, {
        env: config.env,
        port: config.port,
      });
      console.log(`🚀 Server running at http://localhost:${config.port}`);
      console.log(`📚 API available at http://localhost:${config.port}/api`);
      console.log(`🏥 Health check at http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await db.end();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await db.end();
  await redis.disconnect();
  process.exit(0);
});

// Start the server
startServer();

export default app;
