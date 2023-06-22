import { addLocation, combineErrorDetails, VALIDATE_OPTIONS } from './utils'
import Joi from 'joi'

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
    privateIp: Joi.string()
  })

export default function validateServers(servers) {
  let details = []
  const result = schema.validate(servers, VALIDATE_OPTIONS)
  details = combineErrorDetails(details, result)

  Object.keys(servers).forEach(key => {
    const server = servers[key]
    if (server.pem && server.pem.indexOf('.pub') === server.pem.length - 4) {
      details.push({
        message: 'Needs to be a path to a private key. The file extension ".pub" is used for public keys.',
        path: `${key}.pem`
      })
    }
  })

  return addLocation(details, 'servers')
}
