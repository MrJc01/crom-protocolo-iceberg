# 11. Integração com Nodus e CLI

## Visão Geral

O Protocolo Iceberg integra com o projeto **crom-nodus** para fornecer:

1. **CLI completa** para operações via terminal
2. **Rede P2P** já funcional com relay servers
3. **SDK `@nodus/core`** para comunicação entre nós
4. **Sistema de identidade** criptográfica pronto

---

## Por Que Usar Nodus?

O **crom-nodus** já resolve problemas complexos que o Iceberg precisa:

| Funcionalidade | Nodus | Benefício para Iceberg |
|----------------|-------|------------------------|
| Identidade ED25519 | ✅ | Mesma criptografia especificada |
| CLI interativa | ✅ | Acessibilidade para power users |
| Relay P2P | ✅ | Infraestrutura de rede pronta |
| SQLite local | ✅ | Armazenamento offline |
| SDK TypeScript | ✅ | Compatível com web-client |

---

## Arquitetura Integrada

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROTOCOLO ICEBERG                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │     CLI     │    │  Web Client │    │   Apps de Terceiros │  │
│  │  (Terminal) │    │  (Next.js)  │    │      (Via SDK)      │  │
│  └──────┬──────┘    └──────┬──────┘    └──────────┬──────────┘  │
│         │                  │                      │              │
│         └────────────┬─────┴──────────────────────┘              │
│                      │                                           │
│               ┌──────▼──────┐                                    │
│               │ @iceberg/sdk │ ◄── Wrapper sobre @nodus/core     │
│               └──────┬──────┘                                    │
│                      │                                           │
│               ┌──────▼──────┐                                    │
│               │ @nodus/core │ ◄── Rede P2P e Criptografia        │
│               └──────┬──────┘                                    │
│                      │                                           │
├──────────────────────┼──────────────────────────────────────────┤
│                      │                                           │
│  ┌───────────────────▼───────────────────┐                      │
│  │           Iceberg Daemon               │                      │
│  │  ┌─────────┐  ┌─────────┐  ┌────────┐ │                      │
│  │  │NodusNode│  │  IPFS   │  │Consenso│ │                      │
│  │  │  P2P    │  │ Storage │  │ Engine │ │                      │
│  │  └────┬────┘  └────┬────┘  └───┬────┘ │                      │
│  │       └────────────┴───────────┘      │                      │
│  └───────────────────────────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## CLI do Iceberg

### Instalação

```bash
# Via NPM (global)
npm install -g @iceberg/cli

# Ou via source
git clone https://github.com/MrJc01/crom-protocolo-iceberg.git
cd crom-protocolo-iceberg
npm install
npm link
```

### Comandos Básicos

#### Daemon

```bash
# Iniciar daemon em background
iceberg start

# Verificar status
iceberg status
# Saída: Daemon running | Peers: 42 | Posts cached: 1,234

# Parar daemon
iceberg stop

# Logs em tempo real
iceberg logs -f
```

#### Identidade

```bash
# Criar nova identidade
iceberg identity create
# Saída: 
# ⚠️  GUARDE ESTAS PALAVRAS:
# abandon ability able about above absent...
# 
# Sua chave pública: ed25519:8YjZ3...

# Mostrar identidade atual
iceberg identity show
# Saída: ed25519:8YjZ3...  |  Reputação: 150

# Exportar para backup
iceberg identity export --output backup.key

# Importar de backup
iceberg identity import backup.key
iceberg identity import --mnemonic "abandon ability..."
```

#### Posts / Denúncias

```bash
# Listar posts da região
iceberg posts list --region BR-SP-SAO_PAULO --level 1
# Saída:
# CID                       | NÍVEL | TÍTULO
# bafybei...abc             | 2     | Denúncia de corrupção...
# bafybei...def             | 1     | Obra parada há 2 anos...

# Ver post específico
iceberg posts get bafybei...abc
# Exibe conteúdo Markdown no terminal

# Criar post
iceberg posts create --title "Minha Denúncia" --body "Descrição..." --region BR-SP-SAO_PAULO

# Criar post a partir de arquivo
iceberg posts create --file denuncia.md --region BR-SP-SAO_PAULO

# Criar post interativo
iceberg posts create --interactive
# Abre editor $EDITOR para escrever
```

#### Votos

```bash
# Votar positivo
iceberg vote up bafybei...abc

# Votar negativo
iceberg vote down bafybei...abc

# Denunciar conteúdo
iceberg vote report bafybei...abc

# Ver meu voto
iceberg vote status bafybei...abc
```

#### Arquivos

```bash
# Upload para IPFS
iceberg files upload documento.pdf
# Saída: bafybei...xyz

# Download
iceberg files download bafybei...xyz --output documento.pdf

# Info
iceberg files info bafybei...xyz
```

