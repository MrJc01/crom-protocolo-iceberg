/**
 * Hashtags API Routes
 * 
 * Endpoints para busca e listagem de hashtags
 */

import { Router, Request, Response } from "express";
import { Storage } from "../storage";

const router = Router();

// GET /hashtags/related - Listar posts relacionados por hashtags
router.get("/related", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const postCid = req.query.postCid as string;
    const hashtags = (req.query.hashtags as string)?.split(",").filter(Boolean) || [];
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    if (!hashtags.length) {
      return res.json({ posts: [], total: 0 });
    }
    
    // Get posts that share at least one hashtag, excluding the current post
    const relatedPosts: any[] = [];
    const seenCids = new Set([postCid]);
    
    for (const tag of hashtags) {
      const result = storage.getPostsByHashtag(tag, 20, 0);
      for (const post of result.posts) {
        if (!seenCids.has(post.cid)) {
          seenCids.add(post.cid);
          relatedPosts.push({
            ...post,
            votes: storage.getVoteCounts(post.cid),
          });
        }
      }
      if (relatedPosts.length >= limit) break;
    }
    
    res.json({
      posts: relatedPosts.slice(0, limit),
      total: relatedPosts.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /hashtags/trending - Listar hashtags mais populares
router.get("/trending", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const trending = storage.getTrendingHashtags(limit);
    
    res.json({
      hashtags: trending
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /hashtags/:tag - Listar posts com uma hashtag
router.get("/:tag", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { tag } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    const result = storage.getPostsByHashtag(tag, limit, offset);
    
    // Adicionar contagem de votos e comentários para cada post
    const postsWithMeta = result.posts.map((post: any) => ({
      ...post,
      votes: storage.getVoteCounts(post.cid),
      commentCount: storage.countComments(post.cid),
    }));
    
    res.json({
      tag: tag.toLowerCase(),
      posts: postsWithMeta,
      total: result.total,
      hasMore: result.total > offset + result.posts.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const hashtagsRouter = router;
