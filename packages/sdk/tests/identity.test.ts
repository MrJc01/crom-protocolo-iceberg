/**
 * Testes do Módulo de Identidade
 *
 * Baseado na documentação: docs/06_SEGURANCA_E_PRIVACIDADE.md
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
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
  Identity,
} from "../src/crypto/identity";

describe("Módulo de Identidade", () => {
  // ==========================================
  // CRIAÇÃO DE IDENTIDADE
  // ==========================================

  describe("createIdentity()", () => {
    it("deve gerar uma nova identidade com chave pública e secreta", async () => {
      const result = await createIdentity();

      expect(result.identity).toBeDefined();
      expect(result.identity.publicKey).toBeDefined();
      expect(result.identity.secretKey).toBeDefined();
      expect(result.identity.createdAt).toBeDefined();

      // Chave pública deve ter prefixo ed25519:
      expect(result.identity.publicKey.startsWith("ed25519:")).toBe(true);

      // Chave secreta deve ter 64 bytes
      expect(result.identity.secretKey.length).toBe(64);
    });

    it("deve gerar mnemônico de 24 palavras", async () => {
      const result = await createIdentity();

      const words = result.mnemonic.split(" ");
      expect(words.length).toBe(24);
    });

    it("deve gerar identidades únicas", async () => {
      const result1 = await createIdentity();
      const result2 = await createIdentity();

      expect(result1.identity.publicKey).not.toBe(result2.identity.publicKey);
      expect(result1.mnemonic).not.toBe(result2.mnemonic);
    });
  });

  // ==========================================
  // IMPORT/EXPORT
  // ==========================================

  describe("importFromMnemonic()", () => {
    it("deve recuperar mesma identidade do mesmo mnemônico", async () => {
      const original = await createIdentity();
      const recovered = await importFromMnemonic(original.mnemonic);

      expect(recovered.publicKey).toBe(original.identity.publicKey);
    });

    it("deve rejeitar mnemônico inválido", async () => {
      await expect(
        importFromMnemonic("invalid mnemonic words that are not real")
      ).rejects.toThrow("Mnemônico inválido");
    });

    it("deve aceitar mnemônico válido do BIP39", async () => {
      // Mnemônico de teste válido
      const testMnemonic =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

      // Não deve lançar erro
      const identity = await importFromMnemonic(testMnemonic);
      expect(identity.publicKey).toBeDefined();
    });
  });

  describe("exportSecretKey() / importFromSecretKey()", () => {
    it("deve fazer roundtrip de export/import", async () => {
      const original = await createIdentity();
      const exported = exportSecretKey(original.identity);

      expect(exported.startsWith("0x")).toBe(true);

      const recovered = importFromSecretKey(exported);
      expect(recovered.publicKey).toBe(original.identity.publicKey);
    });
  });

  // ==========================================
  // ASSINATURA E VERIFICAÇÃO
  // ==========================================

  describe("signMessage() / verifySignature()", () => {
    let identity: Identity;

    beforeEach(async () => {
      const result = await createIdentity();
      identity = result.identity;
    });

    it("deve assinar mensagem corretamente", () => {
      const signed = signMessage("Hello Iceberg", identity);

      expect(signed.content).toBe("Hello Iceberg");
      expect(signed.signature).toBeDefined();
      expect(signed.publicKey).toBe(identity.publicKey);
      expect(signed.timestamp).toBeDefined();
    });

    it("deve verificar assinatura válida", () => {
      const signed = signMessage("Hello Iceberg", identity);
      const isValid = verifySignature(signed);

      expect(isValid).toBe(true);
    });

    it("deve rejeitar assinatura com conteúdo alterado", () => {
      const signed = signMessage("Hello Iceberg", identity);

      // Alterar conteúdo
      signed.content = "Hello Malicious";

      const isValid = verifySignature(signed);
      expect(isValid).toBe(false);
    });

    it("deve rejeitar assinatura com assinatura alterada", () => {
      const signed = signMessage("Hello Iceberg", identity);

      // Corromper assinatura
      signed.signature = "invalid_signature_base64";

      const isValid = verifySignature(signed);
      expect(isValid).toBe(false);
    });

    it("deve rejeitar assinatura com chave pública incorreta", async () => {
      const signed = signMessage("Hello Iceberg", identity);

      // Usar outra chave pública
      const other = await createIdentity();
      signed.publicKey = other.identity.publicKey;

      const isValid = verifySignature(signed);
      expect(isValid).toBe(false);
    });
  });

  // ==========================================
  // UTILITÁRIOS
  // ==========================================

  describe("getShortId()", () => {
    it("deve retornar primeiros 8 caracteres da chave pública", async () => {
      const result = await createIdentity();
      const shortId = getShortId(result.identity.publicKey);

      expect(shortId.length).toBe(8);
      expect(result.identity.publicKey).toContain(shortId);
    });
  });

  describe("isValidPublicKey()", () => {
    it("deve validar chave pública correta", async () => {
      const result = await createIdentity();
      expect(isValidPublicKey(result.identity.publicKey)).toBe(true);
    });

    it("deve rejeitar chave sem prefixo", () => {
      expect(isValidPublicKey("abc123")).toBe(false);
    });

    it("deve rejeitar chave com prefixo mas conteúdo inválido", () => {
      expect(isValidPublicKey("ed25519:!!!invalid!!!")).toBe(false);
    });
  });

  describe("Base58 encoding", () => {
    it("deve fazer roundtrip corretamente", () => {
      const original = new Uint8Array([1, 2, 3, 4, 5, 10, 20, 30]);
      const encoded = encodeBase58(original);
      const decoded = decodeBase58(encoded);

      // Comparar arrays
      expect(decoded.slice(-original.length)).toEqual(original);
    });

    it("deve codificar zero corretamente", () => {
      const zeros = new Uint8Array([0, 0, 0]);
      const encoded = encodeBase58(zeros);
      expect(encoded).toBe("111"); // Zeros viram '1' em base58
    });
  });
});
