/**
 * Comandos de Identidade para CLI do Iceberg
 *
 * Baseado na documentação: docs/11_INTEGRACAO_NODUS_CLI.md
 */

import { Command } from "commander";
import chalk from "chalk";
import * as nacl from "tweetnacl";
import * as bip39 from "bip39";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as readline from "readline";

// ============================================
// TIPOS E CONSTANTES
// ============================================

interface Identity {
  publicKey: string;
  secretKey: Uint8Array;
  createdAt: number;
}

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const PUBLIC_KEY_PREFIX = "ed25519:";

// Caminho padrão para armazenar identidade
const IDENTITY_DIR = path.join(os.homedir(), ".iceberg");
const IDENTITY_FILE = path.join(IDENTITY_DIR, "identity.json");

// ============================================
// FUNÇÕES DE CRIPTOGRAFIA (copiadas do SDK)
// ============================================

function encodeBase58(bytes: Uint8Array): string {
  let leadingZeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    leadingZeros++;
  }

  const hex = Buffer.from(bytes).toString("hex");
  let num = hex ? BigInt("0x" + hex) : BigInt(0);

  if (num === BigInt(0)) {
    return BASE58_ALPHABET[0].repeat(Math.max(1, leadingZeros));
  }

  let result = "";
  while (num > 0) {
    const remainder = Number(num % BigInt(58));
    result = BASE58_ALPHABET[remainder] + result;
    num = num / BigInt(58);
  }

  return BASE58_ALPHABET[0].repeat(leadingZeros) + result;
}

async function createIdentity(): Promise<{
  identity: Identity;
  mnemonic: string;
}> {
  const entropy = nacl.randomBytes(32);
  const mnemonic = bip39.entropyToMnemonic(Buffer.from(entropy));
  const seed = await bip39.mnemonicToSeed(mnemonic);
  const keypair = nacl.sign.keyPair.fromSeed(
    new Uint8Array(seed.slice(0, 32))
  );

  const publicKey = PUBLIC_KEY_PREFIX + encodeBase58(keypair.publicKey);

  const identity: Identity = {
    publicKey,
    secretKey: keypair.secretKey,
    createdAt: Date.now(),
  };

  return { identity, mnemonic };
}

async function importFromMnemonic(mnemonic: string): Promise<Identity> {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Mnemônico inválido. Verifique as palavras.");
  }

  const seed = await bip39.mnemonicToSeed(mnemonic);
  const keypair = nacl.sign.keyPair.fromSeed(
    new Uint8Array(seed.slice(0, 32))
  );

  const publicKey = PUBLIC_KEY_PREFIX + encodeBase58(keypair.publicKey);

  return {
    publicKey,
    secretKey: keypair.secretKey,
    createdAt: Date.now(),
  };
}

function importFromSecretKey(secretKeyHex: string): Identity {
  const hex = secretKeyHex.replace(/^0x/, "");
  const secretKey = new Uint8Array(hex.length / 2);
  for (let i = 0; i < secretKey.length; i++) {
    secretKey[i] = parseInt(hex.substr(i * 2, 2), 16);
  }

  const publicKeyBytes = secretKey.slice(32, 64);
  const publicKey = PUBLIC_KEY_PREFIX + encodeBase58(publicKeyBytes);

  return {
    publicKey,
    secretKey,
    createdAt: Date.now(),
  };
}

function exportSecretKey(identity: Identity): string {
  return (
    "0x" +
    Array.from(identity.secretKey)
      .map((b: number) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

function getShortId(publicKey: string): string {
  const key = publicKey.replace(PUBLIC_KEY_PREFIX, "");
  return key.slice(0, 8);
}

// ============================================
// UTILITÁRIOS
// ============================================

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadIdentity(): Identity | null {
  try {
    if (fs.existsSync(IDENTITY_FILE)) {
      const data = JSON.parse(fs.readFileSync(IDENTITY_FILE, "utf-8"));
      data.secretKey = new Uint8Array(Object.values(data.secretKey));
      return data as Identity;
    }
  } catch (error) {
    console.error(chalk.red("Erro ao carregar identidade:"), error);
  }
  return null;
}

function saveIdentity(identity: Identity): void {
  ensureDir(IDENTITY_DIR);
  const data = {
    ...identity,
    secretKey: Object.fromEntries(
      Array.from(identity.secretKey).map((v: number, i: number) => [i, v])
    ),
  };
  fs.writeFileSync(IDENTITY_FILE, JSON.stringify(data, null, 2));
}

async function askConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (s/n): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "s" || answer.toLowerCase() === "sim");
    });
  });
}

// ============================================
// COMANDOS
// ============================================

export const identityCommand = new Command("identity").description(
  "Gerenciamento de identidade criptográfica"
);

/**
 * iceberg identity create
 */
