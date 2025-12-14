/**
 * Motor de Consenso do Protocolo Iceberg
 *
 * Gerencia a promoção e rebaixamento de níveis dos posts
 * baseado em votos da comunidade.
 *
 * Níveis:
 *   0 = Wild (novo, não validado)
 *   1 = Regional (validado localmente)
 *   2 = Surface (aceito pela rede ampla)
 *   3 = Legacy (registro histórico permanente)
 */

import { Storage, Post, Vote } from "./storage";
import * as fs from "fs";
import * as path from "path";

// Carregar regras de consenso do arquivo de configuração
function loadConsensusRules() {
  const defaultRules = {
    levels: {
      promotion: {
        wildToRegional: { minScore: 5, minVotes: 3 },
        regionalToSurface: { minScore: 20, minVotes: 10 },
        surfaceToLegacy: { minScore: 100, minVotes: 50 },
      },
      demotion: {
        legacyToSurface: { maxScore: -50 },
        surfaceToRegional: { maxScore: -10 },
        regionalToWild: { maxScore: -3 },
      },
    },
    spam: {
      minIntervalSeconds: 60,
      maxPostsPerHour: 10,
      reportThreshold: 5,
    },
    voting: {
      baseWeight: 1.0,
      reputationMultiplier: 0.1,
    },
  };

  try {
    const configPath = path.resolve(process.cwd(), "../../config/consensus_rules.json");
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return { ...defaultRules, ...config };
    }
  } catch {
    // Usar padrões
  }

  return defaultRules;
}

export class ConsensusEngine {
  private storage: Storage;
  private rules: ReturnType<typeof loadConsensusRules>;

  constructor(storage: Storage) {
    this.storage = storage;
    this.rules = loadConsensusRules();
  }

  /**
   * Recalcula o nível de um post baseado em seus votos
   */
  recalculateLevel(postCid: string): number {
    const post = this.storage.getPost(postCid);
    if (!post) return -1;

    const votes = this.storage.getVoteCounts(postCid);
    const currentLevel = post.level;
    let newLevel = currentLevel;

    // Verificar promoção
    if (currentLevel < 3) {
      newLevel = this.checkPromotion(currentLevel, votes.score, votes.up + votes.down);
    }

    // Verificar rebaixamento
    if (currentLevel > 0) {
      const demotionLevel = this.checkDemotion(currentLevel, votes.score, votes.reports);
      if (demotionLevel < newLevel) {
        newLevel = demotionLevel;
      }
    }

    // Atualizar se mudou
    if (newLevel !== currentLevel) {
      this.storage.updatePostLevel(postCid, newLevel);
      console.log(`[Consenso] Post ${postCid.slice(0, 16)}... : Nível ${currentLevel} → ${newLevel}`);
    }

    return newLevel;
  }

  private checkPromotion(currentLevel: number, score: number, totalVotes: number): number {
    const promo = this.rules.levels.promotion;

    if (currentLevel === 0 && score >= promo.wildToRegional.minScore && totalVotes >= promo.wildToRegional.minVotes) {
      return 1;
    }
    if (currentLevel === 1 && score >= promo.regionalToSurface.minScore && totalVotes >= promo.regionalToSurface.minVotes) {
      return 2;
    }
    if (currentLevel === 2 && score >= promo.surfaceToLegacy.minScore && totalVotes >= promo.surfaceToLegacy.minVotes) {
      return 3;
    }

    return currentLevel;
  }

  private checkDemotion(currentLevel: number, score: number, reports: number): number {
    const demo = this.rules.levels.demotion;

    // Reports demais = rebaixamento automático
    if (reports >= this.rules.spam.reportThreshold) {
      return Math.max(0, currentLevel - 1);
    }

    if (currentLevel === 3 && score <= demo.legacyToSurface.maxScore) {
      return 2;
    }
    if (currentLevel === 2 && score <= demo.surfaceToRegional.maxScore) {
      return 1;
    }
    if (currentLevel === 1 && score <= demo.regionalToWild.maxScore) {
      return 0;
    }

    return currentLevel;
  }

  /**
   * Verifica se um autor pode criar novo post (anti-spam)
   */
  canCreatePost(authorPublicKey: string): { allowed: boolean; reason?: string } {
    const result = this.storage.listPosts({ author: authorPublicKey, limit: 20 });
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // Contar posts na última hora
    const recentPosts = result.posts.filter((p) => p.createdAt > oneHourAgo);

    if (recentPosts.length >= this.rules.spam.maxPostsPerHour) {
      return { allowed: false, reason: `Limite de ${this.rules.spam.maxPostsPerHour} posts por hora atingido` };
    }

    // Verificar intervalo mínimo
    if (recentPosts.length > 0) {
      const lastPost = recentPosts[0];
      const timeSince = (now - lastPost.createdAt) / 1000;
      if (timeSince < this.rules.spam.minIntervalSeconds) {
        return {
          allowed: false,
          reason: `Aguarde ${Math.ceil(this.rules.spam.minIntervalSeconds - timeSince)}s para criar novo post`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Calcula o peso de um voto baseado na reputação
   */
  calculateVoteWeight(voterPublicKey: string): number {
    // Por enquanto, peso fixo. No futuro, considerar reputação.
    return this.rules.voting.baseWeight;
  }

  /**
   * Processa todos os posts e recalcula níveis
   */
  recalculateAllLevels(): { processed: number; changed: number } {
    const result = this.storage.listPosts({ limit: 1000 });
    let changed = 0;

    for (const post of result.posts) {
      const oldLevel = post.level;
      const newLevel = this.recalculateLevel(post.cid);
      if (newLevel !== oldLevel) changed++;
    }

    return { processed: result.posts.length, changed };
  }
}
