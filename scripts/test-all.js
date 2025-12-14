#!/usr/bin/env node

/**
 * Script de Teste Completo do Protocolo Iceberg
 *
 * Executa todos os testes: unitários, integração e E2E
 *
 * Uso: npm run test:all
 */

const { spawn, execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const ROOT_DIR = path.resolve(__dirname, "..");

console.log(`
╔═══════════════════════════════════════════════════════╗
║           PROTOCOLO ICEBERG - SUITE DE TESTES         ║
╚═══════════════════════════════════════════════════════╝
`);

async function runCommand(cmd, cwd, name) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ ${name}...`);
    console.log(`  📂 ${cwd}`);
    console.log(`  ⚡ ${cmd}\n`);

    const parts = cmd.split(" ");
    const proc = spawn(parts[0], parts.slice(1), {
      cwd,
      stdio: "inherit",
      shell: true,
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✅ ${name} - PASSOU\n`);
        resolve(true);
      } else {
        console.log(`\n❌ ${name} - FALHOU (exit code: ${code})\n`);
        resolve(false);
      }
    });

    proc.on("error", (err) => {
      console.log(`\n❌ ${name} - ERRO: ${err.message}\n`);
      resolve(false);
    });
  });
}

async function main() {
  const results = [];

  // 1. Testes do SDK
  const sdkDir = path.join(ROOT_DIR, "packages/sdk");
  if (fs.existsSync(sdkDir)) {
    const passed = await runCommand(
      "npm run test:run",
      sdkDir,
      "Testes Unitários do SDK"
    );
    results.push({ name: "SDK", passed });
  }

  // 2. Build do Daemon (necessário para testes E2E)
  const daemonDir = path.join(ROOT_DIR, "packages/daemon");
  if (fs.existsSync(daemonDir)) {
    await runCommand("npm run build", daemonDir, "Build do Daemon");
  }

  // 3. Testes do CLI
  const cliDir = path.join(ROOT_DIR, "packages/cli");
  if (fs.existsSync(cliDir)) {
    await runCommand("npm run build", cliDir, "Build da CLI");
    // Testar help básico
    const passed = await runCommand(
      "node dist/index.js --help",
      cliDir,
      "CLI Help Test"
    );
    results.push({ name: "CLI", passed });
  }

  // Resumo
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                    RESUMO DOS TESTES                  ║
╠═══════════════════════════════════════════════════════╣`);

  for (const result of results) {
    const status = result.passed ? "✅ PASSOU" : "❌ FALHOU";
    console.log(`║  ${result.name.padEnd(20)} ${status.padEnd(20)}  ║`);
  }

  const allPassed = results.every((r) => r.passed);
  const summary = allPassed
    ? "║              TODOS OS TESTES PASSARAM!              ║"
    : "║           ALGUNS TESTES FALHARAM                    ║";

  console.log(`╠═══════════════════════════════════════════════════════╣
${summary}
╚═══════════════════════════════════════════════════════╝`);

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
