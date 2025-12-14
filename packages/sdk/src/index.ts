/**
 * @iceberg/sdk - SDK do Protocolo Iceberg
 *
 * Biblioteca principal para interação com o protocolo.
 */

// Módulo de Identidade
export {
  createIdentity,
  importFromMnemonic,
  importFromSecretKey,
  exportSecretKey,
  signMessage,
  verifySignature,
  getShortId,
  isValidPublicKey,
  encodeBase58,
  decodeBase58,
  encodeBase64,
  decodeBase64,
  type Identity,
} from "./crypto/identity";

// Cliente HTTP
export { IcebergClient, getClient, type ClientConfig } from "./client";

// Versão
export const VERSION = "0.1.0";
