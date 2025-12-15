/**
 * Background Tasks System
 * 
 * Executes periodic tasks:
 * - Every 24h: Check posts for potential banishment (high report ratio)
 * - Every 7 days: Create metrics snapshot (votes, likes, saves)
 * 
 * Configured via config/iceberg_config.json
 */

import { Storage } from "./storage";
import { logger } from "./logger";

interface TaskConfig {
  moderation_check_hours: number;
  metrics_snapshot_days: number;
  report_threshold_percent: number;
  auto_hide_after_reports: number;
}

// Default config (can be overridden)
const DEFAULT_CONFIG: TaskConfig = {
  moderation_check_hours: 24,
  metrics_snapshot_days: 7,
  report_threshold_percent: 50,
  auto_hide_after_reports: 10,
};

let intervalIds: NodeJS.Timeout[] = [];

/**
 * Start all background tasks
 */
export function startBackgroundTasks(storage: Storage, config?: Partial<TaskConfig>) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  logger.info("Starting background tasks...");
  
  // Convert to milliseconds
  const moderationIntervalMs = cfg.moderation_check_hours * 60 * 60 * 1000;
  const snapshotIntervalMs = cfg.metrics_snapshot_days * 24 * 60 * 60 * 1000;
  
  // Run moderation check every 24h
  const moderationInterval = setInterval(() => {
    runModerationCheck(storage, cfg);
  }, moderationIntervalMs);
  intervalIds.push(moderationInterval);
  
  // Run metrics snapshot every 7 days
  const snapshotInterval = setInterval(() => {
    runMetricsSnapshot(storage);
  }, snapshotIntervalMs);
  intervalIds.push(snapshotInterval);
  
  // Run initial checks after 1 minute (let server start)
  setTimeout(() => {
    runModerationCheck(storage, cfg);
  }, 60 * 1000);
  
  logger.info(`Moderation check: every ${cfg.moderation_check_hours}h`);
  logger.info(`Metrics snapshot: every ${cfg.metrics_snapshot_days} days`);
}

/**
 * Stop all background tasks
 */
export function stopBackgroundTasks() {
  intervalIds.forEach(id => clearInterval(id));
  intervalIds = [];
  logger.info("Background tasks stopped");
}

/**
 * Check posts for banishment based on report ratio
 */
function runModerationCheck(storage: Storage, config: TaskConfig) {
  logger.info("Running moderation check...");
  
  try {
    // Get all posts
    const { posts } = storage.listPosts({ limit: 1000 });
    let flaggedCount = 0;
    let hiddenCount = 0;
    
    for (const post of posts) {
      const votes = storage.getVoteCounts(post.cid);
      const totalVotes = votes.up + votes.down;
      
      // Skip posts with too few votes
      if (totalVotes < 5) continue;
      
      // Calculate report ratio
      const reportRatio = (votes.reports / (totalVotes || 1)) * 100;
      
      // If report ratio exceeds threshold, flag for review
      if (reportRatio >= config.report_threshold_percent) {
        flaggedCount++;
        logger.warn(`Post ${post.cid} flagged: ${reportRatio.toFixed(1)}% reports`);
        
        // Auto-hide if too many reports
        if (votes.reports >= config.auto_hide_after_reports) {
          hiddenCount++;
          // Update post level to -1 (hidden)
          storage.updatePostLevel(post.cid, -1);
          logger.info(`Post ${post.cid} auto-hidden: ${votes.reports} reports`);
        }
      }
    }
    
    logger.info(`Moderation check complete: ${flaggedCount} flagged, ${hiddenCount} hidden`);
    
    // Save moderation result to snapshots
    storage.createModerationSnapshot({
      timestamp: Date.now(),
      postsChecked: posts.length,
      postsFlagged: flaggedCount,
      postsHidden: hiddenCount,
    });
    
  } catch (error: any) {
    logger.error("Moderation check failed:", error.message);
  }
}

/**
 * Create metrics snapshot (votes, comments, saves)
 */
function runMetricsSnapshot(storage: Storage) {
  logger.info("Creating metrics snapshot...");
  
  try {
    // Get all posts
    const { posts, total } = storage.listPosts({ limit: 10000 });
    
    let totalVotesUp = 0;
    let totalVotesDown = 0;
    let totalReports = 0;
    let totalComments = 0;
    
    for (const post of posts) {
      const votes = storage.getVoteCounts(post.cid);
      totalVotesUp += votes.up;
      totalVotesDown += votes.down;
      totalReports += votes.reports;
      totalComments += storage.countComments(post.cid);
    }
    
    const snapshot = {
      timestamp: Date.now(),
      totalPosts: total,
      totalVotesUp,
      totalVotesDown,
      totalReports,
      totalComments,
      totalSavedPosts: storage.getTotalSavedPosts(),
    };
    
    // Save snapshot
    storage.createMetricsSnapshot(snapshot);
    
    logger.info(`Metrics snapshot created:
      Posts: ${total}
      Votes: ${totalVotesUp} up / ${totalVotesDown} down
      Reports: ${totalReports}
      Comments: ${totalComments}
    `);
    
  } catch (error: any) {
    logger.error("Metrics snapshot failed:", error.message);
  }
}

export default {
  startBackgroundTasks,
  stopBackgroundTasks,
};
