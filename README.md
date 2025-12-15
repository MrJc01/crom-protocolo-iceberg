# Protocolo Iceberg

> O conhecimento da humanidade, preservado para sempre. Descentralizado, imutável, sem censura.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Status: Em Desenvolvimento](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow.svg)]()

---

## 🎯 O Que É

O **Protocolo Iceberg** é uma rede descentralizada para preservar e compartilhar o conhecimento da humanidade. Como um WikiLeaks moderno, mas para **todo tipo de conteúdo** - arte, ciência, tecnologia, cultura, história, música, memes, e tudo mais que merece existir sem o risco de censura.

### Características Principais

- 🧊 **Imutável**: Conteúdo preservado para sempre via IPFS
- 🔐 **Anônimo por Design**: Identidade baseada em chaves criptográficas
- 🌍 **Descentralizado**: Sem servidor central, sem ponto de falha
- ✅ **Verificado pela Comunidade**: Sistema de níveis baseado em consenso
- 📍 **Foco Regional**: Conteúdo relevante para sua região
- ₿ **Bounties**: Recompensas em Bitcoin para verificações
- 💻 **CLI Completa**: Operação via terminal

---

## 📚 Documentação

| Documento                                                             | Descrição                     |
| --------------------------------------------------------------------- | ----------------------------- |
| [01_MANIFESTO_DO_PROJETO.md](./docs/01_MANIFESTO_DO_PROJETO.md)       | Visão, filosofia e objetivos  |
| [02_ARQUITETURA_DO_SISTEMA.md](./docs/02_ARQUITETURA_DO_SISTEMA.md)   | Stack técnico e estrutura     |
| [03_LOGICA_DE_CONSENSO.md](./docs/03_LOGICA_DE_CONSENSO.md)           | Sistema de níveis e validação |
| [04_ESPECIFICACAO_FRONTEND.md](./docs/04_ESPECIFICACAO_FRONTEND.md)   | Adaptação do TabNews          |
| [05_TOKENOMICS_E_INCENTIVOS.md](./docs/05_TOKENOMICS_E_INCENTIVOS.md) | Economia e recompensas        |
| [06_SEGURANCA_E_PRIVACIDADE.md](./docs/06_SEGURANCA_E_PRIVACIDADE.md) | Criptografia e proteções      |
| [07_SDK_E_API.md](./docs/07_SDK_E_API.md)                             | Documentação para devs        |
| [08_ROADMAP.md](./docs/08_ROADMAP.md)                                 | Fases de desenvolvimento      |

---

## 🏗️ Estrutura do Projeto

```
crom-protocolo-iceberg/
├── docs/                    # Documentação técnica
├── packages/
│   ├── daemon/              # Backend API (TypeScript/Express)
│   ├── cli/                 # CLI completa (TypeScript/Commander)
│   ├── sdk/                 # Biblioteca JS/TS
│   └── web-client/          # Frontend (Next.js)
├── .github/                 # GitHub Actions CI
├── docker-compose.yml       # Deploy com Docker
└── README.md
```

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- Git

### Instalação

```bash
# Clonar repositório
git clone https://github.com/MrJc01/crom-protocolo-iceberg.git
cd crom-protocolo-iceberg

# Instalar dependências
npm install

# Iniciar daemon
cd packages/daemon
npm run dev

# Em outro terminal, iniciar frontend
cd packages/web-client
npm run dev
```

---

## 🔧 Tecnologias

