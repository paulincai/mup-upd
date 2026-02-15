#!/usr/bin/env node
import './node-version.js';
import './nodemiral.js';
import { dirname, join } from 'path';
import modules, { loadPlugins, locatePluginDir } from './load-plugins.js';
import chalk from 'chalk';
import checkUpdates from './updates.js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { filterArgv } from './utils.js';
import { hideBin } from 'yargs/helpers';
import MupAPI from './plugin-api.js';
import { registerHook } from './hooks.js';
import yargs from 'yargs/yargs';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkgPath = join(__dirname, '../package.json');

const unwantedArgvs = ['_', '$0', 'settings', 'config', 'verbose', 'show-hook-names', 'help', 'servers'];

const yargsInstance = yargs(hideBin(process.argv));

yargsInstance.help(false);

const preAPI = new MupAPI(process.cwd(), process.argv, yargsInstance.argv);
const config = preAPI.getConfig(false);
let pluginList = [];

await (async () => {
  if (config.plugins instanceof Array) {
    const appPath = config.app && config.app.path ? config.app.path : '';
    const absoluteAppPath = preAPI.resolvePath(preAPI.base, appPath);

    pluginList = config.plugins.map(plugin => ({
      name: plugin,
      path: locatePluginDir(plugin, preAPI.configPath, absoluteAppPath)
    }));

    await loadPlugins(pluginList);
  }
})();

if (config.hooks) {
  Object.keys(config.hooks).forEach(key => {
    registerHook(key, config.hooks[key]);
  });
}

function commandWrapper(pluginName, commandName) {
  return function() {
    checkUpdates([
      { name: pkg.name, path: pkgPath },
      ...pluginList
    ]);

    const rawArgv = process.argv.slice(2);
    const filteredArgv = filterArgv(rawArgv, yargsInstance.argv, unwantedArgvs);
    const api = new MupAPI(process.cwd(), filteredArgv, yargsInstance.argv);
    let potentialPromise;

    try {
      potentialPromise = api.runCommand(`${pluginName}.${commandName}`);
    } catch (e) {
      api._commandErrorHandler(e);
    }

    if (potentialPromise && typeof potentialPromise.then === 'function') {
      potentialPromise.catch(api._commandErrorHandler);
    }
  };
}

function addModuleCommands(builder, module, moduleName) {
  Object.keys(module.commands).forEach(commandName => {
    const command = module.commands[commandName];
    const name = command.name || commandName;

    command.builder = command.builder || {};
    builder.command(
      name,
      command.description.length === 0 ? false : command.description,
      command.builder,
      commandWrapper(moduleName, commandName)
    );
  });
}

let program = yargsInstance
  .usage(`\nUsage: ${chalk.yellow('mup')} <command> [args]`)
  .version(pkg.version)
  .alias('v', 'version')
  .global('version', false)
  .option('settings', {
    description: 'Path to Meteor settings file',
    requiresArg: true,
    string: true
  })
  .option('config', {
    description: 'Path to mup.js config file',
    requiresArg: true,
    string: true
  })
  .option('servers', {
    description: 'Comma separated list of servers to use',
    requiresArg: true,
    string: true
  })
  .option('verbose', {
    description: 'Print output from build and server scripts',
    boolean: true
  })
  .option('show-hook-names', {
    description: 'Prints names of the available hooks as the command runs',
    boolean: true
  })
  .strict(true)
  .scriptName('mup')
  .alias('h', 'help')
  .epilogue(
    'For more information, read the docs at http://meteor-up.com/docs.html'
  )
  .help('help');

Object.keys(modules).forEach(moduleName => {
  if (moduleName !== 'default' && modules[moduleName].commands) {
    yargsInstance.command(
      moduleName,
      modules[moduleName].description,
      subYargs => {
        addModuleCommands(subYargs, modules[moduleName], moduleName);
      },
      () => {
        yargsInstance.showHelp('log');
      }
    );
  } else if (moduleName === 'default') {
    addModuleCommands(yargsInstance, modules[moduleName], moduleName);
  }
});

program = program.argv;

if (program._.length === 0) {
  yargsInstance.showHelp();
}
