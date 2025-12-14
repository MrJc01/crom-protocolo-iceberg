# 04. Especificação do Frontend (Adaptação do TabNews)

## Visão Geral

O frontend do Protocolo Iceberg é um **fork adaptado** do [TabNews](https://github.com/filipedeschamps/tabnews.com.br). Mantemos a estética minimalista e a excelente experiência de usuário, mas substituímos toda a infraestrutura centralizada.

---

## Arquivos para REMOVER (A "Lobotomia")

Ao clonar o TabNews, os seguintes diretórios e arquivos devem ser **removidos** ou **ignorados**:

### Remoção Obrigatória

```
tabnews.com.br/
├── infra/                    ❌ REMOVER (Postgres, migrations)
├── pages/api/                ❌ REMOVER (API centralizada)
│   └── v1/                   ❌ REMOVER
├── prisma/                   ❌ REMOVER (se existir)
└── models/                   ❌ REMOVER (modelos SQL)
```

### Dependências para REMOVER do package.json

```json
{
  "dependencies": {
    "pg": "❌ REMOVER",
    "pg-cursor": "❌ REMOVER",
    "nodemailer": "❌ REMOVER",
    "node-pg-migrate": "❌ REMOVER",
    "bcryptjs": "❌ REMOVER (substituir por crypto nativo)"
  }
}
```

### Dependências para ADICIONAR

```json
{
  "dependencies": {
    "@iceberg/sdk": "workspace:*",
    "tweetnacl": "^1.0.3",
    "tweetnacl-util": "^0.15.1",
    "zustand": "^4.4.0",
    "jotai": "^2.5.0"
  }
}
```

---

## Arquivos para MANTER e ADAPTAR

### Estrutura que Permanece

```
tabnews.com.br/
├── pages/                    ✅ MANTER (adaptar chamadas)
│   ├── index.js              ✅ Feed principal
│   ├── [username]/
│   │   └── [slug]/
│   │       └── index.js      ✅ Visualização de post
│   └── publicar/
│       └── index.js          ✅ Editor de criação
├── components/               ✅ MANTER (adaptar dados)
├── styles/                   ✅ MANTER
└── public/                   ✅ MANTER
```

---

## Sistema de Autenticação (Nova Implementação)

### Fluxo Original (TabNews)

```
Usuário → Email/Senha → Servidor → Sessão/Cookie → Autenticado
```

### Novo Fluxo (Iceberg)

```
Usuário → Gera/Importa Chave → Armazena Local → Assina Ações → Verificado por Peers
```

### Páginas de Autenticação

#### `/auth` - Hub de Autenticação

```tsx
// pages/auth/index.tsx

export default function AuthHub() {
  const { hasIdentity, identity } = useIdentity();

  if (hasIdentity) {
    return <Redirect to="/" />;
  }

  return (
    <div className="auth-container">
      <h1>Entrar no Iceberg</h1>

      <div className="auth-options">
        <Link href="/auth/create">
          <Button variant="primary">Criar Nova Identidade</Button>
        </Link>

        <Link href="/auth/import">
          <Button variant="secondary">Importar Identidade Existente</Button>
        </Link>
      </div>

      <p className="auth-info">
        Sua identidade é um par de chaves criptográficas. Não usamos email,
        senha ou dados pessoais.
      </p>
    </div>
  );
}
```

#### `/auth/create` - Criar Identidade

```tsx
// pages/auth/create.tsx

import { generateKeyPair, exportIdentity } from "@iceberg/sdk";

export default function CreateIdentity() {
  const [step, setStep] = useState<"generate" | "backup" | "done">("generate");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [seedPhrase, setSeedPhrase] = useState<string>("");

  const handleGenerate = async () => {
    // Gerar par de chaves ED25519
    const keypair = await generateKeyPair();
    const seed = await exportIdentity(keypair, "mnemonic");

    setIdentity(keypair);
    setSeedPhrase(seed);
    setStep("backup");
  };

  return (
    <div className="create-identity">
      {step === "generate" && (
        <>
          <h1>Criar Nova Identidade</h1>
          <p>
            Vamos gerar uma identidade única e anônima para você. Isso acontece
            100% no seu navegador.
          </p>
          <Button onClick={handleGenerate}>Gerar Identidade</Button>
        </>
      )}

      {step === "backup" && (
        <>
          <h1>⚠️ Faça Backup da Sua Identidade</h1>
          <Alert type="warning">
            Anote estas palavras em papel. Elas são a ÚNICA forma de recuperar
            sua identidade. Nós NÃO armazenamos isso.
          </Alert>

          <SeedPhraseDisplay phrase={seedPhrase} />

          <Checkbox
            label="Eu anotei as palavras em um lugar seguro"
            onChange={(checked) => checked && setStep("done")}
          />
        </>
      )}

      {step === "done" && (
        <>
          <h1>✅ Identidade Criada!</h1>
          <IdentityCard identity={identity} />
          <Button href="/">Começar a Usar</Button>
        </>
      )}
    </div>
  );
}
```

#### `/auth/import` - Importar Identidade

```tsx
// pages/auth/import.tsx

export default function ImportIdentity() {
  const [method, setMethod] = useState<"seed" | "file" | null>(null);

  return (
    <div className="import-identity">
      <h1>Importar Identidade</h1>

      <div className="import-methods">
        <Card onClick={() => setMethod("seed")}>
          <Icon name="key" />
          <h3>Frase de Recuperação</h3>
          <p>12 ou 24 palavras</p>
        </Card>

        <Card onClick={() => setMethod("file")}>
          <Icon name="file" />
          <h3>Arquivo de Chave</h3>
          <p>.json ou .pem</p>
        </Card>
      </div>

      {method === "seed" && <SeedPhraseInput />}
      {method === "file" && <FileKeyImport />}
    </div>
  );
}
```

---

## Interface de Leitura (Feed)

### Modificações no Feed Principal

#### Filtro Geográfico (Header)

```tsx
// components/Header/RegionSelector.tsx

export function RegionSelector() {
  const { region, setRegion } = useRegion();
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    // Carregar cidades do IBGE
    fetchCities().then(setCities);
  }, []);

  return (
    <div className="region-selector">
      <Select
        value={region}
        onChange={setRegion}
        options={[
          { value: "global", label: "🌍 Global (Nível 2+)" },
          { value: "auto", label: "📍 Detectar Localização" },
          ...cities.map((c) => ({
            value: c.code,
            label: `${c.name}, ${c.state}`,
          })),
        ]}
      />
    </div>
  );
}
```

#### Card de Post com Indicador de Nível

```tsx
// components/PostCard/index.tsx

interface PostCardProps {
  post: Post;
}

const LEVEL_STYLES = {
  0: {
    border: "border-gray-400 border-dashed",
    badge: "bg-gray-500",
    label: "Não Verificado",
  },
  1: {
    border: "border-blue-500 border-solid",
    badge: "bg-blue-500",
    label: "Regional",
  },
  2: {
    border: "border-green-500 border-solid border-2",
    badge: "bg-green-500",
    label: "Verificado",
  },
  3: {
    border: "border-yellow-500 border-solid border-2 shadow-gold",
    badge: "bg-yellow-500",
    label: "Histórico",
  },
};

export function PostCard({ post }: PostCardProps) {
  const style = LEVEL_STYLES[post.level];

  return (
    <article className={`post-card ${style.border}`}>
      <header>
        <LevelBadge level={post.level} />
        <h2>{post.title}</h2>
        <PostMeta author={post.author} date={post.createdAt} />
      </header>

      <MarkdownPreview content={post.body} maxLength={280} />

      <footer>
        <VoteButtons postCid={post.cid} />
        <RegionTag region={post.region} />
        <SeedCount count={post.seedCount} />
      </footer>
    </article>
  );
}
```

#### Badge de Nível

```tsx
// components/LevelBadge.tsx

const LEVEL_INFO = {
  0: { icon: "🔍", color: "gray", tooltip: "Aguardando verificação" },
  1: { icon: "📍", color: "blue", tooltip: "Verificado regionalmente" },
  2: { icon: "✅", color: "green", tooltip: "Verificado globalmente" },
  3: { icon: "🏛️", color: "gold", tooltip: "Arquivo histórico imutável" },
};

export function LevelBadge({ level }: { level: 0 | 1 | 2 | 3 }) {
  const info = LEVEL_INFO[level];

  return (
    <Tooltip content={info.tooltip}>
      <span className={`level-badge level-${info.color}`}>
        {info.icon} Nível {level}
      </span>
    </Tooltip>
  );
}
```

---

## Interface de Escrita (Editor)

### Página de Criação de Post

```tsx
// pages/publicar/index.tsx

export default function PublicarPage() {
  const { identity } = useIdentity();
  const [form, setForm] = useState({
    title: "",
    body: "",
    region: "",
    category: "general",
    bounty: 0,
    attachments: [],
  });

  const handleSubmit = async () => {
    const iceberg = useIceberg();

    // Upload de anexos para IPFS primeiro
    const attachmentCids = await Promise.all(
      form.attachments.map((file) => iceberg.files.upload(file))
    );

    // Criar post (SDK assina automaticamente)
    const receipt = await iceberg.posts.create({
      ...form,
      attachments: attachmentCids,
      bounty:
        form.bounty > 0
          ? {
              amount: form.bounty,
              token: "ICEBERG",
            }
          : undefined,
    });

    // Redirecionar para o post criado
    router.push(`/post/${receipt.cid}`);
  };

  return (
    <div className="publicar-page">
      <h1>Publicar Denúncia</h1>

      {/* Título */}
      <Input
        label="Título"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Resumo claro da denúncia"
      />

      {/* Editor Markdown */}
      <MarkdownEditor
        value={form.body}
        onChange={(body) => setForm({ ...form, body })}
        placeholder="Descreva os detalhes. Use Markdown para formatação."
      />

      {/* Seletor de Região */}
      <RegionInput
        value={form.region}
        onChange={(region) => setForm({ ...form, region })}
        label="Região da Denúncia"
      />

      {/* Categoria */}
      <Select
        label="Categoria"
        value={form.category}
        onChange={(category) => setForm({ ...form, category })}
        options={[
          { value: "corruption", label: "💰 Corrupção" },
          { value: "environment", label: "🌳 Meio Ambiente" },
          { value: "health", label: "🏥 Saúde Pública" },
          { value: "security", label: "🔒 Segurança" },
          { value: "infrastructure", label: "🏗️ Infraestrutura" },
          { value: "general", label: "📝 Geral" },
        ]}
      />

      {/* Upload de Anexos */}
      <FileUpload
        label="Anexos (Opcional)"
        accept="image/*,video/*,.pdf,.doc,.docx"
        multiple
        onChange={(files) => setForm({ ...form, attachments: files })}
        hint="Arquivos são enviados para IPFS. Hash é registrado como prova."
      />

      {/* Bounty (Recompensa) */}
      <div className="bounty-section">
        <Input
          type="number"
          label="Recompensa por Auditoria (Opcional)"
          value={form.bounty}
          onChange={(e) => setForm({ ...form, bounty: Number(e.target.value) })}
          min={0}
          step={10}
        />
        <p className="hint">
          Tokens ICEBERG distribuídos para quem verificar sua denúncia.
        </p>
      </div>

      {/* Botão de Publicar */}
      <Button
        onClick={handleSubmit}
        disabled={!form.title || !form.body || !form.region}
      >
        Publicar no Nível 0
      </Button>

      <p className="info">
        Seu post começará no Nível 0 (não visível no feed). Compartilhe o link
        para ganhar verificações.
      </p>
    </div>
  );
}
```

---

## Sistema de Votos

### Adaptação dos TabCoins

**Original (TabNews):**

```javascript
// Atualiza banco centralizado
await database.query(
  "UPDATE users SET tabcoins = tabcoins + $1 WHERE id = $2",
  [amount, userId]
);
```

**Novo (Iceberg):**

```typescript
// Cria transação assinada distribuída
await iceberg.votes.cast(postCid, "up");
// Internamente:
// 1. Cria mensagem: { action: 'vote', target: cid, type: 'up', timestamp }
// 2. Assina com chave privada do usuário
// 3. Broadcast para a rede via PubSub
// 4. Peers verificam e contabilizam
```

### Componente de Voto

```tsx
// components/VoteButtons.tsx

export function VoteButtons({ postCid }: { postCid: string }) {
  const iceberg = useIceberg();
  const [votes, setVotes] = useState({ up: 0, down: 0, reports: 0 });
  const [myVote, setMyVote] = useState<"up" | "down" | "report" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Carregar votos atuais
    iceberg.votes.get(postCid).then(setVotes);
    iceberg.votes.getMine(postCid).then(setMyVote);
  }, [postCid]);

  const handleVote = async (type: "up" | "down" | "report") => {
    setLoading(true);
    try {
      await iceberg.votes.cast(postCid, type);
      setMyVote(type);
      // Atualizar contagem localmente
      setVotes((prev) => ({
        ...prev,
        [type === "report" ? "reports" : type]: prev[type] + 1,
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vote-buttons">
      <button
        className={`vote-up ${myVote === "up" ? "active" : ""}`}
        onClick={() => handleVote("up")}
        disabled={loading}
      >
        ▲ {votes.up}
      </button>

      <button
        className={`vote-down ${myVote === "down" ? "active" : ""}`}
        onClick={() => handleVote("down")}
        disabled={loading}
      >
        ▼ {votes.down}
      </button>

      <button
        className={`vote-report ${myVote === "report" ? "active" : ""}`}
        onClick={() => handleVote("report")}
        disabled={loading}
        title="Denunciar conteúdo"
      >
        ⚠️ {votes.reports}
      </button>
    </div>
  );
}
```

---

## Perfis de Usuário

### Tipos de Perfil

```typescript
// types/user.ts

type UserProfile = "citizen" | "activist" | "auditor" | "node_operator";

interface UserPreferences {
  profile: UserProfile;
  region: string;

  // Nível 0 visível apenas para ativistas/auditores
  showLevel0: boolean;

  // Categorias de interesse
  categories: string[];

  // Modo de operação do nó
  nodeMode: "light" | "full";
}
```

### Configurações de Perfil

```tsx
// pages/settings/profile.tsx

const PROFILES = {
  citizen: {
    name: "Cidadão",
    description: "Veja notícias verificadas da sua região",
    features: ["Nível 1+", "Região local", "Downloads sob demanda"],
  },
  activist: {
    name: "Ativista",
    description: "Acesse tudo e ajude a verificar denúncias",
    features: [
      "Todos os níveis",
      "Todas as regiões",
      "Ferramentas de verificação",
    ],
  },
  auditor: {
    name: "Auditor",
    description: "Foque em validar conteúdo e ganhar recompensas",
    features: ["Fila de auditoria", "Bounties", "Ferramentas avançadas"],
  },
  node_operator: {
    name: "Operador de Nó",
    description: "Mantenha a rede funcionando",
    features: ["Dashboard de nó", "Métricas", "Configurações avançadas"],
  },
};
```

---

## Componentes Visuais

### Design System (Extensão do TabNews)

```css
/* styles/iceberg-extensions.css */

/* Bordas de Nível */
.post-card.level-0 {
  border: 2px dashed var(--color-gray-400);
}

.post-card.level-1 {
  border: 2px solid var(--color-blue-500);
}

.post-card.level-2 {
  border: 2px solid var(--color-green-500);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.2);
}

.post-card.level-3 {
  border: 3px solid var(--color-yellow-500);
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
  background: var(--color-gray-200);
  color: var(--color-gray-700);
}
.level-badge.level-blue {
  background: var(--color-blue-100);
  color: var(--color-blue-700);
}
.level-badge.level-green {
  background: var(--color-green-100);
  color: var(--color-green-700);
}
.level-badge.level-gold {
  background: var(--color-yellow-100);
  color: var(--color-yellow-700);
}

/* Seed Counter */
.seed-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-gray-500);
  font-size: 12px;
}

.seed-count::before {
  content: "🌱";
}

/* Vote Buttons */
.vote-buttons {
  display: flex;
  gap: 8px;
}

.vote-buttons button {
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid var(--color-gray-300);
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.vote-buttons button:hover {
  background: var(--color-gray-100);
}

.vote-buttons button.active.vote-up {
  background: var(--color-green-100);
  border-color: var(--color-green-500);
  color: var(--color-green-700);
}

.vote-buttons button.active.vote-down {
  background: var(--color-red-100);
  border-color: var(--color-red-500);
  color: var(--color-red-700);
}

.vote-buttons button.active.vote-report {
  background: var(--color-orange-100);
  border-color: var(--color-orange-500);
  color: var(--color-orange-700);
}
```

---

## Hooks Customizados

```typescript
// lib/hooks/useIceberg.ts
import { Iceberg } from "@iceberg/sdk";

const icebergInstance = new Iceberg({
  daemonUrl: process.env.NEXT_PUBLIC_DAEMON_URL,
});

export function useIceberg() {
  return icebergInstance;
}

// lib/hooks/useIdentity.ts
export function useIdentity() {
  const iceberg = useIceberg();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    iceberg.identity
      .whoami()
      .then(setIdentity)
      .catch(() => setIdentity(null))
      .finally(() => setLoading(false));
  }, []);

  return {
    identity,
    loading,
    hasIdentity: !!identity,
    publicKey: identity?.publicKey,
    reputation: identity?.reputation,
  };
}

// lib/hooks/useRegion.ts
export function useRegion() {
  const [region, setRegion] = useLocalStorage("iceberg_region", "global");

  const detectLocation = async () => {
    // Usar API do IBGE para detectar cidade
    const res = await fetch("/api/detect-region");
    const data = await res.json();
    setRegion(data.code);
  };

  return { region, setRegion, detectLocation };
}
```

---

## Próximo Documento

Veja [05_TOKENOMICS_E_INCENTIVOS.md](./05_TOKENOMICS_E_INCENTIVOS.md) para entender o sistema de recompensas.
