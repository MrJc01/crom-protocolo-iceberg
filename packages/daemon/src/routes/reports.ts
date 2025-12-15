/**
 * Reports API Routes
 * 
 * Endpoints para denúncias de posts e comentários
 */

import { Router, Request, Response } from "express";
import { Storage, Report } from "../storage";
import * as crypto from "crypto";

const router = Router();

// Gerar ID para reports
function generateReportId(): string {
  return "report_" + crypto.randomBytes(16).toString("hex");
}

// POST /reports - Criar denúncia
router.post("/", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { targetCid, targetType, reason } = req.body;

    // Validações
    if (!targetCid) {
      return res.status(400).json({ error: "targetCid é obrigatório" });
    }
    if (!targetType || !["post", "comment"].includes(targetType)) {
      return res.status(400).json({ error: "targetType deve ser 'post' ou 'comment'" });
    }
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: "reason é obrigatório" });
    }

    // Verificar se target existe
    if (targetType === "post") {
      const post = storage.getPost(targetCid);
      if (!post) {
        return res.status(404).json({ error: "Post não encontrado" });
      }
    } else {
      const comment = storage.getComment(targetCid);
      if (!comment) {
        return res.status(404).json({ error: "Comentário não encontrado" });
      }
    }

    // Obter identidade do reporter
    const identity = storage.getIdentity();
    if (!identity) {
      return res.status(401).json({ error: "Identidade não configurada" });
    }

    const report: Report = {
      id: generateReportId(),
      targetCid,
      targetType,
      reporter: identity.publicKey,
      reason: reason.trim(),
      status: "pending",
      createdAt: Date.now(),
      resolvedAt: null
    };

    storage.createReport(report);

    res.status(201).json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /reports - Listar denúncias (para auditores)
router.get("/", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { status, limit, offset } = req.query;

    const result = storage.listReports({
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /reports/:id - Obter denúncia específica
router.get("/:id", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { id } = req.params;

    const report = storage.getReport(id);
    if (!report) {
      return res.status(404).json({ error: "Denúncia não encontrada" });
    }

    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /reports/:id - Atualizar status (resolver/dispensar)
router.put("/:id", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["pending", "resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ error: "status deve ser 'pending', 'resolved' ou 'dismissed'" });
    }

    const report = storage.getReport(id);
    if (!report) {
      return res.status(404).json({ error: "Denúncia não encontrada" });
    }

    storage.updateReportStatus(id, status);

    res.json({ success: true, status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /reports/target/:cid - Denúncias de um target específico
router.get("/target/:cid", (req: Request, res: Response) => {
  try {
    const storage: Storage = (req as any).storage;
    const { cid } = req.params;

    const reports = storage.getReportsByTarget(cid);

    res.json({ reports, total: reports.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const reportsRouter = router;
