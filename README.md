# Protocolo Iceberg

> Plataforma descentralizada de informação cidadã, resistente à censura.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Status: Em Desenvolvimento](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow.svg)]()

---

## 🎯 O Que É

O **Protocolo Iceberg** é uma rede descentralizada para publicação e verificação de informações de interesse público. Inspirado no [TabNews](https://github.com/filipedeschamps/tabnews.com.br), mas construído sobre tecnologias P2P que tornam a censura praticamente impossível.

### Características Principais

- 🔐 **Anônimo por Design**: Identidade baseada em chaves criptográficas, sem email ou dados pessoais
- 🌐 **Descentralizado**: Sem servidor central, dados distribuídos entre milhares de nós
- ✅ **Verificação por Consenso**: Sistema de níveis (0-3) baseado em validação comunitária
- 📍 **Foco Regional**: Informações relevantes para sua cidade aparecem primeiro
- 💰 **Incentivos Econômicos**: Bounties para quem verificar denúncias
- 💻 **CLI Completa**: Opere via terminal com comandos simples (baseado em [crom-nodus](https://github.com/MrJc01/crom-nodus))

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
├── docs/                    # Documentação (você está aqui)
├── packages/
│   ├── core-daemon/         # Motor P2P (Go)
│   ├── sdk/                 # Biblioteca JS/TS
│   └── web-client/          # Frontend (Next.js, fork TabNews)
├── apps/                    # Apps futuros (mobile, desktop)
├── config/                  # Configurações de consenso
└── scripts/                 # Utilitários
```

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- Go 1.21+ (para o daemon)
- Git

### Instalação

```bash
# Clonar repositório
git clone https://github.com/MrJc01/crom-protocolo-iceberg.git
cd crom-protocolo-iceberg

# Instalar dependências
npm install

# Iniciar daemon (se disponível)
cd packages/core-daemon
go run cmd/daemon/main.go

# Em outro terminal, iniciar frontend
cd packages/web-client
npm run dev
```

---

## 🔧 Tecnologias

| Camada           | Tecnologia                                        |
| ---------------- | ------------------------------------------------- |
| **Rede P2P**     | Libp2p, IPFS, [@nodus/core](https://github.com/MrJc01/crom-nodus) |
| **Criptografia** | ED25519, ChaCha20                                 |
| **Backend**      | Go (daemon)                                       |
| **Frontend**     | Next.js, React, Tailwind                          |
| **SDK**          | TypeScript                                        |
| **Anonimato**    | Tor (opcional)                                    |

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

> **Em desenvolvimento ativo.** Não usar em produção ainda.

Para acompanhar o progresso, veja [08_ROADMAP.md](./docs/08_ROADMAP.md).
