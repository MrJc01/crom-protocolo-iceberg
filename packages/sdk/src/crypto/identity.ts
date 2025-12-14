/**
 * @iceberg/sdk - Módulo de Identidade
 *
 * Gerenciamento de identidades criptográficas usando ED25519.
 * Baseado na documentação: docs/06_SEGURANCA_E_PRIVACIDADE.md
 */

import * as nacl from "tweetnacl";
import * as bip39 from "bip39";

// ============================================
// TIPOS
// ============================================

export interface Identity {
  /** Chave pública em formato base58 com prefixo ed25519: */
  publicKey: string;
  /** Chave secreta (64 bytes) */
  secretKey: Uint8Array;
  /** Timestamp de criação */
  createdAt: number;
}

export interface IdentityCreateResult {
  identity: Identity;
  /** Frase mnemônica de 24 palavras para backup */
  mnemonic: string;
}

export interface SignedMessage {
  /** Conteúdo original */
  content: string;
  /** Assinatura em base64 */
  signature: string;
  /** Chave pública do assinante */
  publicKey: string;
  /** Timestamp da assinatura */
  timestamp: number;
}

// ============================================
// CONSTANTES
// ============================================

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const PUBLIC_KEY_PREFIX = "ed25519:";

// ============================================
// FUNÇÕES DE ENCODING
// ============================================

/**
 * Codifica bytes em base58
 */
export function encodeBase58(bytes: Uint8Array): string {
  // Contar zeros à esquerda primeiro
  let leadingZeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    leadingZeros++;
  }

  // Converter bytes para BigInt
  const hex = Buffer.from(bytes).toString("hex");
  let num = hex ? BigInt("0x" + hex) : BigInt(0);

  // Se tudo é zero, retornar N caracteres '1'
  if (num === BigInt(0)) {
    return BASE58_ALPHABET[0].repeat(Math.max(1, leadingZeros));
  }

  // Converter para base58
  let result = "";
  while (num > 0) {
    const remainder = Number(num % BigInt(58));
    result = BASE58_ALPHABET[remainder] + result;
    num = num / BigInt(58);
  }

  // Adicionar '1' para cada zero à esquerda
  return BASE58_ALPHABET[0].repeat(leadingZeros) + result;
}

/**
 * Decodifica base58 para bytes
 */
