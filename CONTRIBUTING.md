# Contributing to Iceberg Protocol

Thank you for your interest in contributing to the Iceberg Protocol! 🧊

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

```bash
# Clone
git clone https://github.com/MrJc01/crom-protocolo-iceberg.git
cd crom-protocolo-iceberg

# Install dependencies
npm install

# Start development
cd packages/daemon && npm run dev
cd packages/web-client && npm run dev
```

## 📝 How to Contribute

### Reporting Bugs

1. Check existing issues first
2. Create new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Feature Requests

1. Open an issue with `[Feature]` prefix
2. Describe the feature and use case
3. Discuss before implementing

### Pull Requests

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Make changes
4. Run tests (`npm test`)
5. Commit with conventional commits (`feat:`, `fix:`, `docs:`)
6. Push and create PR

## 🏗️ Project Structure

```
packages/
├── daemon/      # API server (Express + SQLite)
├── web-client/  # Frontend (Next.js)
├── sdk/         # Core library
└── cli/         # Command line interface
```

## 🧪 Testing

```bash
# API tests
cd packages/daemon && npx tsx tests/api.test.ts

# TypeScript check
npm run typecheck
```

## 📚 Code Style

- TypeScript for all code
- ESLint + Prettier
- Conventional commits
- Component naming: PascalCase
- File naming: kebab-case

## 📜 License

By contributing, you agree that your contributions will be licensed under AGPL-3.0.
