import { addLocation, combineErrorDetails, VALIDATE_OPTIONS } from './utils.js';
import Joi from 'joi';

// SSH algorithms schema for advanced configuration
const algorithmsSchema = Joi.object({
  kex: Joi.array().items(Joi.string()),
  cipher: Joi.object({
    encrypt: Joi.array().items(Joi.string()),
    decrypt: Joi.array().items(Joi.string())
  }),
  serverHostKey: Joi.array().items(Joi.string()),
  hmac: Joi.object({
    encrypt: Joi.array().items(Joi.string()),
    decrypt: Joi.array().items(Joi.string())
  }),
  compress: Joi.object({
    encrypt: Joi.array().items(Joi.string()),
    decrypt: Joi.array().items(Joi.string())
  })
});

// SSH options schema matching ssh2 API
const sshOptionsSchema = Joi.object({
  // Timeout for SSH handshake (milliseconds)
  readyTimeout: Joi.number().integer().min(1),
  // Keepalive interval (milliseconds)
  keepaliveInterval: Joi.number().integer().min(1),
  // Max unanswered keepalive packets before disconnect
  keepaliveCountMax: Joi.number().integer().min(1),
  // Advanced algorithm configuration
  algorithms: algorithmsSchema,
  // Force IPv4
  forceIPv4: Joi.boolean(),
  // Force IPv6
  forceIPv6: Joi.boolean(),
  // Strict vendor prefix checking
  strictVendor: Joi.boolean(),
  // Compress data before sending
  compress: Joi.boolean(),
  // Debug callback (string for log level or boolean)
  debug: Joi.boolean()
});

// The regexp used matches everything
const schema = Joi.object().pattern(
  /.*/,
  {
    host: Joi
      .alternatives(
        Joi.string().trim()
      )
      .required(),
    username: Joi.string().required(),
    pem: Joi.string().trim(),
    password: Joi.string(),
    opts: Joi.object().keys({
      port: Joi.number()
    }),
    // SSH connection options passed directly to ssh2
    sshOptions: sshOptionsSchema,
    privateIp: Joi.string()
  });

export default function validateServers(servers) {
  let details = [];
  const result = schema.validate(servers, VALIDATE_OPTIONS);
  details = combineErrorDetails(details, result);

  Object.keys(servers).forEach(key => {
    const server = servers[key];
    if (server.pem && server.pem.indexOf('.pub') === server.pem.length - 4) {
      details.push({
        message: 'Needs to be a path to a private key. The file extension ".pub" is used for public keys.',
        path: `${key}.pem`
      });
    }
  });

  return addLocation(details, 'servers');
}
