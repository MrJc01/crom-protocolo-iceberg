/**
 * Network CLI Commands
 * 
 * Commands for P2P network management
 */

import { Command } from "commander";
import chalk from "chalk";

const DAEMON_URL = process.env.ICEBERG_DAEMON_URL || "http://localhost:8420";

export const networkCommand = new Command("network")
  .description("Gerenciar rede P2P");

// Network status
networkCommand
  .command("status")
  .description("Ver status da rede P2P")
  .action(async () => {
    console.log(chalk.cyan("🌐 Status da Rede P2P\n"));

    try {
      const response = await fetch(`${DAEMON_URL}/network/status`);
      const data = await response.json() as {
        sync: { isOnline: boolean; lastSync: number | null; peersConnected: number; postsReceived: number; postsSent: number };
        node: { peerId: string; peerCount: number };
        ipfs: { objectCount: number; totalSize: number; usagePercent: number };
      };

      // Sync status
      console.log(chalk.white("Sincronização:"));
      console.log(chalk.gray(`  Online: ${data.sync?.isOnline ? chalk.green("Sim") : chalk.red("Não")}`));
      console.log(chalk.gray(`  Última sync: ${data.sync?.lastSync ? new Date(data.sync.lastSync).toLocaleString() : "Nunca"}`));
      console.log(chalk.gray(`  Peers conectados: ${data.sync?.peersConnected || 0}`));
      console.log(chalk.gray(`  Posts recebidos: ${data.sync?.postsReceived || 0}`));
      console.log(chalk.gray(`  Posts enviados: ${data.sync?.postsSent || 0}`));
      console.log("");

      // Node status
      console.log(chalk.white("Nó Local:"));
      console.log(chalk.gray(`  Peer ID: ${data.node?.peerId?.slice(0, 20) || "N/A"}...`));
      console.log(chalk.gray(`  Peers: ${data.node?.peerCount || 0}`));
      console.log("");

      // IPFS status
      console.log(chalk.white("IPFS Storage:"));
      console.log(chalk.gray(`  Objetos: ${data.ipfs?.objectCount || 0}`));
      console.log(chalk.gray(`  Tamanho: ${formatBytes(data.ipfs?.totalSize || 0)}`));
      console.log(chalk.gray(`  Uso: ${data.ipfs?.usagePercent || 0}%`));

    } catch (error) {
      console.log(chalk.red("✕ Erro ao obter status"));
      console.log(chalk.gray("  Verifique se o daemon está rodando"));
    }
  });

// Start network
networkCommand
  .command("start")
  .description("Iniciar conexão P2P")
  .action(async () => {
    console.log(chalk.cyan("🌐 Iniciando rede P2P...\n"));

    try {
      const response = await fetch(`${DAEMON_URL}/network/start`, {
        method: "POST",
      });
      const data = await response.json() as { success: boolean; message: string };

      if (data.success) {
        console.log(chalk.green("✓ Rede P2P iniciada"));
        console.log(chalk.gray(`  ${data.message}`));
      } else {
        console.log(chalk.red("✕ Falha ao iniciar"));
      }
    } catch (error) {
      console.log(chalk.red("✕ Erro ao iniciar rede"));
    }
  });

// Stop network
networkCommand
  .command("stop")
  .description("Parar conexão P2P")
  .action(async () => {
    console.log(chalk.cyan("🌐 Parando rede P2P...\n"));

    try {
      const response = await fetch(`${DAEMON_URL}/network/stop`, {
        method: "POST",
      });
      const data = await response.json() as { success: boolean };

      if (data.success) {
        console.log(chalk.green("✓ Rede P2P parada"));
      } else {
        console.log(chalk.red("✕ Falha ao parar"));
      }
    } catch (error) {
      console.log(chalk.red("✕ Erro ao parar rede"));
    }
  });

// List peers
networkCommand
  .command("peers")
  .description("Listar peers conectados")
  .action(async () => {
    console.log(chalk.cyan("👥 Peers Conectados\n"));

    try {
      const response = await fetch(`${DAEMON_URL}/network/peers`);
      const data = await response.json() as { count: number; peers: Array<{ id: string; lastSeen: number; reputation: number }> };

      if (data.count === 0) {
        console.log(chalk.gray("  Nenhum peer conectado"));
        return;
      }

      console.log(chalk.white(`Total: ${data.count}\n`));

      for (const peer of data.peers) {
        const ago = Math.floor((Date.now() - peer.lastSeen) / 1000);
        console.log(chalk.gray(`  ${peer.id}`));
        console.log(chalk.gray(`    Última atividade: ${ago}s atrás`));
        console.log(chalk.gray(`    Reputação: ${peer.reputation.toFixed(2)}`));
      }
    } catch (error) {
      console.log(chalk.red("✕ Erro ao listar peers"));
    }
  });

// Dial peer
networkCommand
  .command("dial <multiaddr>")
  .description("Conectar a um peer")
  .action(async (multiaddr: string) => {
    console.log(chalk.cyan(`🔗 Conectando a ${multiaddr}...\n`));

    try {
      const response = await fetch(`${DAEMON_URL}/network/dial`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ multiaddr }),
      });
      const data = await response.json() as { success: boolean; peer?: { id: string } };

      if (data.success) {
        console.log(chalk.green("✓ Conectado"));
        console.log(chalk.gray(`  Peer ID: ${data.peer?.id}`));
      } else {
        console.log(chalk.red("✕ Falha na conexão"));
      }
    } catch (error) {
      console.log(chalk.red("✕ Erro na conexão"));
    }
  });

// IPFS stats
networkCommand
  .command("ipfs")
  .description("Ver estatísticas IPFS")
  .action(async () => {
    console.log(chalk.cyan("📦 IPFS Storage\n"));

    try {
      const response = await fetch(`${DAEMON_URL}/network/ipfs/stats`);
      const data = await response.json() as {
        objectCount: number;
        pinnedCount: number;
        totalSize: number;
        maxSize: number;
        usagePercent: number;
      };

      console.log(chalk.white("Estatísticas:"));
      console.log(chalk.gray(`  Objetos: ${data.objectCount}`));
      console.log(chalk.gray(`  Pinados: ${data.pinnedCount}`));
      console.log(chalk.gray(`  Tamanho: ${formatBytes(data.totalSize)}`));
      console.log(chalk.gray(`  Máximo: ${formatBytes(data.maxSize)}`));
      console.log(chalk.gray(`  Uso: ${data.usagePercent}%`));
    } catch (error) {
      console.log(chalk.red("✕ Erro ao obter estatísticas"));
    }
  });

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default networkCommand;
