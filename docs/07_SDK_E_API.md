# 07. SDK e API - Documentação para Desenvolvedores

## Visão Geral

O SDK do Protocolo Iceberg permite que desenvolvedores construam aplicações em cima da rede descentralizada sem precisar entender os detalhes de criptografia, P2P ou IPFS.

---

## Instalação

### NPM (Node.js / Browser)

```bash
npm install @iceberg/sdk
# ou
yarn add @iceberg/sdk
# ou
pnpm add @iceberg/sdk
```

### CDN (Browser)

```html
<script type="module">
  import { Iceberg } from "https://cdn.iceberg.network/sdk/latest/index.mjs";
</script>
```

### Pré-requisitos

- **Node.js:** 18.0.0+
- **Browser:** Chrome 90+, Firefox 90+, Safari 15+
- **Daemon:** O daemon local deve estar rodando para operações de escrita

---

## Quick Start

```typescript
import { Iceberg } from "@iceberg/sdk";

// Configuração básica
const iceberg = new Iceberg({
  daemonUrl: "http://localhost:8420", // Daemon local
  // OU gateway público (somente leitura)
  // gatewayUrl: 'https://gateway.iceberg.network'
});

// Verificar conexão
const status = await iceberg.health();
console.log(status); // { connected: true, peers: 142, ... }

// Criar identidade (se não existir)
let identity = await iceberg.identity.whoami();
if (!identity) {
  const { identity: newId, mnemonic } = await iceberg.identity.create();
  console.log("Guarde seu mnemonic:", mnemonic);
  identity = newId;
}

// Listar posts da região
const posts = await iceberg.posts.list({
  region: "BR-SP-SAO_PAULO",
  level: 1,
});

console.log(posts);
```

---

## Configuração

### Opções do Construtor

```typescript
interface IcebergConfig {
  /**
   * URL do daemon local (operações de escrita)
   * @default 'http://localhost:8420'
   */
  daemonUrl?: string;

  /**
   * URL de gateway público (somente leitura)
   * Útil para apps web que não têm daemon local
   */
  gatewayUrl?: string;

  /**
   * Caminho para arquivo de identidade
   * @default '~/.iceberg/identity.json'
   */
  identityPath?: string;

  /**
   * Região padrão para queries
   * @default 'global'
   */
  defaultRegion?: string;

  /**
   * Timeout para requisições (ms)
   * @default 30000
   */
  timeout?: number;

  /**
   * Habilitar logs de debug
   * @default false
   */
  debug?: boolean;
}
```

---

## API Reference

## `iceberg.identity`

Gerenciamento de identidade criptográfica.

### `identity.create()`

Cria um novo par de chaves ED25519.

```typescript
const result = await iceberg.identity.create();

// Retorno
{
  identity: {
    publicKey: 'ed25519:8YjZ3...',  // Base58
    createdAt: 1702345678000
  },
  mnemonic: 'abandon ability able about above absent absorb abstract...' // 24 palavras
}
```

> [!WARNING]
> Guarde o mnemonic em local seguro! É a única forma de recuperar a identidade.

### `identity.import(input)`

Importa identidade existente.

```typescript
// Via mnemonic
await iceberg.identity.import({
  type: "mnemonic",
  value: "abandon ability able about above absent absorb abstract...",
});

// Via arquivo de chave
await iceberg.identity.import({
  type: "keyfile",
  path: "/path/to/key.json",
  password: "opcional",
});

// Via chave privada direta (hex)
await iceberg.identity.import({
  type: "secretKey",
  value: "0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d",
});
```

### `identity.whoami()`

Retorna a identidade atual (se existir).

```typescript
const me = await iceberg.identity.whoami();

// Retorno (ou null se não autenticado)
{
  publicKey: 'ed25519:8YjZ3...',
  reputation: 150,
  createdAt: 1702345678000,
  postsCount: 12,
  votesCount: 340
}
```

### `identity.export(password?)`

Exporta a identidade para backup.

```typescript
// Exportar como mnemonic (sem senha)
const mnemonic = await iceberg.identity.export({ format: "mnemonic" });

// Exportar como arquivo encriptado
const keyfile = await iceberg.identity.export({
  format: "keyfile",
  password: "minhaSenhaForte",
});
// Retorna: { version: 1, crypto: { ... } }
```

