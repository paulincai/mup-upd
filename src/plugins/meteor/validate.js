import Joi from 'joi';

const schema = Joi.object().keys({
  name: Joi.string().min(1).required(),
  path: Joi.string().min(1).required(),
  port: Joi.number(),
  type: Joi.string(),
  servers: Joi.object().min(1).required().pattern(
    /[/s/S]*/,
    Joi.object().keys({
      env: Joi.object().pattern(
        /[/s/S]*/,
        [Joi.string(), Joi.number(), Joi.bool()]
      ),
      bind: Joi.string(),
      settings: Joi.string()
    })
  ),
  deployCheckWaitTime: Joi.number(),
  deployCheckPort: Joi.number(),
  enableUploadProgressBar: Joi.bool(),
  dockerImage: Joi.string(),
  docker: Joi.object().keys({
    image: Joi.string().trim(),
    imagePort: Joi.number(),
    imageFrontendServer: Joi.string(),
    args: Joi.array().items(Joi.string()),
    bind: Joi.string().trim(),
    prepareBundle: Joi.bool(),
    prepareBundleLocally: Joi.bool(),
    buildInstructions: Joi.array().items(Joi.string()),
    stopAppDuringPrepareBundle: Joi.bool(),
    useBuildKit: Joi.bool(),
    networks: Joi
      .array()
      .items(Joi.string())
  }),
  buildOptions: Joi.object().keys({
    serverOnly: Joi.bool(),
    debug: Joi.bool(),
    cleanAfterBuild: Joi.bool(),
    buildLocation: Joi.string(),
    mobileSettings: Joi.object(),
    server: Joi.string().uri(),
    allowIncompatibleUpdates: Joi.boolean(),
    executable: Joi.string(),
    cleanBuildLocation: Joi.bool()
  }),
  env: Joi
    .object()
    .keys({
      ROOT_URL: Joi
        .string()
        .regex(
          new RegExp('^(http|https)://', 'i'),
          'valid url with "http://" or "https://"'
        )
        .required(),
      MONGO_URL: Joi.string()
    })
    .pattern(/[\s\S]*/, [Joi.string(), Joi.number(), Joi.bool()]),
  log: Joi.object().keys({
    driver: Joi.string(),
    opts: Joi.object()
  }),
  volumes: Joi.object(),
  nginx: Joi.object().keys({
    clientUploadLimit: Joi.string().trim()
  }),
  ssl: Joi
    .object()
    .keys({
      autogenerate: Joi
        .object()
        .keys({
          email: Joi.string().email().required(),
          domains: Joi.string().required()
        }),
      crt: Joi.string().trim(),
      key: Joi.string().trim(),
      port: Joi.number(),
      upload: Joi.boolean()
    })
    .and('crt', 'key')
    .without('autogenerate', ['crt', 'key'])
    .or('crt', 'autogenerate')
});

export default function(
  config,
  {
    addDepreciation,
    combineErrorDetails,
    VALIDATE_OPTIONS,
    serversExist,
    addLocation
  }
) {
  let details = [];

  details = combineErrorDetails(
    details,
    schema.validate(config.app, VALIDATE_OPTIONS)
  );
  if (config.app.name && config.app.name.indexOf(' ') > -1) {
    details.push({
      message: 'has a space',
      path: 'name'
    });
  }
  if (
    typeof config.app.ssl === 'object' &&
    'autogenerate' in config.app.ssl &&
    'PORT' in config.app.env
  ) {
    details.push({
      message: 'PORT can not be set when using ssl.autogenerate',
      path: 'env'
    });
  }
  details = combineErrorDetails(
    details,
    serversExist(config.servers, config.app.servers)
  );

  // Depreciations
  if (config.app.ssl) {
    details = addDepreciation(
      details,
      'ssl',
      'Use the reverse proxy instead',
      'https://git.io/vN5tn'
    );
  }

  if (config.app.nginx) {
    details = addDepreciation(
      details,
      'nginx',
      'Use the reverse proxy instead',
      'https://git.io/vN5tn'
    );
  }

  if (config.app.docker && config.app.docker.imageFrontendServer) {
    details = addDepreciation(
      details,
      'docker.imageFrontendServer',
      'Use the reverse proxy instead',
      'https://git.io/vN5tn'
    );
  }

  return addLocation(details, config.meteor ? 'meteor' : 'app');
}
