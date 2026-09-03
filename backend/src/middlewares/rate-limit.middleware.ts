import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import logger from '../logger/winston.logger';

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

/**
 * Creates an in-memory sliding window rate limiter middleware
 */
export function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, RateLimitRecord>();
  const { windowMs, max, message = 'Too many requests from this IP, please try again later.' } = options;

  // Periodic garbage collection every 5 minutes to prevent memory leaks
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, Math.min(windowMs, 5 * 60 * 1000));

  if (cleanup.unref) {
    cleanup.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void | Response => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    let record = store.get(key);
    if (!record) {
      record = { timestamps: [] };
      store.set(key, record);
    }

    // Filter out expired timestamps
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= max) {
      const oldest = record.timestamps[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));

      logger.warn(`Rate limit exceeded for IP: ${ip} on ${req.method} ${req.originalUrl}`);

      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', Math.ceil((oldest + windowMs) / 1000));

      return res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        success: false,
        message,
        retryAfterSeconds,
      });
    }

    record.timestamps.push(now);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.timestamps.length));

    next();
  };
}

/**
 * Strict rate limiter for sensitive authentication endpoints (30 attempts per 15 min per IP)
 */
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

/**
 * General rate limiter for standard REST endpoints (120 requests per minute per IP)
 */
export const rateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Rate limit exceeded. Please slow down your requests.',
});

export default rateLimiter;