---

## `iceberg.posts`

Operações com posts/denúncias.

### `posts.list(options)`

Lista posts com filtros.

```typescript
const posts = await iceberg.posts.list({
  region: 'BR-SP-SAO_PAULO',  // Código do IBGE ou 'global'
  level: 1,                    // 0, 1, 2, 3 ou undefined (todos)
  category: 'corruption',      // Opcional
  limit: 50,                   // Máximo 100
  offset: 0,
  sortBy: 'relevance',         // 'relevance' | 'recent' | 'controversial'
  author: 'ed25519:8YjZ3...'   // Opcional: filtrar por autor
});

// Retorno
{
  posts: [
    {
      cid: 'bafybeigdyrzt5...',
      title: 'Denúncia de corrupção no hospital',
      body: '## Contexto\n\nEm 15 de janeiro...',
      author: 'ed25519:8YjZ3...',
      region: 'BR-SP-SAO_PAULO',
      category: 'corruption',
      level: 2,
      createdAt: 1702345678000,
      votes: { up: 1542, down: 23, reports: 5 },
      seedCount: 12847,
      bounty: { amount: 100, claimed: 45, token: 'ICEBERG' },
      attachments: ['bafybei...', 'bafybei...']
    },
    // ...
  ],
  total: 1234,
  hasMore: true
}
```

### `posts.get(cid)`

Obtém um post específico pelo CID.

```typescript
const post = await iceberg.posts.get("bafybeigdyrzt5...");

// Mesmo formato de posts.list()[0]
```

### `posts.create(data)`

Cria um novo post (requer identidade).

```typescript
const receipt = await iceberg.posts.create({
  title: 'Título da Denúncia',
  body: '## Markdown completo\n\nDescrição detalhada...',
  region: 'BR-SP-SAO_PAULO',
  category: 'corruption',  // Opcional
  attachments: [           // Opcional: CIDs de arquivos
    'bafybei...',
    'bafybei...'
  ],
  bounty: {                // Opcional
    amount: 50,
    token: 'ICEBERG'
  }
});

// Retorno
{
  cid: 'bafybeigdyrzt5...',
  status: 'pending',        // Aguardando propagação
  level: 0,
  txHash: '0x...',          // Se bounty foi depositado
  timestamp: 1702345678000
}
```

### `posts.update(cid, data)`

Atualiza metadados de um post (apenas autor).

```typescript
// Apenas certos campos são editáveis
await iceberg.posts.update("bafybeigdyrzt5...", {
  body: "## Atualização\n\nNovas informações...",
  // title, region, category NÃO podem mudar após criação
});
```

### `posts.delete(cid)`

Remove um post (apenas autor, antes do Nível 3).

```typescript
await iceberg.posts.delete("bafybeigdyrzt5...");
// O CID entra em quarentena, mas cópias existentes permanecem
```

---

## `iceberg.votes`

Sistema de votação assinada.

### `votes.get(postCid)`

Obtém contagem de votos de um post.

```typescript
const votes = await iceberg.votes.get('bafybeigdyrzt5...');

// Retorno
{
  up: 1542,
  down: 23,
  reports: 5,
  score: 1514,           // up - down
  level: 2,
  nextLevelProgress: 0.75 // 75% para Nível 3
}
```

### `votes.getMine(postCid)`

Verifica se/como você votou.

```typescript
const myVote = await iceberg.votes.getMine('bafybeigdyrzt5...');

// Retorno (ou null se não votou)
{
  type: 'up',            // 'up' | 'down' | 'report'
  timestamp: 1702345678000,
  weight: 2              // Baseado na sua reputação
}
```

### `votes.cast(postCid, type)`

Registra um voto (requer identidade).

```typescript
await iceberg.votes.cast('bafybeigdyrzt5...', 'up');
// Tipos: 'up' | 'down' | 'report'

// Retorno
{
  success: true,
  newScore: 1543,
  yourWeight: 2
}
```

> [!NOTE]
> Você só pode votar uma vez por post. Votar novamente substitui o anterior.

---

## `iceberg.comments`

Sistema de comentários em thread.

### `comments.list(postCid, options?)`

Lista comentários de um post.

