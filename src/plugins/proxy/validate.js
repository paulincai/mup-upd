import Joi from 'joi';

const schema = Joi.object({
  ssl: Joi
    .object()
    .keys({
      letsEncryptEmail: Joi.string().trim(),
      crt: Joi.string().trim(),
      key: Joi.string().trim(),
      forceSSL: Joi.bool()
    })
    .and('crt', 'key')
    .without('letsEncryptEmail', ['crt', 'key'])
    .or('letsEncryptEmail', 'crt', 'forceSSL'),
  domains: Joi.string().required(),
  nginxServerConfig: Joi.string(),
  nginxLocationConfig: Joi.string(),
  clientUploadLimit: Joi.string(),
  servers: Joi.object(),
  loadBalancing: Joi.bool(),
  stickySessions: Joi.bool(),
  shared: Joi.object().keys({
    clientUploadLimit: Joi.alternatives().try(Joi.number(), Joi.string()),
    httpPort: Joi.number(),
    httpsPort: Joi.number(),
    nginxConfig: Joi.string(),
    nginxTemplate: Joi.string(),
    templatePath: Joi.string(),
    env: Joi
      .object()
      .pattern(/[\s\S]*/, [Joi.string(), Joi.number(), Joi.boolean()]),
    envLetsEncrypt: Joi
      .object()
      .keys({
        ACME_CA_URI: Joi.string().regex(new RegExp('^(http|https)://', 'i')),
        DEBUG: Joi.boolean(),
        NGINX_PROXY_CONTAINER: Joi.string()
      })
      .pattern(/[\s\S]*/, [Joi.string(), Joi.number(), Joi.boolean()])
  })
});

export default function(config, {
  addDepreciation,
  combineErrorDetails,
  VALIDATE_OPTIONS,
  addLocation
}) {
  let details = [];

  details = combineErrorDetails(
    details,
    schema.validate(config.proxy, VALIDATE_OPTIONS)
  );
  if (
    config.app &&
    config.app.env &&
    config.app.env.PORT &&
    config.app.env.PORT !== 80 &&
    !config.proxy.loadBalancing
  ) {
    details.push({
      message: 'app.env.PORT is ignored when using the reverse proxy',
      path: ''
    });
  }

  if (config.proxy.shared && config.proxy.shared.clientUploadLimit) {
    details = addDepreciation(
      details,
      'shared.clientUploadLimit',
      'Use proxy.clientUploadLimit instead',
      'https://git.io/vN5tn'
    );
  }

  if (config.swarm && config.swarm.enabled && !config.proxy.servers) {
    details.push({
      message: 'is required when using Docker Swarm',
      path: 'servers'
    });
  }

  return addLocation(details, 'proxy');
}
