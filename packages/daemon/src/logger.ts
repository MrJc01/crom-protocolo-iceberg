/**
 * Logger Module - Structured Logging with Pino
 * 
 * Provides consistent logging across the daemon
 */

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  base: {
    service: "iceberg-daemon",
    version: "0.2.0",
  },
});

// Request logger middleware
export function requestLogger() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = generateRequestId();
    
    // Attach to request
    req.id = requestId;
    req.log = logger.child({ requestId });

    // Log request
    req.log.info({ method: req.method, url: req.url }, "Request started");

    // Log response on finish
    res.on("finish", () => {
      const duration = Date.now() - start;
      const level = res.statusCode >= 400 ? "warn" : "info";
      
      req.log[level](
        {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
        },
        "Request completed"
      );
    });

    next();
  };
}

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Child loggers for specific modules
export const consensusLogger = logger.child({ module: "consensus" });
export const storageLogger = logger.child({ module: "storage" });
export const networkLogger = logger.child({ module: "network" });
export const apiLogger = logger.child({ module: "api" });

export default logger;
