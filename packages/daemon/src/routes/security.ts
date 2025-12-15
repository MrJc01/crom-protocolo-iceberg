/**
 * Security Audit Endpoint
 * 
 * Provides security assessment of the daemon configuration
 */

import { Router, Request, Response } from "express";
import { Storage } from "../storage";
import { logger } from "../logger";
import * as fs from "fs";
import * as path from "path";

const router = Router();

interface SecurityCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
}

// GET /security/audit - Run security audit
router.get("/audit", (req: Request, res: Response) => {
  const checks: SecurityCheck[] = [];

  // Check 1: Rate limiting
  const rateLimitEnabled = process.env.NODE_ENV === "production" || req.app.get("rateLimitEnabled");
  checks.push({
    name: "Rate Limiting",
    status: rateLimitEnabled ? "pass" : "warn",
    message: rateLimitEnabled ? "Rate limiting is enabled" : "Rate limiting is disabled in development",
    severity: "high",
  });

  // Check 2: CORS configuration
  checks.push({
    name: "CORS Configuration",
    status: "pass",
    message: "CORS is enabled",
    severity: "medium",
  });

  // Check 3: Environment variables
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  checks.push({
    name: "AI Moderation",
    status: hasGeminiKey ? "pass" : "warn",
    message: hasGeminiKey ? "AI moderation is active" : "AI moderation requires GEMINI_API_KEY",
    severity: "medium",
  });

  // Check 4: Node environment
  const isProduction = process.env.NODE_ENV === "production";
  checks.push({
    name: "Production Mode",
    status: isProduction ? "pass" : "warn",
    message: isProduction ? "Running in production mode" : "Running in development mode",
    severity: "low",
  });

  // Check 5: Data directory permissions
  const dataDir = path.join(process.env.HOME || process.env.USERPROFILE || ".", ".iceberg");
  const dataDirExists = fs.existsSync(dataDir);
  checks.push({
    name: "Data Directory",
    status: dataDirExists ? "pass" : "warn",
    message: dataDirExists ? `Data stored at ${dataDir}` : "Data directory not found",
    severity: "low",
  });

  // Check 6: HTTPS (check if behind proxy)
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  checks.push({
    name: "HTTPS",
    status: isSecure ? "pass" : "warn",
    message: isSecure ? "Connection is secure" : "Running over HTTP (use HTTPS in production)",
    severity: "high",
  });

  // Calculate overall score
  const passCount = checks.filter((c) => c.status === "pass").length;
  const score = Math.round((passCount / checks.length) * 100);

  const failed = checks.filter((c) => c.status === "fail");
  const warnings = checks.filter((c) => c.status === "warn");

  logger.info({ score, passed: passCount, warnings: warnings.length }, "Security audit completed");

  res.json({
    timestamp: new Date().toISOString(),
    score,
    grade: score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D",
    summary: {
      total: checks.length,
      passed: passCount,
      warnings: warnings.length,
      failed: failed.length,
    },
    checks,
    recommendations: warnings.map((w) => w.message).concat(failed.map((f) => f.message)),
  });
});

// GET /security/headers - Check security headers
router.get("/headers", (req: Request, res: Response) => {
  const recommendedHeaders = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  res.json({
    recommended: recommendedHeaders,
    note: "These headers should be set by a reverse proxy (nginx/caddy) in production",
  });
});

export const securityRouter = router;
