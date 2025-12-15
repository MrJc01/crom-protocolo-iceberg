# Iceberg Desktop App

App desktop do Protocolo Iceberg, construído com Tauri para máxima performance e tamanho mínimo.

## Características

- 🚀 **Ultra leve**: ~3MB (vs ~150MB do Electron)
- 🔒 **Seguro**: Backend em Rust com isolamento de processo
- ⚡ **Rápido**: Inicialização em <1 segundo
- 🌐 **Multiplataforma**: Windows, macOS, Linux

## Modo Local

O app desktop **sempre** roda em modo LOCAL, o que significa:

- ✅ Acesso completo às configurações do sistema
- ✅ Monitoramento detalhado de recursos (RAM, CPU, disco)
- ✅ Configuração de limites personalizados
- ✅ Gerenciamento de armazenamento local
- ✅ Exportação e importação de dados

## Requisitos

- Node.js 18+
- Rust (para build do Tauri)
- [Pré-requisitos do Tauri](https://tauri.app/v1/guides/getting-started/prerequisites)

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev
```

## Build

```bash
# Build para produção
npm run build
```

Os instaladores serão gerados em `src-tauri/target/release/bundle/`.

## Estrutura

```
apps/desktop/
├── package.json          # Configuração do projeto
├── src-tauri/
│   ├── Cargo.toml        # Dependências Rust
│   ├── tauri.conf.json   # Configuração do Tauri
│   └── src/
│       ├── main.rs       # Entry point Rust
│       └── lib.rs        # Comandos customizados
└── README.md
```

## Variáveis de Ambiente

O app automaticamente define:

- `ICEBERG_MODE=local` - Habilita modo local com acesso total

## Integração com Daemon

O app Tauri inicia automaticamente o daemon Iceberg como um processo filho,
garantindo que todas as operações sejam locais e seguras.