#### Regiões

```bash
# Listar regiões disponíveis
iceberg regions list --country BR --state SP

# Definir região padrão
iceberg config set region BR-SP-SAO_PAULO

# Ver região atual
iceberg config get region
```

#### Rede

```bash
# Listar peers conectados
iceberg peers list

# Status da rede
iceberg network status
# Saída:
# Peers conectados: 42
# Relay: crom.relay.network:3000
# IPFS Gateway: localhost:8080

# Adicionar relay
iceberg relays add wss://meu-relay.com:3000
```

### Modo Interativo (REPL)

```bash
iceberg repl
# Entra em modo interativo

iceberg> posts list
iceberg> vote up bafybei...abc
iceberg> exit
```

### Flags Globais

```bash
--daemon-url   URL do daemon (default: http://localhost:8420)
--region       Região para operações (override config)
--json         Saída em JSON
--verbose      Logs detalhados
--quiet        Sem output (apenas erros)
--tor          Força uso de Tor
```

---

## Integração Técnica com @nodus/core

### Estrutura do Daemon

```typescript
// packages/daemon/src/index.ts

import { NodusNode, CROM_RELAY_URL } from "@nodus/core";
import { IcebergConsensus } from "./consensus";
import { IcebergStorage } from "./storage";
import { IcebergAPI } from "./api";

interface IcebergDaemonConfig {
  storagePath: string;
  relayUrl: string;
  ipfsPath?: string;
  apiPort: number;
  region: string;
}

export class IcebergDaemon {
  private node: NodusNode;
  private consensus: IcebergConsensus;
  private storage: IcebergStorage;
  private api: IcebergAPI;

  constructor(config: IcebergDaemonConfig) {
    // Inicializar NodusNode para P2P
    this.node = new NodusNode({
      storagePath: config.storagePath,
      signalingUrl: config.relayUrl || CROM_RELAY_URL,
      autoConnect: true,
    });

    // Motor de consenso (níveis 0-3)
    this.consensus = new IcebergConsensus(this.node);

    // Armazenamento IPFS
    this.storage = new IcebergStorage(config.ipfsPath);

    // API HTTP
    this.api = new IcebergAPI(this, config.apiPort);
  }

  async start() {
    await this.node.start();
    await this.storage.start();
    await this.api.start();

    console.log(`Iceberg Daemon rodando`);
    console.log(`  ID: ${this.node.getInfo().shortId}`);
    console.log(`  API: http://localhost:${this.api.port}`);

    // Escutar posts P2P
    this.node.on("message", (msg) => this.handleP2PMessage(msg));
  }

  private async handleP2PMessage(msg: any) {
    const data = JSON.parse(msg.content);

    switch (data.type) {
      case "post":
        await this.handleNewPost(data);
        break;
      case "vote":
        await this.handleVote(data);
        break;
      case "sync_request":
        await this.handleSyncRequest(msg.from, data);
        break;
    }
  }

  // Criar post
  async createPost(input: CreatePostInput): Promise<string> {
    // Adicionar ao IPFS
    const cid = await this.storage.add(input);

    // Broadcast via Nodus P2P
    await this.node.broadcast({
      type: "post",
      cid,
      region: input.region,
      author: this.node.getInfo().publicKey,
      timestamp: Date.now(),
    });

    // Registrar no consenso local
    this.consensus.registerPost(cid, input.region);

    return cid;
  }

  // Votar
  async vote(cid: string, type: "up" | "down" | "report"): Promise<void> {
    const vote = {
      type: "vote",
      postCid: cid,
      voteType: type,
      voter: this.node.getInfo().publicKey,
      timestamp: Date.now(),
    };

    // Broadcast voto
    await this.node.broadcast(vote);

    // Atualizar consenso local
    this.consensus.registerVote(cid, vote);
  }

  getIdentity() {
    return this.node.getInfo();
  }
}
```

### CLI usando Commander.js

```typescript
// packages/cli/src/index.ts

import { Command } from "commander";
import { IcebergClient } from "@iceberg/sdk";

const program = new Command();
const client = new IcebergClient();

program
  .name("iceberg")
  .description("CLI para o Protocolo Iceberg")
  .version("0.1.0");

// Subcomando: identity
const identity = program.command("identity");

identity
  .command("create")
  .description("Criar nova identidade")
  .action(async () => {
    const result = await client.identity.create();
    console.log("\n⚠️  GUARDE ESTAS PALAVRAS:\n");
    console.log(result.mnemonic);
    console.log(`\nSua chave pública: ${result.publicKey}`);
  });