identityCommand
  .command("create")
  .description("Criar uma nova identidade criptográfica")
  .option("-f, --force", "Sobrescrever identidade existente")
  .action(async (options) => {
    const existing = loadIdentity();
    if (existing && !options.force) {
      console.log(chalk.yellow("⚠️  Você já possui uma identidade:"));
      console.log(`   ${chalk.cyan(existing.publicKey)}`);
      console.log(
        chalk.gray("   Use --force para criar uma nova (a atual será perdida)")
      );
      return;
    }

    if (existing && options.force) {
      const confirm = await askConfirmation(
        chalk.red("⚠️  Isso irá APAGAR sua identidade atual. Confirma?")
      );
      if (!confirm) {
        console.log(chalk.gray("Operação cancelada."));
        return;
      }
    }

    console.log(chalk.blue("🔐 Gerando nova identidade..."));

    const { identity, mnemonic } = await createIdentity();

    saveIdentity(identity);

    console.log();
    console.log(
      chalk.red.bold("⚠️  ATENÇÃO: GUARDE ESTAS PALAVRAS EM LOCAL SEGURO!")
    );
    console.log(
      chalk.red("   Esta é a ÚNICA forma de recuperar sua identidade.")
    );
    console.log();
    console.log(chalk.yellow("📝 Mnemônico (24 palavras):"));
    console.log();

    const words = mnemonic.split(" ");
    for (let i = 0; i < words.length; i += 4) {
      const row = words
        .slice(i, i + 4)
        .map(
          (w: string, j: number) =>
            chalk.green(`${(i + j + 1).toString().padStart(2)}. ${w}`)
        )
        .join("  ");
      console.log(`   ${row}`);
    }

    console.log();
    console.log(chalk.cyan("🔑 Sua chave pública:"));
    console.log(`   ${chalk.white.bold(identity.publicKey)}`);
    console.log();
    console.log(chalk.gray(`   Short ID: ${getShortId(identity.publicKey)}`));
    console.log(chalk.gray(`   Salvo em: ${IDENTITY_FILE}`));
  });

/**
 * iceberg identity show
 */
identityCommand
  .command("show")
  .description("Mostrar identidade atual")
  .action(() => {
    const identity = loadIdentity();

    if (!identity) {
      console.log(chalk.yellow("⚠️  Nenhuma identidade encontrada."));
      console.log(chalk.gray("   Use: iceberg identity create"));
      return;
    }

    console.log(chalk.cyan("🔑 Sua Identidade:"));
    console.log();
    console.log(`   ${chalk.gray("Chave pública:")} ${identity.publicKey}`);
    console.log(
      `   ${chalk.gray("Short ID:")}      ${getShortId(identity.publicKey)}`
    );
    console.log(
      `   ${chalk.gray("Criada em:")}     ${new Date(identity.createdAt).toLocaleString()}`
    );
    console.log(`   ${chalk.gray("Arquivo:")}       ${IDENTITY_FILE}`);
  });

/**
 * iceberg identity export
 */
identityCommand
  .command("export")
  .description("Exportar chave privada para backup")
  .option("-o, --output <file>", "Arquivo de saída")
  .option("--hex", "Exportar em formato hexadecimal")
  .action(async (options) => {
    const identity = loadIdentity();

    if (!identity) {
      console.log(chalk.yellow("⚠️  Nenhuma identidade encontrada."));
      console.log(chalk.gray("   Use: iceberg identity create"));
      return;
    }

    console.log(
      chalk.red.bold("⚠️  CUIDADO: A chave privada dá acesso total à sua conta!")
    );
    console.log();

    if (options.hex) {
      const hexKey = exportSecretKey(identity);
      if (options.output) {
        fs.writeFileSync(options.output, hexKey);
        console.log(chalk.green(`✅ Chave exportada para: ${options.output}`));
      } else {
        console.log(chalk.yellow("🔐 Chave privada (hex):"));
        console.log(`   ${hexKey}`);
      }
    } else {
      const output = options.output || "iceberg-backup.json";
      const data = {
        publicKey: identity.publicKey,
        secretKey: exportSecretKey(identity),
        createdAt: identity.createdAt,
        exportedAt: Date.now(),
      };
      fs.writeFileSync(output, JSON.stringify(data, null, 2));
      console.log(chalk.green(`✅ Backup exportado para: ${output}`));
    }
  });

/**
 * iceberg identity import
 */
identityCommand
  .command("import")
  .description("Importar identidade de backup")
  .option("-m, --mnemonic <words>", "Importar via mnemônico (24 palavras)")
  .option("-f, --file <path>", "Importar de arquivo JSON")
  .option("--force", "Sobrescrever identidade existente")
  .action(async (options) => {
    const existing = loadIdentity();
    if (existing && !options.force) {
      console.log(chalk.yellow("⚠️  Você já possui uma identidade."));
      console.log(chalk.gray("   Use --force para sobrescrever"));
      return;
    }

    if (options.mnemonic) {
      console.log(chalk.blue("🔐 Importando via mnemônico..."));
      try {
        const identity = await importFromMnemonic(options.mnemonic);
        saveIdentity(identity);
        console.log(chalk.green("✅ Identidade importada com sucesso!"));
        console.log(`   ${chalk.gray("Chave:")} ${identity.publicKey}`);
      } catch (error) {
        console.log(chalk.red("❌ Mnemônico inválido."));
        console.log(chalk.gray("   Verifique se são 24 palavras válidas."));
      }
    } else if (options.file) {
      console.log(chalk.blue(`🔐 Importando de ${options.file}...`));
      try {
        const data = JSON.parse(fs.readFileSync(options.file, "utf-8"));

        if (data.secretKey && typeof data.secretKey === "string") {
          const identity = importFromSecretKey(data.secretKey);
          saveIdentity(identity);
          console.log(chalk.green("✅ Identidade importada com sucesso!"));
          console.log(`   ${chalk.gray("Chave:")} ${identity.publicKey}`);
        } else {
          console.log(chalk.red("❌ Formato de arquivo não reconhecido."));
        }
      } catch (error) {
        console.log(chalk.red("❌ Erro ao ler arquivo."));
        console.log(chalk.gray(`   ${error}`));
      }
    } else {
      console.log(chalk.yellow("⚠️  Especifique --mnemonic ou --file"));
      console.log(
        chalk.gray(
          '   Exemplo: iceberg identity import --mnemonic "palavra1 palavra2 ..."'
        )
      );
    }
  });
