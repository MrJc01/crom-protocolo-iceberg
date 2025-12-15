/**
 * Config CLI Commands
 * 
 * Manage CLI and daemon configuration
 */

import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".iceberg");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface IcebergConfig {
  daemonUrl: string;
  defaultRegion: string;
  theme: "dark" | "light";
  notifications: boolean;
  autoSync: boolean;
}

const DEFAULT_CONFIG: IcebergConfig = {
  daemonUrl: "http://localhost:8420",
  defaultRegion: "BR-SP-SAO_PAULO",
  theme: "dark",
  notifications: true,
  autoSync: false,
};

function loadConfig(): IcebergConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    return DEFAULT_CONFIG;
  }
  try {
    const data = fs.readFileSync(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

function saveConfig(config: IcebergConfig) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export const configCommand = new Command("config")
  .description("Gerenciar configurações");

// Show config
configCommand
  .command("show")
  .description("Mostrar configurações atuais")
  .action(() => {
    const config = loadConfig();

    console.log(chalk.cyan("⚙ Configurações\n"));
    console.log(chalk.white("  Daemon URL:     ") + chalk.gray(config.daemonUrl));
    console.log(chalk.white("  Região padrão:  ") + chalk.gray(config.defaultRegion));
    console.log(chalk.white("  Tema:           ") + chalk.gray(config.theme));
    console.log(chalk.white("  Notificações:   ") + chalk.gray(config.notifications ? "Sim" : "Não"));
    console.log(chalk.white("  Auto-sync:      ") + chalk.gray(config.autoSync ? "Sim" : "Não"));
    console.log(chalk.gray(`\n  Arquivo: ${CONFIG_FILE}`));
  });

// Set config value
configCommand
  .command("set <key> <value>")
  .description("Definir valor de configuração")
  .action((key, value) => {
    const config = loadConfig();

    const validKeys = ["daemonUrl", "defaultRegion", "theme", "notifications", "autoSync"];
    if (!validKeys.includes(key)) {
      console.log(chalk.red(`✕ Chave inválida: ${key}`));
      console.log(chalk.gray(`  Chaves válidas: ${validKeys.join(", ")}`));
      return;
    }

    // Type conversion
    let typedValue: any = value;
    if (key === "notifications" || key === "autoSync") {
      typedValue = value === "true" || value === "1";
    }

    (config as any)[key] = typedValue;
    saveConfig(config);

    console.log(chalk.green(`✓ ${key} = ${typedValue}`));
  });

// Get config value
configCommand
  .command("get <key>")
  .description("Obter valor de configuração")
  .action((key) => {
    const config = loadConfig();

    if (key in config) {
      console.log((config as any)[key]);
    } else {
      console.log(chalk.red(`✕ Chave não encontrada: ${key}`));
    }
  });

// Reset config
configCommand
  .command("reset")
  .description("Restaurar configurações padrão")
  .action(() => {
    saveConfig(DEFAULT_CONFIG);
    console.log(chalk.green("✓ Configurações restauradas"));
  });

// Show path
configCommand
  .command("path")
  .description("Mostrar caminho do diretório de dados")
  .action(() => {
    console.log(CONFIG_DIR);
  });

export default configCommand;
