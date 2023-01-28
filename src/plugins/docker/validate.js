import Joi from 'joi';

const swarmSchema = Joi.object().keys({
  enabled: Joi.bool().required(),
  labels: Joi.array().items(Joi.object().keys({
    name: Joi.string().required(),
    value: Joi.string().required(),
    servers: Joi.array().items(Joi.string())
  }))
});

const registrySchema = Joi.object().keys({
  host: Joi.string().required(),
  imagePrefix: Joi.string(),
  username: Joi.string(),
  password: Joi.string()
});

export function validateSwarm(
  config,
  {
    addLocation,
    VALIDATE_OPTIONS,
    combineErrorDetails
  }
) {
  let details = [];

  details = combineErrorDetails(
    details,
    Joi.validate(config.swarm, swarmSchema, VALIDATE_OPTIONS)
  );

  return addLocation(details, 'swarm');
}

export function validateRegistry(
  config,
  {
    addLocation,
    VALIDATE_OPTIONS,
    combineErrorDetails
  }
) {
  let details = [];
  details = combineErrorDetails(
    details,
    Joi.validate(config.privateDockerRegistry, registrySchema, VALIDATE_OPTIONS)
  );

  return addLocation(details, 'dockerPrivateRegistry');
}
