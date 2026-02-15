import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const privateKey = path.join(__dirname, 'id_rsa');

const msg = 'Please fill ./tests/server.example.js and rename it to servers.js';
throw new Error(msg);

export default {
  mymeteor: {
    host: '1.2.3.4',
    username: 'username',
    pem: privateKey
  },
  mymongo: {
    host: '1.2.3.4',
    username: 'username',
    pem: privateKey
  },
  myproxy: {
    host: '1.2.3.4',
    username: 'username',
    password: 'password'
  }
};