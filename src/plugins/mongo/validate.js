import Joi from 'joi';

const schema = Joi.object().keys({
  // TODO: mongo.oplog and mongo.port is unused,
  // but was part of the example config.
  // decide what to do with it
  oplog: Joi.bool(),
  port: Joi.number(),
  dbName: Joi.string(),
  version: Joi.string(),
  servers: Joi.object().keys().required()
});

function externalMongoUrl(appConfig) {
  const result = [];

  if (!appConfig || !appConfig.env || !appConfig.env.MONGO_URL) {
    return result;
  }

  const mongoUrl = appConfig.env.MONGO_URL;

  // Detect IP Addresses and domain names
  const periodExists = mongoUrl.indexOf('.') > -1;
  // Detect username:password@domain.com
  const atExists = mongoUrl.indexOf('@') > -1;

  if ( periodExists || atExists ) {
    result.push({
      message: 'It looks like app.env.MONGO_URL is for an external database. Remove the `mongo` object to use external databases.',
      path: ''
    });
  }

  return result;
}

export default function(
  config,
  {
    combineErrorDetails,
    serversExist,
    addLocation,
    VALIDATE_OPTIONS
  }
) {
  const origionalConfig = config._origionalConfig;
  let details = [];

  const validationErrors = schema.validate(config.mongo, VALIDATE_OPTIONS);
  details = combineErrorDetails(details, validationErrors);
  details = combineErrorDetails(
    details,
    serversExist(config.servers, config.mongo.servers)
  );
  details = combineErrorDetails(
    details,
    externalMongoUrl(origionalConfig.app || origionalConfig.meteor)
  );

  return addLocation(details, 'mongo');
}
