import * as utils from './utils';
const { combineErrorDetails, VALIDATE_OPTIONS, improveErrors } = utils;
import chalk from 'chalk';
import Joi from 'joi';
import validateServer from './servers';

export const _pluginValidators = {};

export function addPluginValidator(rootPath, handler) {
  _pluginValidators[rootPath] = _pluginValidators[rootPath] || [];
  _pluginValidators[rootPath].push(handler);
}

function generateSchema() {
  const topLevelKeys = {
    servers: Joi.object(),
    app: Joi.object(),
    plugins: Joi.array(),
    _origionalConfig: Joi.object(),
    hooks: Joi.object().pattern(/.*/, Joi.alternatives(Joi.object({
      localCommand: Joi.string(),
      remoteCommand: Joi.string(),
      method: Joi.func()
    }),
    Joi.func()
    ))
  };

  Object.keys(_pluginValidators).forEach(key => {
    topLevelKeys[key] = Joi.any();
  });

  return Joi.object().keys(topLevelKeys);
}

function validateAll(_config, origionalConfig) {
  let details = [];
  let results;
  // TODO: the config object created by the plugin api
  // should always have this property.
  const config = { ..._config, _origionalConfig: origionalConfig };

  results = generateSchema().validate(config, VALIDATE_OPTIONS);
  details = combineErrorDetails(details, results);

  if (config.servers) {
    results = validateServer(config.servers);
    details = combineErrorDetails(details, results);
  }

  for (const [property, validators] of Object.entries(_pluginValidators)) {
    if (config[property] !== undefined) {
      // eslint-disable-next-line no-loop-func
      validators.forEach(validator => {
        results = validator(config, utils);
        details = combineErrorDetails(details, results);
      });
    }
  }

  return details.map(improveErrors);
}

export default function validate(config, origionalConfig) {
  const errors = [];
  const depreciations = [];

  validateAll(config, origionalConfig).forEach(problem => {
    if (problem.type === 'depreciation') {
      depreciations.push(problem);
    } else {
      errors.push(problem);
    }
  });

  return {
    errors: errors.map(error => error.message),
    depreciations: depreciations.map(depreciation => depreciation.message)
  };
}

export function showErrors(errors) {
  const lines = [];
  const plural = errors.length > 1 ? 's' : '';

  lines.push(`${errors.length} Validation Error${plural}`);

  errors.forEach(error => {
    lines.push(`  - ${error}`);
  });

  lines.push('');

  console.log(chalk.red(lines.join('\n')));
}

export function showDepreciations(depreciations) {
  const lines = [];
  const plural = depreciations.length > 1 ? 's' : '';

  lines.push(`${depreciations.length} Depreciation${plural}`);

  depreciations.forEach(depreciation => {
    lines.push(`  - ${depreciation}`);
  });

  lines.push('');

  console.log(chalk.yellow(lines.join('\n')));
}
