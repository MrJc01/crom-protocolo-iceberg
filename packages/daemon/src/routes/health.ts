/**
 * Rota /health - Status do daemon
 */

import { Router, Request, Response } from "express";

export const healthRouter = Router();

healthRouter.get("/", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    version: "0.1.0",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});
