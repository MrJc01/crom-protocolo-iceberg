/**
 * Rota /votes - Sistema de votação
 */

import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

export const votesRouter = Router();

/**
 * GET /votes/:cid - Obter votos de um post
 */
votesRouter.get("/:cid", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const { cid } = req.params;

  // Verificar se post existe
  const post = storage.getPost(cid);
  if (!post) {
    return res.status(404).json({ error: "Post não encontrado" });
  }

  const counts = storage.getVoteCounts(cid);

  // Verificar se usuário já votou
  const identity = storage.getIdentity();
  let myVote = null;
  if (identity) {
    const vote = storage.getVote(cid, identity.publicKey);
    if (vote) {
      myVote = {
        type: vote.type,
        timestamp: vote.createdAt,
      };
    }
  }

  res.json({
    ...counts,
    level: post.level,
    myVote,
  });
});

/**
 * POST /votes/:cid - Votar em um post
 */
votesRouter.post("/:cid", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const { cid } = req.params;
  const { type } = req.body;

  // Validar tipo de voto
  if (!["up", "down", "report"].includes(type)) {
    return res.status(400).json({
      error: "Tipo de voto inválido. Use: up, down, ou report",
    });
  }

  // Verificar identidade
  const identity = storage.getIdentity();
  if (!identity) {
    return res.status(401).json({
      error: "Nenhuma identidade configurada",
    });
  }

  // Verificar se post existe
  const post = storage.getPost(cid);
  if (!post) {
    return res.status(404).json({ error: "Post não encontrado" });
  }

  // Não pode votar no próprio post
  if (post.author === identity.publicKey) {
    return res.status(403).json({
      error: "Você não pode votar no seu próprio post",
    });
  }

  // Registrar voto (substitui voto anterior se existir)
  storage.castVote({
    id: uuidv4(),
    postCid: cid,
    voter: identity.publicKey,
    type: type as "up" | "down" | "report",
    weight: 1.0, // TODO: calcular baseado na reputação
    createdAt: Date.now(),
  });

  // Recalcular contagem
  const counts = storage.getVoteCounts(cid);

  // TODO: Verificar se deve promover/rebaixar nível

  res.json({
    success: true,
    yourVote: type,
    newScore: counts.score,
    counts,
  });
});

/**
 * DELETE /votes/:cid - Remover voto
 */
votesRouter.delete("/:cid", (req: Request, res: Response) => {
  // Por simplicidade, não implementamos remoção de voto
  // Usuário pode mudar o voto fazendo POST novamente
  res.status(501).json({
    error: "Para mudar seu voto, faça um novo POST com o tipo desejado",
  });
});
