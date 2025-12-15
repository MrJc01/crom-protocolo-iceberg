/**
 * Prometheus Metrics Endpoint
 * 
 * Exports metrics in Prometheus format for monitoring
 */

import { Router, Request, Response } from "express";
import { Storage } from "../storage";
import { logger } from "../logger";

const router = Router();

// Store metrics in memory
const metrics = {
  requests: {
    total: 0,
    byMethod: {} as Record<string, number>,
    byPath: {} as Record<string, number>,
    byStatus: {} as Record<number, number>,
  },
  latency: {
    total: 0,
    count: 0,
    histogram: {
      le_10: 0,   // <= 10ms
      le_50: 0,   // <= 50ms
      le_100: 0,  // <= 100ms
      le_500: 0,  // <= 500ms
      le_1000: 0, // <= 1s
      inf: 0,     // > 1s
    },
  },
  errors: 0,
  startTime: Date.now(),
};

// Metrics collection middleware
export function metricsMiddleware() {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on("finish", () => {
      const duration = Date.now() - start;
      
      // Update counters
      metrics.requests.total++;
      metrics.requests.byMethod[req.method] = (metrics.requests.byMethod[req.method] || 0) + 1;
      
      const pathKey = req.route?.path || req.path.split("/").slice(0, 3).join("/");
      metrics.requests.byPath[pathKey] = (metrics.requests.byPath[pathKey] || 0) + 1;
      metrics.requests.byStatus[res.statusCode] = (metrics.requests.byStatus[res.statusCode] || 0) + 1;
      
      // Update latency
      metrics.latency.total += duration;
      metrics.latency.count++;
      
      if (duration <= 10) metrics.latency.histogram.le_10++;
      else if (duration <= 50) metrics.latency.histogram.le_50++;
      else if (duration <= 100) metrics.latency.histogram.le_100++;
      else if (duration <= 500) metrics.latency.histogram.le_500++;
      else if (duration <= 1000) metrics.latency.histogram.le_1000++;
      else metrics.latency.histogram.inf++;
      
      // Track errors
      if (res.statusCode >= 500) {
        metrics.errors++;
      }
    });
    
    next();
  };
}

// GET /metrics - Prometheus format
router.get("/", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    
    // Get storage stats
    const { total: totalPosts } = storage.listPosts({ limit: 1 });
    const { reports: pendingReports } = storage.listReports({ status: "pending" });
    
    const uptimeSeconds = Math.floor((Date.now() - metrics.startTime) / 1000);
    const avgLatency = metrics.latency.count > 0 
      ? (metrics.latency.total / metrics.latency.count).toFixed(2) 
      : 0;

    // Generate Prometheus format
    const lines = [
      "# HELP iceberg_requests_total Total number of HTTP requests",
      "# TYPE iceberg_requests_total counter",
      `iceberg_requests_total ${metrics.requests.total}`,
      "",
      "# HELP iceberg_requests_by_method HTTP requests by method",
      "# TYPE iceberg_requests_by_method counter",
      ...Object.entries(metrics.requests.byMethod).map(
        ([method, count]) => `iceberg_requests_by_method{method="${method}"} ${count}`
      ),
      "",
      "# HELP iceberg_requests_by_status HTTP requests by status code",
      "# TYPE iceberg_requests_by_status counter",
      ...Object.entries(metrics.requests.byStatus).map(
        ([status, count]) => `iceberg_requests_by_status{status="${status}"} ${count}`
      ),
      "",
      "# HELP iceberg_request_duration_ms Request latency histogram",
      "# TYPE iceberg_request_duration_ms histogram",
      `iceberg_request_duration_ms_bucket{le="10"} ${metrics.latency.histogram.le_10}`,
      `iceberg_request_duration_ms_bucket{le="50"} ${metrics.latency.histogram.le_50}`,
      `iceberg_request_duration_ms_bucket{le="100"} ${metrics.latency.histogram.le_100}`,
      `iceberg_request_duration_ms_bucket{le="500"} ${metrics.latency.histogram.le_500}`,
      `iceberg_request_duration_ms_bucket{le="1000"} ${metrics.latency.histogram.le_1000}`,
      `iceberg_request_duration_ms_bucket{le="+Inf"} ${metrics.latency.histogram.inf}`,
      `iceberg_request_duration_ms_sum ${metrics.latency.total}`,
      `iceberg_request_duration_ms_count ${metrics.latency.count}`,
      "",
      "# HELP iceberg_request_latency_avg_ms Average request latency",
      "# TYPE iceberg_request_latency_avg_ms gauge",
      `iceberg_request_latency_avg_ms ${avgLatency}`,
      "",
      "# HELP iceberg_errors_total Total number of server errors",
      "# TYPE iceberg_errors_total counter",
      `iceberg_errors_total ${metrics.errors}`,
      "",
      "# HELP iceberg_uptime_seconds Daemon uptime in seconds",
      "# TYPE iceberg_uptime_seconds gauge",
      `iceberg_uptime_seconds ${uptimeSeconds}`,
      "",
      "# HELP iceberg_posts_total Total number of posts",
      "# TYPE iceberg_posts_total gauge",
      `iceberg_posts_total ${totalPosts}`,
      "",
      "# HELP iceberg_pending_reports Pending moderation reports",
      "# TYPE iceberg_pending_reports gauge",
      `iceberg_pending_reports ${pendingReports.length}`,
      "",
    ];

    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(lines.join("\n"));
  } catch (error: any) {
    logger.error({ error: error.message }, "Metrics fetch failed");
    res.status(500).json({ error: error.message });
  }
});

// GET /metrics/json - JSON format for debugging
router.get("/json", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { total: totalPosts } = storage.listPosts({ limit: 1 });
    const { reports: pendingReports } = storage.listReports({ status: "pending" });

    res.json({
      uptime: Math.floor((Date.now() - metrics.startTime) / 1000),
      requests: metrics.requests,
      latency: {
        average: metrics.latency.count > 0 
          ? metrics.latency.total / metrics.latency.count 
          : 0,
        total: metrics.latency.total,
        count: metrics.latency.count,
        histogram: metrics.latency.histogram,
      },
      errors: metrics.errors,
      storage: {
        totalPosts,
        pendingReports: pendingReports.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const metricsRouter = router;
