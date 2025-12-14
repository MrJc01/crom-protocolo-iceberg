# 09. Guia de Adaptação do TabNews

## Objetivo

Este documento detalha passo-a-passo como adaptar o código do [TabNews](https://github.com/filipedeschamps/tabnews.com.br) para funcionar com a infraestrutura descentralizada do Protocolo Iceberg.

---

## Fase 1: Fork e Setup Inicial

### 1.1 Clonar o Repositório

```bash
# Fork no GitHub primeiro, depois:
git clone https://github.com/SEU_USUARIO/tabnews.com.br.git
cd tabnews.com.br

# Renomear para o projeto Iceberg
mv tabnews.com.br iceberg-web-client
cd iceberg-web-client

# Mudar remote
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/crom-protocolo-iceberg.git
```

### 1.2 Limpar Dependências Centralizadas

```bash
# Remover dependências do Postgres
npm uninstall pg pg-cursor node-pg-migrate

# Remover nodemailer (não usamos email)
npm uninstall nodemailer

# Remover bcryptjs (usamos crypto nativo)
npm uninstall bcryptjs
```

### 1.3 Adicionar Novas Dependências

```bash
# SDK do Iceberg (quando disponível)
npm install @iceberg/sdk

# Criptografia
npm install tweetnacl tweetnacl-util

# State management leve
npm install zustand

# BIP39 para mnemonic
npm install bip39

# Identicons para avatares
npm install @dicebear/core @dicebear/collection
```

---

## Fase 2: Remoção de Código Centralizado

### 2.1 Pastas para DELETAR

```bash
# Infraestrutura de banco de dados
rm -rf infra/

# Migrations do Postgres
rm -rf migrations/

# API routes antigas (serão substituídas)
rm -rf pages/api/v1/

# Modelos SQL
rm -rf models/

# Scripts de banco
rm -rf scripts/database/
```

### 2.2 Arquivos para DELETAR

```bash
# Configurações de banco
rm .env.development
rm docker-compose.yml  # Se existir
rm jest.config.js      # Refazer depois

# Arquivos de email
rm -rf tests/integration/email/
```

### 2.3 Atualizar .gitignore

```gitignore
# Adicionar ao .gitignore
.iceberg/
identity.json
*.pem
*.key

# Manter
node_modules/
.next/
.env.local
```

---

## Fase 3: Substituir Sistema de Autenticação

### 3.1 Criar Contexto de Identidade

Criar arquivo `contexts/IdentityContext.tsx`:

```tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import * as nacl from "tweetnacl";
import * as bip39 from "bip39";

interface Identity {
  publicKey: string;
  secretKey: Uint8Array;
}

interface IdentityContextType {
  identity: Identity | null;
  loading: boolean;
  createIdentity: () => Promise<{ mnemonic: string }>;
  importIdentity: (mnemonic: string) => Promise<void>;
  logout: () => void;
}

const IdentityContext = createContext<IdentityContextType | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar identidade do localStorage na inicialização
  useEffect(() => {
    const stored = localStorage.getItem("iceberg_identity");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Descriptografar se necessário
        setIdentity(parsed);
      } catch (e) {
        console.error("Falha ao carregar identidade:", e);
      }
    }
    setLoading(false);
  }, []);

  const createIdentity = async () => {
    // Gerar entropia
    const entropy = nacl.randomBytes(32);

    // Converter para mnemonic (24 palavras)
    const mnemonic = bip39.entropyToMnemonic(Buffer.from(entropy));

    // Derivar seed
    const seed = await bip39.mnemonicToSeed(mnemonic);

    // Criar keypair
    const keypair = nacl.sign.keyPair.fromSeed(
      new Uint8Array(seed.slice(0, 32))
    );

    // Codificar public key em base58
    const publicKey = encodeBase58(keypair.publicKey);

    const newIdentity = {
      publicKey,
      secretKey: keypair.secretKey,
    };

    // Salvar (TODO: encriptar com senha)
    setIdentity(newIdentity);
    localStorage.setItem("iceberg_identity", JSON.stringify(newIdentity));

    return { mnemonic };
  };

  const importIdentity = async (mnemonic: string) => {
    if (!bip39.validateMnemonic(mnemonic)) {
      throw new Error("Mnemonic inválido");
    }

    const seed = await bip39.mnemonicToSeed(mnemonic);
    const keypair = nacl.sign.keyPair.fromSeed(
      new Uint8Array(seed.slice(0, 32))
    );
    const publicKey = encodeBase58(keypair.publicKey);

    const newIdentity = {
      publicKey,
      secretKey: keypair.secretKey,
    };

    setIdentity(newIdentity);
    localStorage.setItem("iceberg_identity", JSON.stringify(newIdentity));
  };

  const logout = () => {
    setIdentity(null);
    localStorage.removeItem("iceberg_identity");
  };

  return (
    <IdentityContext.Provider
      value={{ identity, loading, createIdentity, importIdentity, logout }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error("useIdentity deve ser usado dentro de IdentityProvider");
  }
  return context;
}

// Utilitário para base58
function encodeBase58(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = "";
  let num = BigInt("0x" + Buffer.from(bytes).toString("hex"));
  while (num > 0) {
    result = ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }
  return "ed25519:" + result;
}
```

### 3.2 Criar Páginas de Autenticação

Criar `pages/auth/index.tsx`:

```tsx
import { useRouter } from "next/router";
import { useIdentity } from "@/contexts/IdentityContext";
import { useEffect } from "react";

export default function AuthPage() {
  const router = useRouter();
  const { identity, loading } = useIdentity();

  useEffect(() => {
    if (!loading && identity) {
      router.push("/");
    }
  }, [loading, identity, router]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="auth-container">
      <h1>Entrar no Iceberg</h1>

      <div className="auth-options">
        <a href="/auth/create" className="auth-button primary">
          🔑 Criar Nova Identidade
        </a>

        <a href="/auth/import" className="auth-button secondary">
          📥 Importar Identidade Existente
        </a>
      </div>

      <p className="auth-info">
        Sua identidade é um par de chaves criptográficas.
        <br />
        Não usamos email, senha ou dados pessoais.
      </p>
    </div>
  );
}
```

Criar `pages/auth/create.tsx`:

```tsx
import { useState } from "react";
import { useRouter } from "next/router";
import { useIdentity } from "@/contexts/IdentityContext";

export default function CreateIdentityPage() {
  const router = useRouter();
  const { createIdentity } = useIdentity();
  const [step, setStep] = useState<"intro" | "mnemonic" | "confirm">("intro");
  const [mnemonic, setMnemonic] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleCreate = async () => {
    const result = await createIdentity();
    setMnemonic(result.mnemonic);
    setStep("mnemonic");
  };

  const handleConfirm = () => {
    if (confirmed) {
      router.push("/");
    }
  };

  return (
    <div className="create-identity">
      {step === "intro" && (
        <>
          <h1>Criar Nova Identidade</h1>
          <p>
            Vamos gerar uma identidade única e anônima para você. Isso acontece
            100% no seu navegador - nenhum servidor é contatado.
          </p>
          <button onClick={handleCreate} className="btn primary">
            Gerar Identidade
          </button>
        </>
      )}

      {step === "mnemonic" && (
        <>
          <h1>⚠️ ATENÇÃO: Guarde Estas Palavras</h1>

          <div className="warning-box">
            <p>
              As palavras abaixo são a <strong>ÚNICA</strong> forma de recuperar
              sua identidade. Nós <strong>NÃO</strong> armazenamos isso em
              nenhum lugar.
            </p>
            <p>
              Se você perder estas palavras, perderá acesso à sua conta para
              sempre.
            </p>
          </div>

          <div className="mnemonic-box">
            {mnemonic.split(" ").map((word, i) => (
              <span key={i} className="mnemonic-word">
                <small>{i + 1}.</small> {word}
              </span>
            ))}
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            Eu anotei as palavras em um lugar seguro (papel, gerenciador de senhas)
          </label>

          <button
            onClick={handleConfirm}
            className="btn primary"
            disabled={!confirmed}
          >
            Continuar
          </button>
        </>
      )}
    </div>
  );
}
```

---

## Fase 4: Substituir Chamadas de Banco de Dados

### 4.1 Criar Hook do Iceberg

Criar `lib/useIceberg.ts`:

```typescript
import { useMemo } from "react";
import { useIdentity } from "@/contexts/IdentityContext";

// Configuração do daemon
const DAEMON_URL =
  process.env.NEXT_PUBLIC_DAEMON_URL || "http://localhost:8420";

interface Post {
  cid: string;
  title: string;
  body: string;
  author: string;
  region: string;
  level: 0 | 1 | 2 | 3;
  createdAt: number;
  votes: { up: number; down: number; reports: number };
  seedCount: number;
}

interface CreatePostInput {
  title: string;
  body: string;
  region: string;
  category?: string;
}

export function useIceberg() {
  const { identity } = useIdentity();

  const api = useMemo(
    () => ({
      // Listar posts
      async listPosts(options: {
        region?: string;
        level?: number;
        limit?: number;
        offset?: number;
      }): Promise<{ posts: Post[]; total: number }> {
        const params = new URLSearchParams();
        if (options.region) params.set("region", options.region);
        if (options.level !== undefined)
          params.set("level", String(options.level));
        if (options.limit) params.set("limit", String(options.limit));
        if (options.offset) params.set("offset", String(options.offset));

        const res = await fetch(`${DAEMON_URL}/posts?${params}`);
        if (!res.ok) throw new Error("Falha ao buscar posts");
        return res.json();
      },

      // Obter post por CID
      async getPost(cid: string): Promise<Post> {
        const res = await fetch(`${DAEMON_URL}/posts/${cid}`);
        if (!res.ok) throw new Error("Post não encontrado");
        return res.json();
      },

      // Criar post (requer identidade)
      async createPost(input: CreatePostInput): Promise<{ cid: string }> {
        if (!identity) throw new Error("Autenticação necessária");

        // Assinar o conteúdo
        const content = JSON.stringify(input);
        const signature = await signContent(content, identity.secretKey);

        const res = await fetch(`${DAEMON_URL}/posts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Public-Key": identity.publicKey,
            "X-Signature": signature,
          },
          body: content,
        });

        if (!res.ok) throw new Error("Falha ao criar post");
        return res.json();
      },

      // Votar
      async vote(cid: string, type: "up" | "down" | "report"): Promise<void> {
        if (!identity) throw new Error("Autenticação necessária");

        const content = JSON.stringify({ cid, type, timestamp: Date.now() });
        const signature = await signContent(content, identity.secretKey);

        const res = await fetch(`${DAEMON_URL}/votes/${cid}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Public-Key": identity.publicKey,
            "X-Signature": signature,
          },
          body: content,
        });

        if (!res.ok) throw new Error("Falha ao votar");
      },
    }),
    [identity]
  );

  return api;
}

// Função auxiliar para assinar conteúdo
async function signContent(
  content: string,
  secretKey: Uint8Array
): Promise<string> {
  const nacl = await import("tweetnacl");
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(content);
  const signature = nacl.sign.detached(messageBytes, secretKey);
  return Buffer.from(signature).toString("base64");
}
```

### 4.2 Substituir Componentes de Lista

No arquivo que lista posts (ex: `pages/index.js` ou similar), substituir:

```jsx
// ANTES (TabNews original)
import { useUser } from "contexts/User";

export async function getServerSideProps() {
  const posts = await database.query("SELECT * FROM contents...");
  return { props: { posts } };
}

// DEPOIS (Iceberg)
import { useIceberg } from "@/lib/useIceberg";
import { useState, useEffect } from "react";

export default function HomePage() {
  const iceberg = useIceberg();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    iceberg
      .listPosts({ level: 1, limit: 50 })
      .then((result) => setPosts(result.posts))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="feed">
      {posts.map((post) => (
        <PostCard key={post.cid} post={post} />
      ))}
    </div>
  );
}
```

---

## Fase 5: Componentes Visuais

### 5.1 Criar Indicador de Nível

Criar `components/LevelBadge.tsx`:

```tsx
interface LevelBadgeProps {
  level: 0 | 1 | 2 | 3;
}

const LEVEL_CONFIG = {
  0: { label: "Não Verificado", icon: "🔍", color: "gray" },
  1: { label: "Regional", icon: "📍", color: "blue" },
  2: { label: "Verificado", icon: "✅", color: "green" },
  3: { label: "Histórico", icon: "🏛️", color: "gold" },
};

export function LevelBadge({ level }: LevelBadgeProps) {
  const config = LEVEL_CONFIG[level];

  return (
    <span className={`level-badge level-${config.color}`} title={config.label}>
      {config.icon} Nível {level}
    </span>
  );
}
```

### 5.2 Estilos CSS para Níveis

Adicionar ao CSS global:

```css
/* Bordas de nível para cards */
.post-card[data-level="0"] {
  border: 2px dashed #9ca3af;
}

.post-card[data-level="1"] {
  border: 2px solid #3b82f6;
}

.post-card[data-level="2"] {
  border: 2px solid #22c55e;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.2);
}

.post-card[data-level="3"] {
  border: 3px solid #eab308;
  box-shadow: 0 0 20px rgba(234, 179, 8, 0.3);
  background: linear-gradient(
    135deg,
    rgba(234, 179, 8, 0.05) 0%,
    transparent 100%
  );
}

/* Badges */
.level-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.level-badge.level-gray {
  background: #f3f4f6;
  color: #4b5563;
}

.level-badge.level-blue {
  background: #dbeafe;
  color: #1d4ed8;
}

.level-badge.level-green {
  background: #dcfce7;
  color: #15803d;
}

.level-badge.level-gold {
  background: #fef3c7;
  color: #b45309;
}
```

---

## Fase 6: Testes

### 6.1 Configurar Jest/Vitest

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Criar `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./tests/setup.ts",
  },
});
```

### 6.2 Exemplo de Teste

Criar `tests/identity.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import * as nacl from "tweetnacl";
import * as bip39 from "bip39";

describe("Identity", () => {
  it("should generate valid mnemonic", () => {
    const entropy = nacl.randomBytes(32);
    const mnemonic = bip39.entropyToMnemonic(Buffer.from(entropy));

    expect(bip39.validateMnemonic(mnemonic)).toBe(true);
    expect(mnemonic.split(" ")).toHaveLength(24);
  });

  it("should derive same keypair from same mnemonic", async () => {
    const mnemonic =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

    const seed1 = await bip39.mnemonicToSeed(mnemonic);
    const seed2 = await bip39.mnemonicToSeed(mnemonic);

    const keypair1 = nacl.sign.keyPair.fromSeed(
      new Uint8Array(seed1.slice(0, 32))
    );
    const keypair2 = nacl.sign.keyPair.fromSeed(
      new Uint8Array(seed2.slice(0, 32))
    );

    expect(keypair1.publicKey).toEqual(keypair2.publicKey);
  });

  it("should sign and verify messages", () => {
    const keypair = nacl.sign.keyPair();
    const message = new TextEncoder().encode("Hello Iceberg");

    const signature = nacl.sign.detached(message, keypair.secretKey);
    const valid = nacl.sign.detached.verify(
      message,
      signature,
      keypair.publicKey
    );

    expect(valid).toBe(true);
  });
});
```

---

## Checklist Final

- [ ] Fork do TabNews clonado
- [ ] Dependências de Postgres removidas
- [ ] Dependências de criptografia adicionadas
- [ ] IdentityContext implementado
- [ ] Páginas de autenticação funcionando
- [ ] Hook useIceberg criado
- [ ] Feed básico conectado ao daemon
- [ ] LevelBadge implementado
- [ ] Estilos de nível aplicados
- [ ] Testes básicos passando

---

## Próximos Passos

Após completar a adaptação, veja [08_ROADMAP.md](./08_ROADMAP.md) para as próximas fases do projeto.