| Camada           | Tecnologia                                                        |
| ---------------- | ----------------------------------------------------------------- |
| **Rede P2P**     | Libp2p, IPFS, [@nodus/core](https://github.com/MrJc01/crom-nodus) |
| **Criptografia** | ED25519, ChaCha20                                                 |
| **Backend**      | Node.js, Express, SQLite                                          |
| **Frontend**     | Next.js, React, Tailwind CSS, Zustand                             |
| **SDK**          | TypeScript                                                        |
| **Anonimato**    | Tor (opcional)                                                    |
| **DevOps**       | Docker, Docker Compose                                            |

---

## ✨ Recursos Implementados

- ✅ Sistema de identidade (ED25519)
- ✅ Publicação e votação de ices
- ✅ Comentários em thread
- ✅ Sistema de reports
- ✅ Chat P2P
- ✅ Agendamento de posts
- ✅ Moderação por IA (Gemini)
- ✅ Tema claro/escuro
- ✅ Docker ready
- ✅ Rate limiting
- ✅ Logging estruturado (Pino)
- ✅ Métricas Prometheus
- ✅ CLI completa (6 grupos de comandos)
- ✅ PWA com Service Worker
- ✅ Sistema de Toast
- ✅ Onboarding Wizard
- ✅ Editor Markdown WYSIWYG
- ✅ GitHub Actions CI
- ✅ Audit de Segurança

---

## 🖥️ CLI

O Iceberg possui uma CLI completa para operação via terminal:

```bash
# Instalar CLI globalmente
npm install -g @iceberg/cli

# Identidade
iceberg identity create      # Criar nova identidade
iceberg identity show        # Mostrar identidade atual

# Posts (Ices)
iceberg posts list           # Listar ices
iceberg posts create         # Criar ice

# Votos
iceberg vote up <cid>        # Votar positivo
iceberg vote down <cid>      # Votar negativo

# Daemon
iceberg daemon status        # Status do daemon
iceberg daemon start         # Iniciar daemon
iceberg daemon stop          # Parar daemon

# Sincronização
iceberg sync status          # Status da rede
iceberg sync export          # Exportar dados
iceberg sync import <file>   # Importar dados

# Configurações
iceberg config show          # Ver configurações
iceberg config set <key> <value>
```

---

## 🔌 API Endpoints

| Endpoint              | Descrição                |
| --------------------- | ------------------------ |
| `GET /health`         | Status do daemon         |
| `GET /posts`          | Listar ices              |
| `POST /posts`         | Criar ice                |
| `GET /votes`          | Listar votos             |
| `POST /votes`         | Votar                    |
| `GET /consensus`      | Estatísticas de consenso |
| `GET /metrics`        | Métricas Prometheus      |
| `GET /security/audit` | Audit de segurança       |

---

## 🐳 Docker Deployment

```bash
# Produção com Docker
docker-compose up -d

# Verificar status
docker-compose ps

# Parar
docker-compose down
```

---

## 🧪 Testes

```bash
# Testes de API
cd packages/daemon && npx tsx tests/api.test.ts

# Testes unitários
cd packages/daemon && npx tsx tests/storage.test.ts

# Testes E2E (requer Playwright)
cd packages/web-client && npx playwright test

# TypeScript check
cd packages/daemon && npx tsc --noEmit
cd packages/web-client && npx tsc --noEmit
```

---

## 📊 Sistema de Níveis

| Nível | Nome     | Visibilidade | Requisito           |
| ----- | -------- | ------------ | ------------------- |
| 0     | The Wild | Link direto  | Qualquer post       |
| 1     | Regional | Cidade       | 33% dos nós locais  |
| 2     | Surface  | Global       | 100k seeds + 24h    |
| 3     | Legacy   | Permanente   | 500k seeds + 7 dias |

---

## 🤝 Contribuindo

1. Leia a documentação completa na pasta `docs/`
2. Fork o repositório
3. Crie uma branch (`git checkout -b feature/MinhaFeature`)
4. Commit suas mudanças (`git commit -am 'Add MinhaFeature'`)
5. Push para a branch (`git push origin feature/MinhaFeature`)
6. Abra um Pull Request

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para mais detalhes.

---

## 📄 Licença

Este projeto é licenciado sob a [AGPL-3.0](./LICENSE) - veja o arquivo LICENSE para detalhes.

---

## 🙏 Agradecimentos

- [Filipe Deschamps](https://github.com/filipedeschamps) pelo TabNews (inspiração de UI/UX)
- Comunidade IPFS e Libp2p
- Projeto Tor

---

## ⚠️ Status

> **MVP Funcional.** Pronto para testes beta.

Para acompanhar o progresso, veja [08_ROADMAP.md](./docs/08_ROADMAP.md).