```typescript
const comments = await iceberg.comments.list('bafybeigdyrzt5...', {
  sortBy: 'top',    // 'top' | 'recent' | 'controversial'
  limit: 50,
  offset: 0
});

// Retorno
{
  comments: [
    {
      cid: 'bafybei...',
      parentCid: 'bafybeigdyrzt5...', // CID do post ou comentário pai
      body: 'Meu comentário em Markdown...',
      author: 'ed25519:8YjZ3...',
      createdAt: 1702345678000,
      votes: { up: 45, down: 2 },
      children: [                     // Respostas aninhadas
        { /* ... */ }
      ]
    }
  ],
  total: 234
}
```

### `comments.create(data)`

Cria um comentário (requer identidade).

```typescript
await iceberg.comments.create({
  parentCid: "bafybeigdyrzt5...", // Post ou comentário
  body: "Minha resposta em **Markdown**...",
});
```

---

## `iceberg.files`

Upload e download de arquivos via IPFS.

### `files.upload(data, options?)`

Faz upload de arquivo para IPFS.

```typescript
// Via Buffer
const cid = await iceberg.files.upload(buffer, {
  filename: "documento.pdf",
  encrypt: true, // Encriptar antes de enviar
  pin: true, // Manter pinado localmente
});

// Via File (browser)
const file = document.querySelector("input[type=file]").files[0];
const cid = await iceberg.files.upload(file);

// Via caminho (Node.js)
const cid = await iceberg.files.upload("/path/to/file.pdf");

// Retorno
("bafybei..."); // CID do arquivo
```

### `files.download(cid)`

Baixa arquivo do IPFS.

```typescript
const data = await iceberg.files.download('bafybei...');

// Retorno
{
  buffer: Uint8Array,
  filename: 'documento.pdf',
  mimeType: 'application/pdf',
  size: 1234567
}
```

### `files.info(cid)`

Obtém metadados sem baixar.

```typescript
const info = await iceberg.files.info('bafybei...');

// Retorno
{
  cid: 'bafybei...',
  filename: 'documento.pdf',
  mimeType: 'application/pdf',
  size: 1234567,
  encrypted: true,
  seedCount: 42
}
```

---

## `iceberg.consensus`

Informações sobre o estado de consenso.

### `consensus.checkLevel(cid)`

Verifica o nível atual de um CID.

```typescript
const level = await iceberg.consensus.checkLevel("bafybeigdyrzt5...");
// Retorno: 0, 1, 2 ou 3
```

### `consensus.metrics(cid)`

Obtém métricas detalhadas de consenso.

```typescript
const metrics = await iceberg.consensus.metrics('bafybeigdyrzt5...');

// Retorno
{
  cid: 'bafybeigdyrzt5...',
  level: 2,

  seeds: {
    local: 342,          // Na cidade de origem
    regional: 12847,     // Na região
    global: 145678       // Total
  },

  votes: {
    up: 1542,
    down: 23,
    reports: 5,
    uniqueVoters: 1450,
    weightedScore: 3254   // Considerando reputação
  },

  regions: {
    primary: 'BR-SP-SAO_PAULO',
    spread: ['BR-RJ', 'BR-MG', 'BR-RS'],  // Regiões com seeds
    continents: 2
  },

  progress: {
    currentLevel: 2,
    nextLevel: 3,
    progress: 0.75,       // 75% do caminho
    requirements: {
      seeds: { current: 145678, required: 500000 },
      time: { current: 48, required: 168 },  // horas
      superNodes: { current: 0.42, required: 0.60 }
    }
  },

  timeline: [
    { level: 0, at: 1702345678000 },
    { level: 1, at: 1702367890000 },
    { level: 2, at: 1702456789000 }
  ]
}
```

---

## `iceberg.regions`

Dados geográficos (IBGE).

### `regions.list(options?)`

Lista regiões disponíveis.

```typescript
const regions = await iceberg.regions.list({
  country: "BR",
  state: "SP", // Opcional
  search: "campinas", // Opcional
});

// Retorno
[
  {
    code: "BR-SP-CAMPINAS",
    name: "Campinas",
    state: "São Paulo",
    country: "Brasil",
    population: 1213792,
    coordinates: { lat: -22.9064, lng: -47.0616 },
  },
];
```

### `regions.get(code)`

Obtém detalhes de uma região.

