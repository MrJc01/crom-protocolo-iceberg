/**
 * Daemon CLI Commands
 * 
 * Commands to start, stop, and manage the daemon
 */

import { Command } from "commander";
import chalk from "chalk";
import { spawn, ChildProcess } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".iceberg");
const PID_FILE = path.join(CONFIG_DIR, "daemon.pid");
const DAEMON_URL = process.env.ICEBERG_DAEMON_URL || "http://localhost:8420";

export const daemonCommand = new Command("daemon")
  .description("Gerenciar o daemon do Iceberg");

// Start daemon
daemonCommand
  .command("start")
  .description("Iniciar o daemon")
  .option("-p, --port <port>", "Porta do daemon", "8420")
  .option("-d, --detach", "Executar em background")
  .action(async (options) => {
    console.log(chalk.cyan("🧊 Iniciando Iceberg Daemon..."));

    // Check if already running
    if (await isDaemonRunning()) {
      console.log(chalk.yellow("⚠ Daemon já está rodando"));
      return;
    }

    // Ensure config directory exists
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }

    if (options.detach) {
      // Start in background
      const daemonPath = path.resolve(__dirname, "../../daemon/dist/index.js");
      const child = spawn("node", [daemonPath], {
        detached: true,
        stdio: "ignore",
        env: { ...process.env, PORT: options.port },
      });

      child.unref();

      // Save PID
      fs.writeFileSync(PID_FILE, String(child.pid));

      console.log(chalk.green(`✓ Daemon iniciado em background (PID: ${child.pid})`));
      console.log(chalk.gray(`  URL: http://localhost:${options.port}`));
    } else {
      // Run in foreground
      console.log(chalk.gray("  Pressione Ctrl+C para parar\n"));

      try {
        const response = await fetch(`${DAEMON_URL}/health`);
        if (response.ok) {
          console.log(chalk.green("✓ Daemon já está rodando"));
        }
      } catch {
        console.log(chalk.yellow("⚠ Daemon não está acessível"));
        console.log(chalk.gray("  Execute: cd packages/daemon && npm run dev"));
      }
    }
  });

// Stop daemon
daemonCommand
  .command("stop")
  .description("Parar o daemon")
  .action(async () => {
    if (fs.existsSync(PID_FILE)) {
      const pid = parseInt(fs.readFileSync(PID_FILE, "utf-8"));

      try {
        process.kill(pid, "SIGTERM");
        fs.unlinkSync(PID_FILE);
        console.log(chalk.green(`✓ Daemon parado (PID: ${pid})`));
      } catch (e) {
        fs.unlinkSync(PID_FILE);
        console.log(chalk.yellow("⚠ Daemon não estava rodando"));
      }
    } else {
      console.log(chalk.yellow("⚠ PID file não encontrado"));
    }
  });

// Status
daemonCommand
  .command("status")
  .description("Verificar status do daemon")
  .action(async () => {
    console.log(chalk.cyan("🧊 Verificando status...\n"));

    try {
      const response = await fetch(`${DAEMON_URL}/health`);
      const data = await response.json();

      if (response.ok) {
        console.log(chalk.green("✓ Daemon online"));
        console.log(chalk.gray(`  Versão: ${data.version || "unknown"}`));
        console.log(chalk.gray(`  URL: ${DAEMON_URL}`));

        // Get metrics
        try {
          const metricsRes = await fetch(`${DAEMON_URL}/metrics/json`);
          const metrics = await metricsRes.json();
          console.log(chalk.gray(`  Uptime: ${metrics.uptime}s`));
          console.log(chalk.gray(`  Requests: ${metrics.requests?.total || 0}`));
          console.log(chalk.gray(`  Posts: ${metrics.storage?.totalPosts || 0}`));
        } catch {}
      } else {
        console.log(chalk.red("✕ Daemon com problemas"));
      }
    } catch {
      console.log(chalk.red("✕ Daemon offline"));
      console.log(chalk.gray(`  URL: ${DAEMON_URL}`));
      console.log(chalk.gray("\n  Inicie com: iceberg daemon start"));
    }
  });

// Logs
daemonCommand
  .command("logs")
  .description("Ver logs do daemon")
  .option("-n, --lines <n>", "Número de linhas", "50")
  .action((options) => {
    const logFile = path.join(CONFIG_DIR, "daemon.log");

    if (!fs.existsSync(logFile)) {
      console.log(chalk.yellow("⚠ Arquivo de log não encontrado"));
      console.log(chalk.gray("  Os logs aparecem no terminal em modo dev"));
      return;
    }

    const content = fs.readFileSync(logFile, "utf-8");
    const lines = content.split("\n").slice(-parseInt(options.lines));
    console.log(lines.join("\n"));
  });

async function isDaemonRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${DAEMON_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export default daemonCommand;
