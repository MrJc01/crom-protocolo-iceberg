/**
 * Comandos de Votos para CLI do Iceberg
 */

import { Command } from "commander";
import chalk from "chalk";

export const voteCommand = new Command("vote").description(
  "Sistema de votação"
);

const DAEMON_URL = process.env.DAEMON_URL || "http://localhost:8420";

async function api(endpoint: string, method = "GET", body?: any) {
  const response = await fetch(`${DAEMON_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return response.json();
}

/**
 * iceberg vote up <cid>
 */
voteCommand
  .command("up <cid>")
  .description("Votar positivamente em um post")
  .action(async (cid) => {
    console.log(chalk.blue("👍 Votando positivamente..."));

    try {
      const result = await api(`/votes/${cid}`, "POST", { type: "up" });

      if (result.error) {
        console.log(chalk.red(`❌ ${result.error}`));
        return;
      }

      console.log(chalk.green("✅ Voto registrado!"));
      console.log(`   ${chalk.gray("Novo score:")} ${result.newScore}`);
    } catch (error: any) {
      console.log(chalk.red("❌ Erro ao votar."));
      console.log(chalk.gray(`   ${error.message}`));
    }
  });

/**
 * iceberg vote down <cid>
 */
voteCommand
  .command("down <cid>")
  .description("Votar negativamente em um post")
  .action(async (cid) => {
    console.log(chalk.blue("👎 Votando negativamente..."));

    try {
      const result = await api(`/votes/${cid}`, "POST", { type: "down" });

      if (result.error) {
        console.log(chalk.red(`❌ ${result.error}`));
        return;
      }

      console.log(chalk.green("✅ Voto registrado!"));
      console.log(`   ${chalk.gray("Novo score:")} ${result.newScore}`);
    } catch (error: any) {
      console.log(chalk.red("❌ Erro ao votar."));
      console.log(chalk.gray(`   ${error.message}`));
    }
  });

/**
 * iceberg vote report <cid>
 */
voteCommand
  .command("report <cid>")
  .description("Reportar um post como inadequado")
  .action(async (cid) => {
    console.log(chalk.blue("🚨 Reportando post..."));

    try {
      const result = await api(`/votes/${cid}`, "POST", { type: "report" });

      if (result.error) {
        console.log(chalk.red(`❌ ${result.error}`));
        return;
      }

      console.log(chalk.yellow("⚠️ Post reportado!"));
      console.log(chalk.gray("   O post será analisado pela comunidade."));
    } catch (error: any) {
      console.log(chalk.red("❌ Erro ao reportar."));
      console.log(chalk.gray(`   ${error.message}`));
    }
  });

/**
 * iceberg vote status <cid>
 */
voteCommand
  .command("status <cid>")
  .description("Ver status de votação de um post")
  .action(async (cid) => {
    console.log(chalk.blue(`📊 Buscando votos de ${cid.slice(0, 20)}...`));

    try {
      const result = await api(`/votes/${cid}`);

      if (result.error) {
        console.log(chalk.red(`❌ ${result.error}`));
        return;
      }

      console.log();
      console.log(chalk.white.bold("Status de Votação"));
      console.log(chalk.gray("─".repeat(30)));
      console.log(`${chalk.green("↑ Upvotes:")}   ${result.up}`);
      console.log(`${chalk.red("↓ Downvotes:")} ${result.down}`);
      console.log(`${chalk.yellow("🚨 Reports:")}  ${result.reports}`);
      console.log(chalk.gray("─".repeat(30)));
      
      const scoreColor = result.score > 0 ? chalk.green : result.score < 0 ? chalk.red : chalk.gray;
      console.log(`${chalk.white("Score:")}       ${scoreColor(result.score)}`);

      if (result.myVote) {
        console.log();
        console.log(chalk.gray(`Seu voto: ${result.myVote.type}`));
      }
    } catch (error: any) {
      console.log(chalk.red("❌ Erro ao buscar votos."));
      console.log(chalk.gray(`   ${error.message}`));
    }
  });
