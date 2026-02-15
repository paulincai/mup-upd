import path from 'path';
import { fileURLToPath } from 'url';
import serversDefault from '../servers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const meteorPath = path.resolve(__dirname, '..', 'helloapp');
const servers = serversDefault;

export default {
  servers: servers,

  app: {
    name: 'myapp',
    path: '../helloapp',
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

  proxy: {
    domains: 'website.com',
    shared: {
      clientUploadLimit: '10M'
    }
  },

  mongo: {
    version: '3.4.1',
    servers: {
      mymongo: {}
    }
  }
};