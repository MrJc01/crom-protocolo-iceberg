/**
 * Comandos de Posts para CLI do Iceberg
 */

import { Command } from "commander";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export const postsCommand = new Command("posts").description(
  "Gerenciamento de posts/denúncias"
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
 * iceberg posts list
 */
postsCommand
  .command("list")
  .description("Listar posts")
  .option("-r, --region <region>", "Filtrar por região")
  .option("-l, --level <level>", "Filtrar por nível mínimo", parseInt)
  .option("-n, --limit <limit>", "Número máximo de resultados", parseInt)
  .action(async (options) => {
    console.log(chalk.blue("📰 Buscando posts..."));

    try {
      const params = new URLSearchParams();
      if (options.region) params.append("region", options.region);
      if (options.level !== undefined) params.append("level", options.level.toString());
      if (options.limit) params.append("limit", options.limit.toString());

      const result = await api(`/posts?${params}`);

      if (!result.posts || result.posts.length === 0) {
        console.log(chalk.yellow("Nenhum post encontrado."));
        return;
      }

      console.log(chalk.gray(`\nTotal: ${result.total} posts`));
      console.log();

      const levelLabels = ["Wild", "Regional", "Surface", "Legacy"];
      const levelColors = [chalk.gray, chalk.blue, chalk.green, chalk.yellow];

      for (const post of result.posts) {
        const levelColor = levelColors[post.level] || chalk.white;
        const score = post.votes?.score ?? 0;
        const scoreColor = score > 0 ? chalk.green : score < 0 ? chalk.red : chalk.gray;

        console.log(
          `${scoreColor(`[${score > 0 ? "+" : ""}${score}]`)} ` +
          `${levelColor(`[${levelLabels[post.level]}]`)} ` +
          chalk.white.bold(post.title)
        );
        console.log(
          `   ${chalk.gray("CID:")} ${post.cid.slice(0, 20)}... ` +
          `${chalk.gray("Região:")} ${post.region} ` +
          `${chalk.gray("Autor:")} ${post.author.slice(8, 16)}...`
        );
        console.log();
      }
    } catch (error: any) {
      console.log(chalk.red("❌ Erro ao buscar posts."));
      console.log(chalk.gray(`   ${error.message}`));
    }
  });

/**
 * iceberg posts get <cid>
 */
postsCommand
  .command("get <cid>")
  .description("Obter detalhes de um post")
  .action(async (cid) => {
    console.log(chalk.blue(`🔍 Buscando post ${cid.slice(0, 20)}...`));

    try {
      const post = await api(`/posts/${cid}`);

      if (post.error) {
        console.log(chalk.red(`❌ ${post.error}`));
        return;
      }

      const levelLabels = ["Wild", "Regional", "Surface", "Legacy"];

      console.log();
      console.log(chalk.white.bold(post.title));
      console.log(chalk.gray("─".repeat(50)));
      console.log(post.body);
      console.log(chalk.gray("─".repeat(50)));
      console.log(`${chalk.gray("CID:")}      ${post.cid}`);
      console.log(`${chalk.gray("Nível:")}    ${levelLabels[post.level]} (${post.level})`);
      console.log(`${chalk.gray("Região:")}   ${post.region}`);
      console.log(`${chalk.gray("Autor:")}    ${post.author}`);
      console.log(`${chalk.gray("Score:")}    ${post.votes?.score ?? 0} (↑${post.votes?.up ?? 0} ↓${post.votes?.down ?? 0})`);
      console.log(`${chalk.gray("Criado:")}   ${new Date(post.createdAt).toLocaleString()}`);
    } catch (error: any) {
      console.log(chalk.red("❌ Erro ao buscar post."));
      console.log(chalk.gray(`   ${error.message}`));
    }
  });

/**
 * iceberg posts create
 */
postsCommand
  .command("create")
  .description("Criar novo post")
  .requiredOption("-t, --title <title>", "Título do post")
  .requiredOption("-b, --body <body>", "Conteúdo do post")
  .requiredOption("-r, --region <region>", "Região (ex: BR-SP-SAO_PAULO)")
  .option("-c, --category <category>", "Categoria")
  .action(async (options) => {
    console.log(chalk.blue("✏️ Criando post..."));

    try {
      const result = await api("/posts", "POST", {
        title: options.title,
        body: options.body,
        region: options.region,
        category: options.category,
      });

      if (result.error) {
        console.log(chalk.red(`❌ ${result.error}`));
        return;
      }

      console.log(chalk.green("✅ Post criado com sucesso!"));
      console.log(`   ${chalk.gray("CID:")} ${result.cid}`);
      console.log(`   ${chalk.gray("Nível:")} ${result.level}`);
    } catch (error: any) {
      console.log(chalk.red("❌ Erro ao criar post."));
      console.log(chalk.gray(`   ${error.message}`));
    }
  });

/**
 * iceberg posts delete <cid>
 */
postsCommand
  .command("delete <cid>")
  .description("Deletar um post (apenas autor)")
  .action(async (cid) => {
    console.log(chalk.blue(`🗑️ Deletando post ${cid.slice(0, 20)}...`));

    try {
      const result = await api(`/posts/${cid}`, "DELETE");

      if (result.error) {
        console.log(chalk.red(`❌ ${result.error}`));
        return;
      }

      console.log(chalk.green("✅ Post deletado com sucesso!"));
    } catch (error: any) {
      console.log(chalk.red("❌ Erro ao deletar post."));
      console.log(chalk.gray(`   ${error.message}`));
    }
  });
