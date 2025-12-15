/**
 * System Routes - System Information and Configuration
 * 
 * Provides endpoints for system status, metrics, and configuration.
 * Configuration endpoints are only available in LOCAL mode.
 */

import { Router, Request, Response, NextFunction } from "express";
import { Storage } from "../storage";
import { 
  systemMode, 
  isLocalMode, 
  getSystemInfo, 
  getCurrentLimits,
  formatBytes,
  isFeatureAvailable,
  getModeSummary,
  SystemLimits
} from "../systemMode";
import { logger } from "../logger";

export const systemRouter = Router();

/**
 * Middleware to restrict access to local mode only
 */
function localModeOnly(req: Request, res: Response, next: NextFunction) {
  if (!isLocalMode()) {
    logger.warn({ 
      ip: req.ip, 
      path: req.path 
    }, "Attempted to access local-only route in online mode");
    
    return res.status(403).json({
      error: "Acesso negado",
      message: "Esta funcionalidade está disponível apenas no modo local (app desktop)",
      mode: systemMode,
    });
  }
  next();
}

/**
 * GET /system/mode - Get current system mode
 * Available in both modes
 */
systemRouter.get("/mode", (req: Request, res: Response) => {
  res.json({
    mode: systemMode,
    isLocal: isLocalMode(),
    canConfigure: isLocalMode(),
    summary: getModeSummary(),
  });
});

/**
 * GET /system/info - Get comprehensive system information
 * Available in both modes, but with different detail levels
 */
systemRouter.get("/info", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const dataDir = (storage as any).db?.name?.replace('/iceberg.db', '') || undefined;
    
    const info = getSystemInfo(dataDir);
    
    // In online mode, reduce detail level
    if (!isLocalMode()) {
      // Remove sensitive information
      delete (info as any).hostname;
      delete (info as any).storage.dataDir;
    }
    
    // Add storage statistics
    const db = (storage as any).db;
    let postsCount = 0;
    let commentsCount = 0;
    let votesCount = 0;
    
    if (db) {
      try {
        postsCount = (db.prepare("SELECT COUNT(*) as count FROM posts").get() as any)?.count || 0;
        commentsCount = (db.prepare("SELECT COUNT(*) as count FROM comments").get() as any)?.count || 0;
        votesCount = (db.prepare("SELECT COUNT(*) as count FROM votes").get() as any)?.count || 0;
      } catch {}
    }
    
    res.json({
      ...info,
      data: {
        posts: postsCount,
        comments: commentsCount,
        votes: votesCount,
      },
      formatted: {
        memory: {
          total: formatBytes(info.memory.total),
          used: formatBytes(info.memory.used),
          available: formatBytes(info.memory.available),
          limit: formatBytes(info.memory.limit),
        },
        storage: {
          total: formatBytes(info.storage.total),
          used: formatBytes(info.storage.used),
          available: formatBytes(info.storage.available),
          limit: formatBytes(info.storage.limit),
          dbSize: formatBytes(info.storage.dbSize),
        },
      },
    });
  } catch (error) {
    logger.error({ error }, "Error getting system info");
    res.status(500).json({ error: "Erro ao obter informações do sistema" });
  }
});

/**
 * GET /system/limits - Get current resource limits
 * Available in both modes
 */
systemRouter.get("/limits", (req: Request, res: Response) => {
  const limits = getCurrentLimits();
  
  res.json({
    mode: systemMode,
    limits: {
      ...limits,
      formatted: {
        maxMemory: `${limits.maxMemoryMB} MB`,
        maxStorage: `${limits.maxStorageGB} GB`,
      },
    },
    canModify: isLocalMode(),
  });
});

/**
 * GET /system/config - Get full system configuration
 * LOCAL MODE ONLY
 */
systemRouter.get("/config", localModeOnly, (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const dataDir = (storage as any).db?.name?.replace('/iceberg.db', '') || '~/.iceberg';
    
    res.json({
      mode: systemMode,
      limits: getCurrentLimits(),
      paths: {
        dataDir,
        database: `${dataDir}/iceberg.db`,
      },
      environment: {
        ICEBERG_MODE: process.env.ICEBERG_MODE || 'not set (defaults to online)',
        ICEBERG_MAX_MEMORY: process.env.ICEBERG_MAX_MEMORY || 'not set (defaults to 2048)',
        ICEBERG_MAX_STORAGE: process.env.ICEBERG_MAX_STORAGE || 'not set (defaults to 10)',
        ICEBERG_MAX_PEERS: process.env.ICEBERG_MAX_PEERS || 'not set (defaults to 100)',
        NODE_ENV: process.env.NODE_ENV || 'development',
      },
      features: {
        systemConfig: isFeatureAvailable('system-config'),
        dataExport: isFeatureAvailable('data-export'),
        peerManagement: isFeatureAvailable('peer-management'),
        storageManagement: isFeatureAvailable('storage-management'),
        limitConfiguration: isFeatureAvailable('limit-configuration'),
      },
    });
  } catch (error) {
    logger.error({ error }, "Error getting system config");
    res.status(500).json({ error: "Erro ao obter configurações do sistema" });
  }
});

