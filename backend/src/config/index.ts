import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'oldnew_dev',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  llm: {
    provider: process.env.LLM_PROVIDER || 'xai',
    fallbackProvider: process.env.LLM_FALLBACK_PROVIDER || undefined,
  },

  xai: {
    apiKey: process.env.XAI_API_KEY || '',
    endpoint: process.env.XAI_API_ENDPOINT || 'https://api.x.ai/v1/chat/completions',
    model: process.env.XAI_MODEL || 'grok-4-fast-reasoning-20251001',
    rateLimitTier: parseInt(process.env.XAI_RATE_LIMIT_TIER || '1', 10),
    maxRetries: parseInt(process.env.XAI_MAX_RETRIES || '3', 10),
    timeout: parseInt(process.env.XAI_TIMEOUT_MS || '30000', 10),
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
  },

  upload: {
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
    uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
    tempDir: path.resolve(process.env.TEMP_DIR || './temp'),
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },
};

export default config;
