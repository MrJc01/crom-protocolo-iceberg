/**
 * Bitcoin Integration
 * 
 * Geração de endereços Bitcoin para bounties e posts pagos.
 * Usa bitcoinjs-lib (instalar: npm install bitcoinjs-lib @noble/secp256k1)
 */

import * as crypto from "crypto";

// Simples gerador de endereço Bitcoin (sem dependência externa pesada)
// Para produção, usar bitcoinjs-lib completo

/**
 * Interface para informações de carteira Bitcoin
 */
export interface BitcoinWallet {
  address: string;
  network: "mainnet" | "testnet";
  createdAt: number;
}

/**
 * Gera um endereço Bitcoin simples baseado na public key do usuário
 * NOTA: Para produção, usar implementação completa com bitcoinjs-lib
 */
export function generateBitcoinAddress(publicKey: string, network: "mainnet" | "testnet" = "mainnet"): string {
  // Derivar endereço a partir da public key usando SHA256 + RIPEMD160
  const hash = crypto.createHash("sha256").update(publicKey).digest();
  const ripemd = crypto.createHash("ripemd160").update(hash).digest("hex");
  
  // Prefixo de versão (mainnet = 0x00, testnet = 0x6F)
  const versionPrefix = network === "mainnet" ? "1" : "m";
  
  // Simplificação: retorna um pseudo-endereço baseado no hash
  // Para uso real, implementar encoding Base58Check completo
  return versionPrefix + ripemd.slice(0, 33);
}

/**
 * Valida formato básico de endereço Bitcoin
 */
export function isValidBitcoinAddress(address: string): boolean {
  // Validação básica de formato
  if (!address) return false;
  
  // Mainnet addresses começam com 1, 3 ou bc1
  // Testnet addresses começam com m, n, 2 ou tb1
  const mainnetRegex = /^(1|3)[a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-zA-HJ-NP-Z0-9]{39,59}$/;
  const testnetRegex = /^(m|n|2)[a-km-zA-HJ-NP-Z1-9]{25,34}$|^tb1[a-zA-HJ-NP-Z0-9]{39,59}$/;
  
  return mainnetRegex.test(address) || testnetRegex.test(address);
}

/**
 * Gera QR code data URL para um endereço Bitcoin
 */
export function generateBitcoinQRData(address: string, amount?: number): string {
  let uri = `bitcoin:${address}`;
  if (amount && amount > 0) {
    uri += `?amount=${amount}`;
  }
  return uri;
}

/**
 * Interface para bounty de post
 */
export interface PostBounty {
  postCid: string;
  address: string;
  amount: number; // em satoshis
  label?: string;
  status: "active" | "claimed" | "expired";
  createdAt: number;
  claimedBy?: string;
  claimedAt?: number;
}

/**
 * Formata valor de satoshis para BTC
 */
export function satoshisToBTC(satoshis: number): string {
  return (satoshis / 100_000_000).toFixed(8);
}

/**
 * Converte BTC para satoshis
 */
export function btcToSatoshis(btc: number): number {
  return Math.floor(btc * 100_000_000);
}

/**
 * Router para endpoints de Bitcoin
 */
import { Router, Request, Response } from "express";

export const bitcoinRouter = Router();

// GET /bitcoin/address - Gerar endereço para o usuário atual
bitcoinRouter.get("/address", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const identity = storage.getIdentity();
  
  if (!identity) {
    return res.status(401).json({ error: "Identidade não configurada" });
  }
  
  // Se já tem endereço salvo, retornar
  if (identity.btcAddress) {
    return res.json({ 
      address: identity.btcAddress,
      network: "mainnet",
      qrData: generateBitcoinQRData(identity.btcAddress)
    });
  }
  
  // Gerar novo endereço
  const address = generateBitcoinAddress(identity.publicKey);
  
  // Salvar no storage
  storage.setBtcAddress(identity.publicKey, address);
  
  res.json({
    address,
    network: "mainnet",
    qrData: generateBitcoinQRData(address),
    message: "Endereço Bitcoin gerado com sucesso"
  });
});

// POST /bitcoin/address - Definir endereço Bitcoin personalizado
bitcoinRouter.post("/address", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const identity = storage.getIdentity();
  
  if (!identity) {
    return res.status(401).json({ error: "Identidade não configurada" });
  }
  
  const { address } = req.body;
  
  if (!address) {
    return res.status(400).json({ error: "Endereço é obrigatório" });
  }
  
  if (!isValidBitcoinAddress(address)) {
    return res.status(400).json({ error: "Endereço Bitcoin inválido" });
  }
  
  storage.setBtcAddress(identity.publicKey, address);
  
  res.json({
    address,
    qrData: generateBitcoinQRData(address),
    message: "Endereço Bitcoin salvo com sucesso"
  });
});

// GET /bitcoin/validate/:address - Validar endereço
bitcoinRouter.get("/validate/:address", (req: Request, res: Response) => {
  const { address } = req.params;
  const valid = isValidBitcoinAddress(address);
  
  res.json({ 
    address, 
    valid,
    message: valid ? "Endereço válido" : "Endereço inválido"
  });
});

// POST /bitcoin/bounty - Criar bounty para um post
bitcoinRouter.post("/bounty", (req: Request, res: Response) => {
  const storage = (req as any).storage;
  const identity = storage.getIdentity();
  
  if (!identity) {
    return res.status(401).json({ error: "Identidade não configurada" });
  }
  
  const { postCid, amount, label } = req.body;
  
  if (!postCid || !amount) {
    return res.status(400).json({ error: "postCid e amount são obrigatórios" });
  }
  
  // Verificar se post existe
  const post = storage.getPost(postCid);
  if (!post) {
    return res.status(404).json({ error: "Post não encontrado" });
  }
  
  // Gerar endereço específico para o bounty (ou usar do usuário)
  const address = identity.btcAddress || generateBitcoinAddress(identity.publicKey);
  
  const bounty: PostBounty = {
    postCid,
    address,
    amount: btcToSatoshis(amount),
    label,
    status: "active",
    createdAt: Date.now()
  };
  
  // Atualizar post com bounty
  try {
    (storage as any).db.prepare(
      "UPDATE posts SET btcBounty = ? WHERE cid = ?"
    ).run(JSON.stringify(bounty), postCid);
    
    res.json({
      bounty,
      qrData: generateBitcoinQRData(address, amount),
      btcAmount: satoshisToBTC(bounty.amount)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
