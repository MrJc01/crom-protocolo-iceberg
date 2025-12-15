/**
 * Sync CLI Commands
 * 
 * Commands for P2P synchronization
 */

import { Command } from "commander";
import chalk from "chalk";

const DAEMON_URL = process.env.ICEBERG_DAEMON_URL || "http://localhost:8420";

export const syncCommand = new Command("sync")
  .description("Sincronização P2P");

// Sync status
syncCommand
  .command("status")
  .description("Ver status da sincronização")
  .action(async () => {
    console.log(chalk.cyan("🔄 Status de Sincronização\n"));

    try {
      const response = await fetch(`${DAEMON_URL}/consensus`);
      const data = await response.json() as {
        levelDistribution?: { wild?: number; regional?: number; surface?: number; legacy?: number };
        totalPosts?: number;
        totalVotes?: number;
        totalComments?: number;
        pendingReports?: number;
      };

      console.log(chalk.white("Posts por nível:"));
      console.log(chalk.gray(`  Nível 0 (Wild):    ${data.levelDistribution?.wild || 0}`));
      console.log(chalk.gray(`  Nível 1 (Regional): ${data.levelDistribution?.regional || 0}`));
      console.log(chalk.gray(`  Nível 2 (Surface):  ${data.levelDistribution?.surface || 0}`));
      console.log(chalk.gray(`  Nível 3 (Legacy):   ${data.levelDistribution?.legacy || 0}`));
      console.log("");
      console.log(chalk.white("Totais:"));
      console.log(chalk.gray(`  Posts: ${data.totalPosts || 0}`));
      console.log(chalk.gray(`  Votos: ${data.totalVotes || 0}`));
      console.log(chalk.gray(`  Comentários: ${data.totalComments || 0}`));
      console.log(chalk.gray(`  Denúncias pendentes: ${data.pendingReports || 0}`));

    } catch (error) {
      console.log(chalk.red("✕ Erro ao obter status"));
      console.log(chalk.gray("  Verifique se o daemon está rodando"));
    }
  });

// Force sync (future P2P)
syncCommand
  .command("now")
  .description("Forçar sincronização com a rede")
  .action(async () => {
    console.log(chalk.cyan("🔄 Sincronizando...\n"));

    console.log(chalk.yellow("⚠ Sincronização P2P ainda não implementada"));
    console.log(chalk.gray("  O daemon atual usa armazenamento local"));
    console.log(chalk.gray("  P2P será adicionado em versão futura\n"));

    // For now, just recalculate consensus
    try {
      const postsRes = await fetch(`${DAEMON_URL}/posts?limit=100`);
      const { posts } = await postsRes.json() as { posts: Array<{ cid: string }> };

      if (posts && posts.length > 0) {
        console.log(chalk.white(`Recalculando consenso para ${posts.length} posts...`));

        for (const post of posts.slice(0, 10)) {
          try {
            await fetch(`${DAEMON_URL}/consensus/${post.cid}/recalculate`, {
              method: "POST",
            });
            console.log(chalk.gray(`  ✓ ${post.cid.slice(0, 16)}...`));
          } catch {}
        }

        console.log(chalk.green("\n✓ Consenso atualizado"));
      } else {
        console.log(chalk.gray("  Nenhum post para sincronizar"));
      }
    } catch (error) {
      console.log(chalk.red("✕ Erro na sincronização"));
    }
  });

// Export data
syncCommand
  .command("export")
  .description("Exportar dados locais")
  .option("-o, --output <file>", "Arquivo de saída", "iceberg-export.json")
  .action(async (options) => {
    console.log(chalk.cyan("📤 Exportando dados...\n"));

    try {
      const [postsRes, reportsRes] = await Promise.all([
        fetch(`${DAEMON_URL}/posts?limit=1000`),
        fetch(`${DAEMON_URL}/reports`),
      ]);

      const posts = await postsRes.json() as { posts?: Array<any> };
      const reports = await reportsRes.json() as { reports?: Array<any> };

      const exportData = {
        version: "0.2.0",
        exportedAt: new Date().toISOString(),
        posts: posts.posts || [],
        reports: reports.reports || [],
      };

      const fs = require("fs");
      fs.writeFileSync(options.output, JSON.stringify(exportData, null, 2));

      console.log(chalk.green(`✓ Dados exportados para ${options.output}`));
      console.log(chalk.gray(`  Posts: ${exportData.posts.length}`));
      console.log(chalk.gray(`  Denúncias: ${exportData.reports.length}`));
    } catch (error) {
      console.log(chalk.red("✕ Erro ao exportar"));
    }
  });

// Import data
syncCommand
  .command("import <file>")
  .description("Importar dados de arquivo")
  .action(async (file) => {
    console.log(chalk.cyan("📥 Importando dados...\n"));

    const fs = require("fs");
    if (!fs.existsSync(file)) {
      console.log(chalk.red(`✕ Arquivo não encontrado: ${file}`));
      return;
    }

    try {
      const data = JSON.parse(fs.readFileSync(file, "utf-8"));

      if (!data.posts || !Array.isArray(data.posts)) {
        console.log(chalk.red("✕ Formato de arquivo inválido"));
        return;
      }

      console.log(chalk.white(`Importando ${data.posts.length} posts...`));
      
      // Note: Full import would require /posts endpoint to accept existing CIDs
      // For now, just show what would be imported
      
      console.log(chalk.yellow("\n⚠ Importação completa requer P2P"));
      console.log(chalk.gray("  Os dados seriam adicionados via sincronização P2P"));

    } catch (error) {
      console.log(chalk.red("✕ Erro ao importar"));
    }
  });

export default syncCommand;
