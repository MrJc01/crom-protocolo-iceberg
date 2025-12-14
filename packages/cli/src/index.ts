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
 */

import { Command } from "commander";
import { identityCommand } from "./commands/identity";
import { postsCommand } from "./commands/posts";
import { voteCommand } from "./commands/votes";

const program = new Command();

program
  .name("iceberg")
  .description(
    "CLI para o Protocolo Iceberg - Plataforma descentralizada de informação cidadã"
  )
  .version("0.1.0");

// Registrar comandos
program.addCommand(identityCommand);
program.addCommand(postsCommand);
program.addCommand(voteCommand);

// Parse argumentos
program.parse(process.argv);

// Se nenhum argumento, mostrar help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

