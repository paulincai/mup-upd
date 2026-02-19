import * as utils from '../utils.js';
import assert from 'assert';
import { expect } from 'chai';
import nodemiral from '@zodern/nodemiral';
import path from 'path';

describe('utils', () => {
  describe('addStdioHandlers', () => {
    it('should add stdio handlers to nodemiral task list', () => {
      const list = nodemiral.taskList('Test');
      list.executeScript('testing', {});
      // Test that it doesn't throw an error
      utils.addStdioHandlers(list);
    });
  });

  describe('runTaskList', () => {
    it('should resolve when list is sucessfull', cb => {
      const list = {
        run(sessions, opts, runCb) {
          runCb({});
        }
      };
      utils.runTaskList(list, {}, {}).then(() => {
        cb();
      });
    });

    it('should add stdio handlers for verbose', cb => {
      const list = {
        _taskQueue: [],
        run(sessions, opts, runCb) {
          expect(opts.verbose).to.equal(undefined);
          runCb({});
        }
      };

      utils.runTaskList(list, {}, { verbose: true })
        .then(() => { cb(); });
    });

    it('should reject if a task failed', cb => {
      const list = {
        run(sessions, opts, runCb) {
          runCb({
            copy: {
              error: 'error'
            }
          });
        }
      };

      utils.runTaskList(list, {}, {}).catch(() => {
        cb();
      });
    });
  });

  describe('countOccurrences', () => {
    it('should return the correct count', () => {
      const needle = 'Meteor';
      const haystack = 'Production Quality Meteor Deployments. Meteor Up is a command line tool that allows you to deploy any Meteor app to your own server.';
      const count = utils.countOccurrences(needle, haystack);
      assert(count === 3);
    });
  });

  describe('resolvePath', () => {
    it('should return the correct path', () => {
      const result = utils.resolvePath('/root', '../opt');
      const expected = path.resolve('/root', '../opt');
      assert(result === expected);
    });
    it('should expand tilde', () => {
      const result = utils.resolvePath('~/.ssh');
      assert(result.indexOf('~') === -1);
    });
  });

  describe('createOption', () => {
    it('should handle long options', () => {
      const result = utils.createOption('option');

      assert(result === '--option');
    });
    it('should handle short options', () => {
      const result = utils.createOption('o');

      assert(result === '-o');
    });
  });

  describe('argvContains', () => {
    it('should find exact matches', () => {
      const result = utils.argvContains(['a', 'b'], 'a');

      assert(result);
    });
    it('should find matches that contain the value', () => {
      const result = utils.argvContains(['a', 'b=c'], 'b');

      assert(result);
    });
    it('should return false if not found', () => {
      const result = utils.argvContains(['a', 'b'], 'c');

      assert(!result);
    });
  });

  describe('filterArgv', () => {
    it('should remove unwanted options', () => {
      const argv = { _: ['logs'], config: './mup.js', tail: true };
      const argvArray = ['mup', 'logs', '--config=./mup.js', '--tail'];
      const unwanted = ['_', 'config'];
      const result = utils.filterArgv(argvArray, argv, unwanted);

      expect(result).to.deep.equal(['logs', '--tail']);
    });
    it('should remove undefined and false options', () => {
      const argv = { _: ['logs'], config: undefined, verbose: true, follow: false };
      const argvArray = ['mup', 'logs', '--verbose'];
      const unwanted = ['_'];

      const result = utils.filterArgv(argvArray, argv, unwanted);

      expect(result).to.deep.equal(['logs', '--verbose']);
    });
    it('should add non-boolean values', () => {
      const argv = { _: ['logs'], tail: '10', follow: true };
      const argvArray = ['mup', 'logs', '--tail=10', '--follow'];
      const unwanted = ['_'];

      const result = utils.filterArgv(argvArray, argv, unwanted);

      expect(result).to.deep.equal(['logs', '--tail', '10', '--follow']);
    });
    it('should remove options not provided by user', () => {
      const argv = { _: ['logs'], follow: true, tail: '10' };
      const argvArray = ['mup', 'logs'];
      const unwanted = ['_'];

      const result = utils.filterArgv(argvArray, argv, unwanted);

      expect(result).to.deep.equal(['logs']);
    });
  });

  describe('createSSHOptions', () => {
    it('should create basic SSH options with host and username', () => {
      const server = {
        host: '192.168.1.1',
        username: 'testuser'
      };
      const result = utils.createSSHOptions(server);

      expect(result.host).to.equal('192.168.1.1');
      expect(result.username).to.equal('testuser');
      expect(result.port).to.equal(22);
    });

    it('should use custom port from opts', () => {
      const server = {
        host: '192.168.1.1',
        username: 'testuser',
        opts: {
          port: 2222
        }
      };
      const result = utils.createSSHOptions(server);

      expect(result.port).to.equal(2222);
    });

    it('should pass through sshOptions', () => {
      const server = {
        host: '192.168.1.1',
        username: 'testuser',
        sshOptions: {
          readyTimeout: 30000,
          keepaliveInterval: 10000,
          keepaliveCountMax: 5
        }
      };
      const result = utils.createSSHOptions(server);

      expect(result.readyTimeout).to.equal(30000);
      expect(result.keepaliveInterval).to.equal(10000);
      expect(result.keepaliveCountMax).to.equal(5);
    });

    it('should pass through all sshOptions including algorithms', () => {
      const server = {
        host: '192.168.1.1',
        username: 'testuser',
        sshOptions: {
          readyTimeout: 60000,
          forceIPv4: true,
          compress: true,
          algorithms: {
            kex: ['diffie-hellman-group14-sha1'],
            cipher: {
              encrypt: ['aes256-ctr'],
              decrypt: ['aes256-ctr']
            }
          }
        }
      };
      const result = utils.createSSHOptions(server);

      expect(result.readyTimeout).to.equal(60000);
      expect(result.forceIPv4).to.equal(true);
      expect(result.compress).to.equal(true);
      expect(result.algorithms).to.deep.equal({
        kex: ['diffie-hellman-group14-sha1'],
        cipher: {
          encrypt: ['aes256-ctr'],
          decrypt: ['aes256-ctr']
        }
      });
    });
  });
});