export function decodeBase58(str: string): Uint8Array {
  let num = BigInt(0);

  for (const char of str) {
    const index = BASE58_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Caractere inválido em base58: ${char}`);
    }
    num = num * BigInt(58) + BigInt(index);
  }

  const hex = num.toString(16).padStart(64, "0");
  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }

  return bytes;
}

/**
 * Codifica bytes em base64
 */
export function encodeBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

/**
 * Decodifica base64 para bytes
 */
export function decodeBase64(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, "base64"));
}

// ============================================
// GERENCIAMENTO DE IDENTIDADE
// ============================================

/**
 * Gera uma nova identidade criptográfica
 *
 * @returns Identidade e frase mnemônica para backup
 *
 * @example
 * ```typescript
 * const { identity, mnemonic } = await createIdentity();
 * console.log('Guarde este mnemonic:', mnemonic);
 * console.log('Sua chave pública:', identity.publicKey);
 * ```
 */
export async function createIdentity(): Promise<IdentityCreateResult> {
  // Gerar 32 bytes de entropia aleatória
  const entropy = nacl.randomBytes(32);

  // Converter para mnemônico de 24 palavras
  const mnemonic = bip39.entropyToMnemonic(Buffer.from(entropy));

  // Derivar seed do mnemônico
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // Usar primeiros 32 bytes como seed ED25519
  const keypair = nacl.sign.keyPair.fromSeed(
    new Uint8Array(seed.slice(0, 32))
  );

  // Codificar chave pública em base58 com prefixo
  const publicKey = PUBLIC_KEY_PREFIX + encodeBase58(keypair.publicKey);

  const identity: Identity = {
    publicKey,
    secretKey: keypair.secretKey,
    createdAt: Date.now(),
  };

  return { identity, mnemonic };
}

/**
 * Importa identidade a partir de frase mnemônica
 *
 * @param mnemonic - Frase de 24 palavras
 * @returns Identidade recuperada
 *
 * @example
 * ```typescript
 * const identity = await importFromMnemonic('abandon ability able...');
 * ```
 */
export async function importFromMnemonic(mnemonic: string): Promise<Identity> {
  // Validar mnemônico
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Mnemônico inválido. Verifique as palavras.");
  }

  // Derivar seed
  const seed = await bip39.mnemonicToSeed(mnemonic);

  // Gerar keypair
  const keypair = nacl.sign.keyPair.fromSeed(
    new Uint8Array(seed.slice(0, 32))
  );

  const publicKey = PUBLIC_KEY_PREFIX + encodeBase58(keypair.publicKey);

  return {
    publicKey,
    secretKey: keypair.secretKey,
    createdAt: Date.now(),
  };
}

/**
 * Importa identidade a partir de chave secreta em hex
 *
 * @param secretKeyHex - Chave secreta em formato hexadecimal
 */
export function importFromSecretKey(secretKeyHex: string): Identity {
  // Remover prefixo 0x se presente
  const hex = secretKeyHex.replace(/^0x/, "");

  // Converter hex para bytes
  const secretKey = new Uint8Array(hex.length / 2);
  for (let i = 0; i < secretKey.length; i++) {
    secretKey[i] = parseInt(hex.substr(i * 2, 2), 16);
  }

  // Extrair chave pública dos últimos 32 bytes da secret key
  const publicKeyBytes = secretKey.slice(32, 64);
  const publicKey = PUBLIC_KEY_PREFIX + encodeBase58(publicKeyBytes);

  return {
    publicKey,
    secretKey,
    createdAt: Date.now(),
  };
}

/**
 * Exporta identidade para formato hexadecimal (para backup)
 */
export function exportSecretKey(identity: Identity): string {
  return (
    "0x" +
    Array.from(identity.secretKey)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

// ============================================
// ASSINATURA E VERIFICAÇÃO
// ============================================

/**
 * Assina uma mensagem com a chave privada
 *
 * @param message - Mensagem a ser assinada
 * @param identity - Identidade do assinante
 * @returns Mensagem assinada com metadados
 */
export function signMessage(
  message: string,
  identity: Identity
): SignedMessage {
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);

  // Criar assinatura
  const signature = nacl.sign.detached(messageBytes, identity.secretKey);

  return {
    content: message,
    signature: encodeBase64(signature),
    publicKey: identity.publicKey,
    timestamp: Date.now(),
  };
}

/**
 * Verifica se uma assinatura é válida
 *
 * @param signedMessage - Mensagem assinada
 * @returns true se a assinatura for válida
 */
export function verifySignature(signedMessage: SignedMessage): boolean {
  try {
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(signedMessage.content);

    // Extrair chave pública (remover prefixo ed25519:)
    const publicKeyStr = signedMessage.publicKey.replace(PUBLIC_KEY_PREFIX, "");
    const publicKey = decodeBase58(publicKeyStr);

    // Decodificar assinatura
    const signature = decodeBase64(signedMessage.signature);

    // Verificar
    return nacl.sign.detached.verify(messageBytes, signature, publicKey);
  } catch {
    return false;
  }
}

/**
 * Extrai o short ID (primeiros 8 caracteres) da chave pública
 */
export function getShortId(publicKey: string): string {
  const key = publicKey.replace(PUBLIC_KEY_PREFIX, "");
  return key.slice(0, 8);
}

/**
 * Valida se uma string é uma chave pública válida
 */
export function isValidPublicKey(publicKey: string): boolean {
  if (!publicKey.startsWith(PUBLIC_KEY_PREFIX)) {
    return false;
  }

  try {
    const key = publicKey.replace(PUBLIC_KEY_PREFIX, "");
    const bytes = decodeBase58(key);
    return bytes.length === 32;
  } catch {
    return false;
  }
}
