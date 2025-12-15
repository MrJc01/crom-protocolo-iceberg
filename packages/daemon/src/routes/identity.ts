/**
 * Rota /identity - Gerenciamento de identidade
 */

import { Router, Request, Response } from "express";
import * as nacl from "tweetnacl";
import * as bip39 from "bip39";

export const identityRouter = Router();

// ==========================================
// FUNÇÕES DE CRIPTOGRAFIA
// ==========================================

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const PUBLIC_KEY_PREFIX = "ed25519:";

function encodeBase58(bytes: Uint8Array): string {
  let leadingZeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    leadingZeros++;
  }

  const hex = Buffer.from(bytes).toString("hex");
  let num = hex ? BigInt("0x" + hex) : BigInt(0);

  if (num === BigInt(0)) {
    return BASE58_ALPHABET[0].repeat(Math.max(1, leadingZeros));
  }

  let result = "";
  while (num > 0) {
    const remainder = Number(num % BigInt(58));
    result = BASE58_ALPHABET[remainder] + result;
    num = num / BigInt(58);
  }

  return BASE58_ALPHABET[0].repeat(leadingZeros) + result;
}

function exportSecretKey(secretKey: Uint8Array): string {
  return (
    "0x" +
    Array.from(secretKey)
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// ==========================================
// ROTAS
// ==========================================

/**
 * GET /identity - Obter identidade atual
 */
identityRouter.get("/", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const identity = storage.getIdentity();

  if (!identity) {
    return res.status(404).json({ error: "Nenhuma identidade configurada" });
  }

  res.json({
    publicKey: identity.publicKey,
    createdAt: identity.createdAt,
  });
});

/**
 * GET /identity/:pubkey/comments - Get user's comments
 */
identityRouter.get("/:pubkey/comments", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const { pubkey } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const result = storage.getUserComments(pubkey, limit, offset);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /identity/:pubkey/votes - Get user's votes
 */
identityRouter.get("/:pubkey/votes", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const { pubkey } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  try {
    const result = storage.getUserVotes(pubkey, limit, offset);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /identity - Criar nova identidade
 */
identityRouter.post("/", async (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const { force } = req.body;

  // Verificar se já existe
  const existing = storage.getIdentity();
  if (existing && !force) {
    return res.status(409).json({
      error: "Identidade já existe. Use force=true para sobrescrever.",
      publicKey: existing.publicKey,
    });
  }

  try {
    // Gerar nova identidade
    const entropy = nacl.randomBytes(32);
    const mnemonic = bip39.entropyToMnemonic(Buffer.from(entropy));
    const seed = await bip39.mnemonicToSeed(mnemonic);
    const keypair = nacl.sign.keyPair.fromSeed(
      new Uint8Array(seed.slice(0, 32))
    );

    const publicKey = PUBLIC_KEY_PREFIX + encodeBase58(keypair.publicKey);
    const secretKeyHex = exportSecretKey(keypair.secretKey);

    // Salvar
    storage.saveIdentity({
      publicKey,
      secretKey: secretKeyHex,
      createdAt: Date.now(),
    });

    res.status(201).json({
      publicKey,
      mnemonic, // IMPORTANTE: Retornar apenas uma vez!
      warning: "Guarde o mnemonic em local seguro. Esta é a única vez que será exibido.",
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar identidade" });
  }
});

/**
 * DELETE /identity - Remover identidade
 */
identityRouter.delete("/", (req: Request, res: Response) => {
  const storage = (req as any).storage;

  storage.deleteIdentity();

  res.json({ success: true, message: "Identidade removida" });
});
