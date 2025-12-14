# Instruções para AI Agent (AntiGravity)

## Contexto

Este documento contém instruções específicas para um agente de IA construir o Protocolo Iceberg.

---

## Missão

Construir uma plataforma descentralizada de informação cidadã baseada em:

1. **Fork do TabNews** como base visual
2. **IPFS + Libp2p** para armazenamento e rede
3. **ED25519** para identidades criptográficas
4. **Sistema de 4 níveis** para consenso distribuído

---

## Documentação a Seguir

Leia os documentos na seguinte ordem:

1. `docs/01_MANIFESTO_DO_PROJETO.md` - Filosofia e restrições
2. `docs/02_ARQUITETURA_DO_SISTEMA.md` - Estrutura técnica
3. `docs/03_LOGICA_DE_CONSENSO.md` - Regras de níveis
4. `docs/04_ESPECIFICACAO_FRONTEND.md` - Adaptação do TabNews
5. `docs/05_TOKENOMICS_E_INCENTIVOS.md` - Economia
6. `docs/06_SEGURANCA_E_PRIVACIDADE.md` - Segurança
7. `docs/07_SDK_E_API.md` - API reference
8. `docs/08_ROADMAP.md` - Fases de desenvolvimento
9. `docs/09_GUIA_ADAPTACAO_TABNEWS.md` - Passos para adaptar TabNews
10. `docs/10_GLOSSARIO_E_REFERENCIAS.md` - Termos e referências
11. `docs/11_INTEGRACAO_NODUS_CLI.md` - **CLI e integração com crom-nodus**

---

## Prioridades de Implementação

### Fase 1: Setup do Monorepo

```bash
# Criar estrutura de pastas
mkdir -p packages/core-daemon
mkdir -p packages/sdk
mkdir -p packages/web-client
mkdir -p apps/desktop
mkdir -p apps/mobile
mkdir -p config
mkdir -p scripts
```

### Fase 2: Core Daemon (Go)

Implementar em ordem:

1. Módulo de identidade (crypto/identity.go)
2. Integração IPFS básica
3. API HTTP local
4. Rede P2P (Libp2p)
5. Lógica de consenso

### Fase 3: SDK (TypeScript)

Implementar em ordem:

1. Cliente HTTP para daemon
2. Gerenciamento de identidade
3. Métodos para posts/votes/comments
4. Real-time via WebSocket

### Fase 4: Web Client (Next.js)

1. Clonar TabNews
2. Remover código de Postgres
3. Implementar IdentityContext
4. Conectar ao SDK
5. Adicionar indicadores de nível

---

## Regras Absolutas

### O Que NÃO FAZER

> [!CAUTION]
> Violações destas regras invalidam a implementação.

```
❌ Usar PostgreSQL, MySQL ou qualquer banco centralizado
❌ Implementar login por email/senha
❌ Criar endpoints que coletam IP dos usuários
❌ Depender de CDNs ou APIs de terceiros para funcionalidade core
❌ Armazenar chaves privadas em servidor
❌ Criar ponto único de falha
```

### O Que DEVE FAZER

```
✅ Usar IPFS para armazenamento
✅ Usar ED25519 para identidades
✅ Assinar todas as ações (posts, votos, comentários)
✅ Verificar assinaturas antes de aceitar dados
✅ Implementar rate limiting
✅ Logar apenas informações não-identificáveis
```

---

## Arquivos de Configuração

Usar os arquivos em `config/`:

- `consensus_rules.json` - Regras de níveis e thresholds
- `bootstrap_nodes.json` - Nós iniciais da rede

Estes arquivos definem o comportamento do sistema e podem ser modificados pela comunidade via consenso.

---

## Stack Técnico Obrigatório

| Componente  | Tecnologia   | Versão Mínima |
| ----------- | ------------ | ------------- |
| Core Daemon | Go           | 1.21          |
| Base P2P    | @nodus/core (crom-nodus) | latest |
| SDK         | TypeScript   | 5.0           |
| Frontend    | Next.js      | 14            |
| Styling     | Tailwind CSS | 3.0           |
| P2P         | Libp2p       | latest        |
| Storage     | IPFS (Kubo)  | 0.24          |
| Crypto      | TweetNaCl    | 1.0           |

---

## Testes Obrigatórios

### Core Daemon

- Geração de identidade
- Assinatura e verificação
- Add/Get no IPFS
- Conexão P2P básica

### SDK

- Todas as operações de API
- Gerenciamento de identidade
- Tratamento de erros

### Frontend

- Fluxo de criação de conta
- Listagem de posts
- Votação

---

## Métricas de Sucesso

Ao finalizar cada fase, verificar:

### Fase 1 (Setup)

- [ ] Monorepo compila sem erros
- [ ] Estrutura de pastas conforme spec

### Fase 2 (Daemon)

- [ ] `go run cmd/daemon/main.go` inicia
- [ ] API responde em localhost:8420
- [ ] Conecta a pelo menos 1 peer

### Fase 3 (SDK)

- [ ] `npm install @iceberg/sdk` funciona
- [ ] Exemplo básico executa
- [ ] Testes passam

### Fase 4 (Frontend)

- [ ] `npm run dev` inicia
- [ ] Login por chave funciona
- [ ] Feed exibe posts mockados

---

## Pontos de Integração

### Daemon ↔ SDK

O SDK comunica com o daemon via HTTP:

```
http://localhost:8420/posts     - CRUD de posts
http://localhost:8420/votes     - Sistema de votos
http://localhost:8420/identity  - Gerenciamento de chaves
http://localhost:8420/files     - Upload/download IPFS
```

### SDK ↔ Frontend

O frontend importa o SDK:

```typescript
import { Iceberg } from "@iceberg/sdk";

const client = new Iceberg({ daemonUrl: "http://localhost:8420" });
const posts = await client.posts.list({ region: "BR-SP-SAO_PAULO" });
```

---

## Em Caso de Dúvidas

1. Consultar documentação em `docs/`
2. Verificar `config/consensus_rules.json` para thresholds
3. Seguir padrões do TabNews para decisões de UI
4. Priorizar segurança e descentralização sobre features

---

## Licença

Todo código deve ser compatível com AGPL-3.0.