```typescript
const region = await iceberg.regions.get("BR-SP-CAMPINAS");
```

### `regions.nearby(code, radius?)`

Lista regiões próximas.

```typescript
const nearby = await iceberg.regions.nearby("BR-SP-CAMPINAS", 100);
// Retorna cidades num raio de 100km
```

---

## `iceberg.bounties`

Gerenciamento de recompensas.

### `bounties.deposit(postCid, amount)`

Deposita bounty em um post.

```typescript
const tx = await iceberg.bounties.deposit('bafybeigdyrzt5...', {
  amount: 100,
  token: 'ICEBERG'
});

// Retorno
{
  txHash: '0x...',
  status: 'confirmed',
  amount: 100,
  expiresAt: 1702456789000
}
```

### `bounties.claim(postCid)`

Reivindica sua parte do bounty.

```typescript
const claim = await iceberg.bounties.claim('bafybeigdyrzt5...');

// Retorno
{
  txHash: '0x...',
  amount: 25,        // Sua parte
  totalClaimed: 75,  // Total já distribuído
  remaining: 25      // Restante no pool
}
```

### `bounties.status(postCid)`

Verifica status do bounty.

```typescript
const status = await iceberg.bounties.status('bafybeigdyrzt5...');

// Retorno
{
  total: 100,
  claimed: 45,
  remaining: 55,
  eligibleVoters: 22,
  myEligibility: {
    eligible: true,
    reason: 'voted',
    estimatedShare: 4.5
  },
  expiresAt: 1702456789000
}
```

---

## Eventos (Real-time)

### Subscription

```typescript
// Subscrever a novos posts de uma região
const unsubscribe = iceberg.subscribe(
  "posts",
  {
    region: "BR-SP-SAO_PAULO",
    level: 1,
  },
  (event) => {
    console.log("Novo post:", event.post);
  }
);

// Parar de ouvir
unsubscribe();
```

### Tipos de Eventos

```typescript
type EventType =
  | "posts" // Novos posts
  | "votes" // Votos em post específico
  | "comments" // Comentários em post específico
  | "levelChange" // Mudança de nível
  | "bounty" // Atividade de bounty
  | "network"; // Status da rede

iceberg.subscribe("levelChange", { cid: "bafybei..." }, (event) => {
  console.log(`Post subiu para nível ${event.newLevel}!`);
});
```

---

## Tratamento de Erros

```typescript
import { IcebergError, ErrorCodes } from "@iceberg/sdk";

try {
  await iceberg.posts.create({ title: "", body: "" });
} catch (error) {
  if (error instanceof IcebergError) {
    switch (error.code) {
      case ErrorCodes.NOT_AUTHENTICATED:
        console.log("Faça login primeiro");
        break;
      case ErrorCodes.VALIDATION_ERROR:
        console.log("Dados inválidos:", error.details);
        break;
      case ErrorCodes.NETWORK_ERROR:
        console.log("Sem conexão com daemon");
        break;
      case ErrorCodes.INSUFFICIENT_FUNDS:
        console.log("Saldo insuficiente para bounty");
        break;
      default:
        console.log("Erro:", error.message);
    }
  }
}
```

---

## API REST (Daemon)

Para quem prefere HTTP direto (sem SDK).

### Endpoints

| Método | Endpoint      | Descrição        |
| ------ | ------------- | ---------------- |
| GET    | `/health`     | Status do daemon |
| GET    | `/posts`      | Listar posts     |
| GET    | `/posts/:cid` | Obter post       |
| POST   | `/posts`      | Criar post       |
| GET    | `/votes/:cid` | Obter votos      |
| POST   | `/votes/:cid` | Votar            |
| POST   | `/files`      | Upload           |
| GET    | `/files/:cid` | Download         |

### Exemplo cURL

```bash
# Listar posts
curl http://localhost:8420/posts?region=BR-SP-SAO_PAULO&level=1

# Criar post (precisa de autenticação)
curl -X POST http://localhost:8420/posts \
  -H "Authorization: Ed25519 <assinatura>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Teste","body":"Conteúdo...","region":"BR-SP-SAO_PAULO"}'
```

---

## Próximo Documento

Veja [08_ROADMAP.md](./08_ROADMAP.md) para as fases de desenvolvimento.
