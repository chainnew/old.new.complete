import { Request, Response, NextFunction } from 'express';
import { redis } from '../utils/redis';
import { config } from '../config';
import logger from '../utils/logger';

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const identifier = req.ip || 'unknown';
    const key = `rate_limit:${identifier}`;

    const current = await redis.increment(key);

    if (current === 1) {
      // First request, set expiration
      await redis.expire(key, Math.floor(config.rateLimit.windowMs / 1000));
    }

    if (current > config.rateLimit.maxRequests) {
      logger.warn('Rate limit exceeded', { identifier, current });
      return res.status(429).json({
        error: 'Too many requests, please try again later',
        retryAfter: Math.floor(config.rateLimit.windowMs / 1000),
      });
    }

    res.setHeader('X-RateLimit-Limit', config.rateLimit.maxRequests);
    res.setHeader('X-RateLimit-Remaining', config.rateLimit.maxRequests - current);

    next();
  } catch (error) {
    logger.error('Rate limiter error', { error });
    // Continue on error (fail open)
    next();
  }
};
