/* eslint-disable */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const meteorPath = path.resolve(__dirname, '..', 'helloapp');
const serverFile = path.resolve(__dirname, '..', 'servers.js');
const servers = require(serverFile).default || require(serverFile);

export default {
  servers: servers,
  app: {
    name: 'myapp',
    path: meteorPath,
    servers: {
      mymeteor: {}
    },
    env: {
      ROOT_URL: 'http://' + servers.mymeteor.host + '.com',
      MONGO_URL: 'mongodb://mongodb:27017/meteor'
    },
    docker: {
      image: 'zodern/meteor'
    },
    deployCheckWaitTime: 300
  },
  mongo: {
    servers: {
      mymongo: {}
    }
  }
};