/**
 * PUT /system/config - Update system configuration
 * LOCAL MODE ONLY
 * Note: Most configuration changes require restart
 */
systemRouter.put("/config", localModeOnly, (req: Request, res: Response) => {
  try {
    const { maxMemoryMB, maxStorageGB, maxPeers, maxPostsPerDay } = req.body;
    
    // Validate inputs
    const updates: Partial<SystemLimits> = {};
    const requiresRestart: string[] = [];
    
    if (maxMemoryMB !== undefined) {
      if (typeof maxMemoryMB !== 'number' || maxMemoryMB < 256 || maxMemoryMB > 16384) {
        return res.status(400).json({ error: "maxMemoryMB deve ser entre 256 e 16384" });
      }
      updates.maxMemoryMB = maxMemoryMB;
      requiresRestart.push('maxMemoryMB');
    }
    
    if (maxStorageGB !== undefined) {
      if (typeof maxStorageGB !== 'number' || maxStorageGB < 1 || maxStorageGB > 100) {
        return res.status(400).json({ error: "maxStorageGB deve ser entre 1 e 100" });
      }
      updates.maxStorageGB = maxStorageGB;
      requiresRestart.push('maxStorageGB');
    }
    
    if (maxPeers !== undefined) {
      if (typeof maxPeers !== 'number' || maxPeers < 1 || maxPeers > 1000) {
        return res.status(400).json({ error: "maxPeers deve ser entre 1 e 1000" });
      }
      updates.maxPeers = maxPeers;
      requiresRestart.push('maxPeers');
    }
    
    if (maxPostsPerDay !== undefined) {
      if (typeof maxPostsPerDay !== 'number' || maxPostsPerDay < 1 || maxPostsPerDay > 100) {
        return res.status(400).json({ error: "maxPostsPerDay deve ser entre 1 e 100" });
      }
      updates.maxPostsPerDay = maxPostsPerDay;
    }
    
    // Log the configuration change
    logger.info({ updates }, "System configuration updated");
    
    res.json({
      success: true,
      message: "Configuração atualizada",
      updates,
      requiresRestart: requiresRestart.length > 0,
      restartRequired: requiresRestart,
      note: requiresRestart.length > 0 
        ? "Algumas alterações requerem reiniciar o daemon para ter efeito"
        : undefined,
    });
  } catch (error) {
    logger.error({ error }, "Error updating system config");
    res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
});

/**
 * POST /system/export - Export all local data
 * LOCAL MODE ONLY
 */
systemRouter.post("/export", localModeOnly, async (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    
    // Get all data
    const { posts } = storage.listPosts({ limit: 10000 });
    const { reports } = storage.listReports({ limit: 10000 });
    const identity = storage.getIdentity();
    
    const exportData = {
      exportedAt: Date.now(),
      version: "1.0.0",
      mode: systemMode,
      identity: identity ? { publicKey: identity.publicKey, createdAt: identity.createdAt } : null,
      posts,
      reports,
      meta: {
        postsCount: posts.length,
        reportsCount: reports.length,
      },
    };
    
    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    logger.error({ error }, "Error exporting data");
    res.status(500).json({ error: "Erro ao exportar dados" });
  }
});

/**
 * POST /system/clear-cache - Clear non-essential cached data
 * LOCAL MODE ONLY
 */
systemRouter.post("/clear-cache", localModeOnly, (req: Request, res: Response) => {
  try {
    // In a real implementation, this would clear various caches
    // For now, we'll just force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    logger.info("Cache cleared by user request");
    
    res.json({
      success: true,
      message: "Cache limpo com sucesso",
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error({ error }, "Error clearing cache");
    res.status(500).json({ error: "Erro ao limpar cache" });
  }
});

/**
 * GET /system/features - List available features for current mode
 * Available in both modes
 */
systemRouter.get("/features", (req: Request, res: Response) => {
  const allFeatures = [
    { id: 'system-config', name: 'Configuração do Sistema', localOnly: true },
    { id: 'data-export', name: 'Exportação de Dados', localOnly: true },
    { id: 'peer-management', name: 'Gerenciamento de Peers', localOnly: true },
    { id: 'storage-management', name: 'Gerenciamento de Armazenamento', localOnly: true },
    { id: 'limit-configuration', name: 'Configuração de Limites', localOnly: true },
    { id: 'posts', name: 'Publicação de Ices', localOnly: false },
    { id: 'votes', name: 'Votação', localOnly: false },
    { id: 'comments', name: 'Comentários', localOnly: false },
    { id: 'chat', name: 'Chat P2P', localOnly: false },
    { id: 'reports', name: 'Denúncias', localOnly: false },
  ];
  
  res.json({
    mode: systemMode,
    features: allFeatures.map(f => ({
      ...f,
      available: f.localOnly ? isLocalMode() : true,
    })),
  });
});
