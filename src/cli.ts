#!/usr/bin/env node

import chalk from 'chalk';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { handleConfig } from './commands/config.js';
import { handleCommit, handleWorkflow } from './commands/workflow.js';

// Display ASCII art banner
console.log(
  chalk.blue(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                           🔮 COMMIT WIZARD 🔮                              ║
║                    AI-Powered Commit Automation                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
`)
);

// Define the CLI
yargs(hideBin(process.argv))
  .scriptName('ai-git-wizard')
  .usage('$0 <cmd> [args]')
  .version()
  .command({
    command: 'workflow',
    aliases: ['w'],
    describe:
      'Run the complete AI git workflow (generate commits, create branch, make PR)',
    builder: (yargs) => {
      return yargs
        .option('branch', {
          alias: 'b',
          type: 'string',
          describe: 'Branch name (will auto-generate if not provided)',
        })
        .option('base-branch', {
          alias: 'bb',
          type: 'string',
          describe: 'Base branch for PR (default: main)',
          default: 'main',
        })
        .option('no-pr', {
          type: 'boolean',
          describe: 'Skip PR creation',
          default: false,
        });
    },
    handler: (argv) => {
      const options = {
        branch: argv.branch as string | undefined,
        baseBranch: argv['base-branch'] as string,
        noPr: argv['no-pr'] as boolean,
      };
      handleWorkflow(options);
    },
  })
  .command({
    command: 'commit',
    aliases: ['c'],
    describe: 'Generate AI commit messages and commit staged files',
    builder: (yargs) => {
      return yargs.option('push', {
        alias: 'p',
        type: 'boolean',
        describe: 'Push commits to remote after committing',
        default: false,
      });
    },
    handler: (argv) => {
      const options = {
        push: argv.push as boolean,
      };
      handleCommit(options);
    },
  })
  .command({
    command: 'config <action>',
    describe: 'Manage configuration',
    builder: (yargs) => {
      return yargs
        .positional('action', {
          describe: 'Configuration action to perform',
          choices: ['list', 'set', 'get', 'setup'],
          default: 'list',
        })
        .option('key', {
          alias: 'k',
          type: 'string',
          describe: 'Configuration key',
        })
        .option('value', {
          alias: 'v',
          type: 'string',
          describe: 'Configuration value',
        });
    },
    handler: (argv) => {
      handleConfig(argv.action as string, {
        key: argv.key as string | undefined,
        value: argv.value as string | undefined,
      });
    },
  })
  .example('$0 config setup', 'Interactive setup wizard')
  .example('$0 commit', 'Generate commit messages for staged files')
  .example('$0 commit --push', 'Generate commit messages and push to remote')
  .example('$0 workflow', 'Run the complete workflow')
  .example('$0 workflow -b feature/new-feature', 'Specify branch name')
  .demandCommand(1, 'You need to specify a command')
  .help()
  .wrap(null)
  .parse();
