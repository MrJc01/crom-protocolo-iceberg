/**
 * API Route: /api/identity/import
 * Import identity from mnemonic
 */

import type { NextApiRequest, NextApiResponse } from "next";

const DAEMON_URL = process.env.DAEMON_URL || "http://localhost:8420";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { mnemonic } = req.body;

  if (!mnemonic) {
    return res.status(400).json({ error: "Mnemônico é obrigatório" });
  }

  try {
    // Forward to daemon
    const daemonRes = await fetch(`${DAEMON_URL}/identity/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mnemonic }),
    });

    const data = await daemonRes.json();
    return res.status(daemonRes.status).json(data);
  } catch (error) {
    console.error("Error importing identity:", error);
    return res.status(500).json({ 
      error: "Erro ao conectar com o daemon. Verifique se está rodando." 
    });
  }
}
