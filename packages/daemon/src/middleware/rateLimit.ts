/**
 * Rate Limiting Middleware
 * 
 * Protects against spam and abuse
 */

import { Request, Response, NextFunction } from "express";

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const stores: { [name: string]: RateLimitStore } = {};

function getStore(name: string): RateLimitStore {
  if (!stores[name]) {
    stores[name] = {};
  }
  return stores[name];
}

function cleanupStore(store: RateLimitStore) {
  const now = Date.now();
  for (const key of Object.keys(store)) {
    if (store[key].resetAt <= now) {
      delete store[key];
    }
  }
}

export interface RateLimitOptions {
  windowMs: number;       // Time window in ms
  maxRequests: number;    // Max requests per window
  keyGenerator?: (req: Request) => string;  // Custom key generator
  message?: string;       // Error message
  name?: string;          // Store name (for separate limits)
}

export function rateLimit(options: RateLimitOptions) {
  const {
    windowMs = 60000, // 1 minute default
    maxRequests = 100,
    keyGenerator = (req: Request) => req.ip || "unknown",
    message = "Too many requests, please try again later.",
    name = "default",
  } = options;

  const store = getStore(name);

  // Cleanup every 5 minutes
  setInterval(() => cleanupStore(store), 300000);

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or reset if window expired
    if (!store[key] || store[key].resetAt <= now) {
      store[key] = {
        count: 1,
        resetAt: now + windowMs,
      };
      return next();
    }

    // Increment count
    store[key].count++;

    // Check limit
    if (store[key].count > maxRequests) {
      const retryAfter = Math.ceil((store[key].resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfter.toString());
      res.setHeader("X-RateLimit-Limit", maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", Math.ceil(store[key].resetAt / 1000).toString());
      
      return res.status(429).json({
        error: message,
        retryAfter,
      });
    }

    // Set headers
    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", (maxRequests - store[key].count).toString());
    res.setHeader("X-RateLimit-Reset", Math.ceil(store[key].resetAt / 1000).toString());

    next();
  };
}

// Pre-configured rate limiters
export const generalLimiter = rateLimit({
  windowMs: 60000,      // 1 minute
  maxRequests: 100,     // 100 req/min
  name: "general",
});

export const postCreationLimiter = rateLimit({
  windowMs: 3600000,    // 1 hour
  maxRequests: 10,      // 10 posts/hour
  name: "posts",
  message: "Você atingiu o limite de posts por hora. Aguarde.",
});

export const voteLimiter = rateLimit({
  windowMs: 60000,      // 1 minute
  maxRequests: 60,      // 60 votes/min
  name: "votes",
  message: "Muitos votos. Aguarde um momento.",
});

export const reportLimiter = rateLimit({
  windowMs: 3600000,    // 1 hour
  maxRequests: 20,      // 20 reports/hour
  name: "reports",
  message: "Limite de denúncias atingido. Aguarde.",
});

export const chatLimiter = rateLimit({
  windowMs: 60000,      // 1 minute
  maxRequests: 30,      // 30 messages/min
  name: "chat",
  message: "Aguarde antes de enviar mais mensagens.",
});