identity
  .command("show")
  .description("Mostrar identidade atual")
  .action(async () => {
    const info = await client.identity.whoami();
    if (info) {
      console.log(`Chave: ${info.publicKey}`);
      console.log(`Reputação: ${info.reputation}`);
    } else {
      console.log("Nenhuma identidade configurada. Use: iceberg identity create");
    }
  });

// Subcomando: posts
const posts = program.command("posts");

posts
  .command("list")
  .description("Listar posts")
  .option("-r, --region <code>", "Código da região")
  .option("-l, --level <n>", "Nível mínimo (0-3)")
  .option("-n, --limit <n>", "Quantidade", "10")
  .action(async (opts) => {
    const result = await client.posts.list({
      region: opts.region,
      level: opts.level ? parseInt(opts.level) : undefined,
      limit: parseInt(opts.limit),
    });

    console.table(
      result.posts.map((p) => ({
        cid: p.cid.slice(0, 12) + "...",
        nivel: p.level,
        titulo: p.title.slice(0, 40),
        votos: p.votes.up - p.votes.down,
      }))
    );
  });

posts
  .command("create")
  .description("Criar novo post")
  .option("-t, --title <title>", "Título")
  .option("-b, --body <body>", "Conteúdo")
  .option("-f, --file <path>", "Arquivo Markdown")
  .option("-r, --region <code>", "Região")
  .option("-i, --interactive", "Modo interativo")
  .action(async (opts) => {
    let content = {
      title: opts.title,
      body: opts.body,
      region: opts.region,
    };

    if (opts.file) {
      const fs = await import("fs/promises");
      const md = await fs.readFile(opts.file, "utf-8");
      // Extrair título do primeiro # heading
      const match = md.match(/^#\s+(.+)$/m);
      content.title = match ? match[1] : opts.title;
      content.body = md;
    }

    if (opts.interactive) {
      // Abrir $EDITOR
      const { editInEditor } = await import("./utils/editor");
      content.body = await editInEditor(content.body || "");
    }

    const result = await client.posts.create(content);
    console.log(`✅ Post criado: ${result.cid}`);
  });

// Subcomando: vote
program
  .command("vote <type> <cid>")
  .description("Votar em post (up/down/report)")
  .action(async (type, cid) => {
    await client.votes.cast(cid, type);
    console.log(`✅ Voto '${type}' registrado para ${cid}`);
  });

program.parse();
```

---

## Relay Servers

O Iceberg pode usar os mesmos relays do Nodus ou criar novos.

### Usar Relay Crom (Padrão)

```typescript
import { CROM_RELAY_URL } from "@nodus/core";
// CROM_RELAY_URL = "wss://relay.crom.network:3000"
```

### Relay Próprio

```bash
# Iniciar relay local
cd packages/relay
npm start

# Configurar no daemon
iceberg config set relay wss://meu-relay.com:3000
```

### Multi-Relay

```typescript
const node = new NodusNode({
  relays: [
    "wss://relay1.iceberg.network:3000",
    "wss://relay2.iceberg.network:3000",
    "wss://relay.crom.network:3000",
  ],
});
```

---

## Integração com Nexus

O **crom-nexus** pode ser usado para criar scripts de automação:

```bash
# Criar script do Iceberg para Nexus
nexus install @iceberg

# Usar via Nexus
nexus @iceberg posts --region BR-SP-SAO_PAULO
nexus @iceberg vote up bafybei...
```

### Script Nexus

```javascript
// nexus-scripts/iceberg/index.nx.js

Nexus.register({
  name: "iceberg",
  description: "Protocolo Iceberg via terminal",

  commands: {
    posts: async (args) => {
      const res = await fetch(
        `http://localhost:8420/posts?region=${args.region || "global"}`
      );
      return Nexus.table(await res.json());
    },

    vote: async (args) => {
      const [type, cid] = args._;
      await fetch(`http://localhost:8420/votes/${cid}`, {
        method: "POST",
        body: JSON.stringify({ type }),
      });
      return `Votado ${type} em ${cid}`;
    },
  },
});
```

---

## Comparação: CLI vs Web

| Operação | CLI | Web |
|----------|-----|-----|
| Criar identidade | ✅ | ✅ |
| Listar posts | ✅ | ✅ |
| Criar post | ✅ (`$EDITOR`) | ✅ (Markdown editor) |
| Votar | ✅ | ✅ |
| Upload arquivos | ✅ | ✅ |
| Ver mapa de calor | ❌ | ✅ |
| Notificações | ❌ | ✅ |
| Rodar como daemon | ✅ | ❌ |
| Automação/scripts | ✅ | ❌ |
| SSH remoto | ✅ | ❌ |

---

## Próximo Documento

Voltar para [08_ROADMAP.md](./08_ROADMAP.md) ou [01_MANIFESTO_DO_PROJETO.md](./01_MANIFESTO_DO_PROJETO.md).
