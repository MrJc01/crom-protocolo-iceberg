/**
 * Consensus API Routes
 * 
 * Endpoints for level progression and consensus metrics
 */

import { Router, Request, Response } from "express";
import { Storage } from "../storage";
import { ConsensusEngine } from "../consensus";
import { ibgeService } from "../ibge";
import { consensusLogger as logger } from "../logger";

const router = Router();

// GET /consensus/:cid - Get consensus metrics for a post
router.get("/:cid", async (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { cid } = req.params;

    const post = storage.getPost(cid);
    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const votes = storage.getVoteCounts(cid);
    const commentCount = storage.countComments(cid);
    const reports = storage.getReportsByTarget(cid);
    const reportCount = reports.filter(r => r.status === "pending").length;

    // Calculate progress to next level
    const consensus = new ConsensusEngine(storage);
    const currentLevel = post.level;
    
    // Parse region for geographic data
    const regionData = ibgeService.parseRegionCode(post.region);
    
    // Get population threshold
    let populationThreshold = 100;
    if (regionData.city) {
      // Try to get from IBGE (simplified)
      populationThreshold = ibgeService.calculateThreshold(100000);
    }

    // Calculate progress percentages for next level
    const levelRequirements = {
      1: { minScore: 5, minVotes: 3 },
      2: { minScore: 20, minVotes: 10, minHours: 24, maxReportRatio: 0.3 },
      3: { minScore: 100, minVotes: 50, minDays: 7 },
    };

    let nextLevel = currentLevel < 3 ? currentLevel + 1 : null;
    let progress = null;

    if (nextLevel && levelRequirements[nextLevel as keyof typeof levelRequirements]) {
      const req = levelRequirements[nextLevel as keyof typeof levelRequirements];
      const ageHours = (Date.now() - post.createdAt) / (1000 * 60 * 60);
      const ageDays = ageHours / 24;
      const reportRatio = votes.up + votes.down > 0 
        ? reportCount / (votes.up + votes.down) 
        : 0;

      progress = {
        score: {
          current: votes.score,
          required: req.minScore,
          percentage: Math.min(100, (votes.score / req.minScore) * 100),
        },
        votes: {
          current: votes.up + votes.down,
          required: req.minVotes,
          percentage: Math.min(100, ((votes.up + votes.down) / req.minVotes) * 100),
        },
        age: "minHours" in req ? {
          currentHours: Math.floor(ageHours),
          requiredHours: req.minHours,
          percentage: Math.min(100, (ageHours / req.minHours) * 100),
        } : "minDays" in req ? {
          currentDays: Math.floor(ageDays),
          requiredDays: req.minDays,
          percentage: Math.min(100, (ageDays / req.minDays) * 100),
        } : undefined,
        reportRatio: "maxReportRatio" in req ? {
          current: Math.round(reportRatio * 100),
          maximum: Math.round(req.maxReportRatio * 100),
          passing: reportRatio <= req.maxReportRatio,
        } : undefined,
      };
    }

    logger.info({ cid: cid.slice(0, 16), currentLevel, nextLevel }, "Consensus check");

    res.json({
      cid,
      currentLevel,
      levelName: getLevelName(currentLevel),
      nextLevel,
      nextLevelName: nextLevel ? getLevelName(nextLevel) : null,
      progress,
      metrics: {
        upvotes: votes.up,
        downvotes: votes.down,
        score: votes.score,
        comments: commentCount,
        pendingReports: reportCount,
        ageHours: Math.floor((Date.now() - post.createdAt) / (1000 * 60 * 60)),
      },
      region: {
        code: post.region,
        ...regionData,
      },
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Consensus check failed");
    res.status(500).json({ error: error.message });
  }
});

// GET /consensus/stats - Get network-wide consensus statistics
router.get("/", async (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;

    const { posts, total } = storage.listPosts({ limit: 1000 });

    const levelCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
    let totalVotes = 0;
    let totalComments = 0;

    for (const post of posts) {
      levelCounts[post.level as keyof typeof levelCounts]++;
      const votes = storage.getVoteCounts(post.cid);
      totalVotes += votes.up + votes.down;
      totalComments += storage.countComments(post.cid);
    }

    const { reports } = storage.listReports({ status: "pending" });

    res.json({
      totalPosts: total,
      levelDistribution: {
        wild: levelCounts[0],
        regional: levelCounts[1],
        surface: levelCounts[2],
        legacy: levelCounts[3],
      },
      totalVotes,
      totalComments,
      pendingReports: reports.length,
      averageLevel: posts.length > 0
        ? (posts.reduce((sum, p) => sum + p.level, 0) / posts.length).toFixed(2)
        : 0,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Stats fetch failed");
    res.status(500).json({ error: error.message });
  }
});

// POST /consensus/:cid/recalculate - Force recalculate level
router.post("/:cid/recalculate", async (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { cid } = req.params;

    const post = storage.getPost(cid);
    if (!post) {
      return res.status(404).json({ error: "Post não encontrado" });
    }

    const consensus = new ConsensusEngine(storage);
    const newLevel = consensus.recalculateLevel(cid);

    logger.info({ cid: cid.slice(0, 16), oldLevel: post.level, newLevel }, "Level recalculated");

    res.json({
      cid,
      previousLevel: post.level,
      newLevel,
      changed: newLevel !== post.level,
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Recalculate failed");
    res.status(500).json({ error: error.message });
  }
});

function getLevelName(level: number): string {
  const names: Record<number, string> = {
    0: "Wild",
    1: "Regional",
    2: "Surface",
    3: "Legacy",
  };
  return names[level] || "Unknown";
}

export const consensusRouter = router;
