#!/usr/bin/env node

/**
 * @iceberg/cli - CLI para o Protocolo Iceberg
 *
 * Comandos disponíveis:
 *   iceberg identity create  - Criar nova identidade
 *   iceberg identity show    - Mostrar identidade atual
 *   iceberg posts list       - Listar posts
 *   iceberg posts create     - Criar post
 *   iceberg vote up/down     - Votar em post
 *   iceberg daemon start     - Iniciar daemon
 *   iceberg daemon status    - Status do daemon
 *   iceberg sync status      - Status de sincronização
 *   iceberg config show      - Mostrar configurações
 *   iceberg network status   - Status da rede P2P
 */

import { Command } from "commander";
import { identityCommand } from "./commands/identity";
import { postsCommand } from "./commands/posts";
import { voteCommand } from "./commands/votes";
import { daemonCommand } from "./commands/daemon";
import { syncCommand } from "./commands/sync";
import { configCommand } from "./commands/config";
import { networkCommand } from "./commands/network";

const program = new Command();

program
  .name("iceberg")
  .description(
    "CLI para o Protocolo Iceberg - Plataforma descentralizada de informação cidadã"
  )
  .version("0.3.0");

// Registrar comandos
program.addCommand(identityCommand);
program.addCommand(postsCommand);
program.addCommand(voteCommand);
program.addCommand(daemonCommand);
program.addCommand(syncCommand);
program.addCommand(configCommand);
program.addCommand(networkCommand);

// Parse argumentos
program.parse(process.argv);

// Se nenhum argumento, mostrar help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

