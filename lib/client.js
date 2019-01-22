var fs = require('fs');
var path = require('path');
var util = require('util');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var Connection = require('ssh2');
var _ = require('lodash');


function Client(options) {
  this._options = options || {};

  this.remote = {};
}
util.inherits(Client, EventEmitter);

Client.prototype.defaults = function(options) {
  if (options) {
    this._options = options || {};
  } else {
    return this._options;
  }
};

Client.prototype.parse = function(remote) {
  if (_.isString(remote)) {
    // username[:password]@host[:port][:/path/to]
    var regex = /^([a-zA-Z0-9\-\._]+)(?:\:(.*))?@([^:]+)(?:\:([0-9]+))?(?:\:(.*))?$/;
    var m = remote.match(regex);
    if (!m) return {};
    var ret = {
      username: m[1],
      host: m[3],
    };
    if (m[2]) {
      ret.password = m[2];
    }
    if (m[4]) {
      ret.port = m[4];
    }
    if (m[5]) {
      ret.path = m[5];
    }
    this.remote = ret;
    return ret;
  }
  this.remote = remote;
  return remote;
};

Client.prototype.sftp = function(callback) {
  if (this.__sftp) {
    callback(null, this.__sftp);
    return;
  }

  var remote = _.defaults(this.remote, this._options);
  if (this.__ssh) {
    this.__ssh.connect(remote);
    return;
  }

  var self = this;
  this.__ssh = new Connection();
  this.__ssh.on('connect', function() {
    self.emit('connect');
  });
  this.__ssh.on('ready', function() {
    self.emit('ready');

    self.__ssh.sftp(function(err, sftp) {
      if (err) throw err;
      // save for reuse
      self.__sftp = sftp;
      callback(err, sftp);
    });
  });
  this.__ssh.on('error', function(err) {
    self.emit('error', err);
    callback(err);
  });
  this.__ssh.on('end', function() {
    self.emit('end');
  });
  this.__ssh.on('close', function() {
    self.emit('close');
  });
  this.__ssh.on('keyboard-interactive', function(name, instructions, instructionsLang, prompts, finish) {
    self.emit('keyboard-interactive', name, instructions, instructionsLang, prompts, finish);
  });
  this.__ssh.on('change password', function(message, language, done) {
    self.emit('change password', message, language, done);
  });
  this.__ssh.on('tcp connection', function(details, accept, reject) {
    self.emit('tcp connection', details, accept, reject);
  });
  this.__ssh.connect(remote);
};

Client.prototype.close = function() {
  if (this.__sftp) {
    this.__sftp.end();
    this.__sftp = null;
  }
  if (this.__ssh) {
    this.__ssh.end();
    this.__ssh = null;
  }
};


Client.prototype.mkdir = function(dir, attrs, callback) {
  if (_.isFunction(attrs)) {
    callback = attrs;
    attrs = undefined;
  }

  if (attrs) {
    attrs.mode = getFolderAttr(process.platform, attrs);
  }

  var self = this;
  var dirs = [];
  var exists = false;

  this.sftp(function(err, sftp) {
    if (err) {
      return callback(err);
    }

    // for record log
    var mkdir = function(dir, callback) {
      self.emit('mkdir', dir);
      sftp.mkdir(dir, attrs, callback);
    };

    async.until(function() {
      return exists;
    }, function(done) {
      // detect if the directory exists
      sftp.stat(dir, function(err, attr) {
        if (err) {
          dirs.push(dir);
          dir = path.dirname(dir);
        } else {
          exists = true;
        }
        done();
      });
    }, function(err) {
      if (err) {
        callback(err);
      } else {
        // just like mkdir -p
        async.eachSeries(dirs.reverse(), mkdir, callback);
      }
    });

  });
};

Client.prototype.write = function(options, callback) {
  var destination = options.destination;
  destination = unixy(destination);

  var attrs = options.attrs;
  var content = options.content;
  var chunkSize = options.chunkSize || 32768;

  var self = this;

  this.sftp(function(err, sftp) {
    if (err) {
      return callback(err);
    }

    var _write = function(handle) {
      self.emit('write', options);
      var length;
      var lastIndex = 0;
      var lastCursor = 0;

      if (Buffer.isBuffer(content)) {
        var contents = [];
        length = parseInt((content.length - 1) / chunkSize, 10) + 1;

        for (var i = 0 ; i < length; i++) {
          contents.push(content.slice(i * chunkSize, (i + 1) * chunkSize));
        }
        async.eachSeries(contents, function(buf, callback) {
          self.emit('transfer', buf, lastCursor, length);
          sftp.write(handle, buf, 0, buf.length, lastIndex, function(err) {
            lastIndex += buf.length;
            lastCursor += 1;
            callback(err);
          });
        }, function(err) {
          sftp.close(handle, callback);
        });
      } else if (typeof content === 'number') {
        // content is a file descriptor
        length = parseInt((attrs.size - 1) / chunkSize, 10) + 1;
        var range = new Array(length);
        async.eachSeries(range, function(pos, callback) {
          chunkSize = Math.min(chunkSize, attrs.size - lastIndex);
          if (!chunkSize) {
            callback(err);
            return;
          }
          var buf = new Buffer(chunkSize);
          fs.read(content, buf, 0, chunkSize, lastIndex, function(err, byteRead, buf) {
            self.emit('transfer', buf, lastCursor, length);
            sftp.write(handle, buf, 0, buf.length, lastIndex, function(err) {
              lastIndex += buf.length;
              lastCursor += 1;
              callback(err);
            });
          });
        }, function(err) {
          sftp.close(handle, function(err) {
            fs.close(content, callback);
          });
        });
      } else {
        throw new Error('Content should be buffer or file descriptor');
      }
    };

    var step = _.throttle(function(total_transferred, chunk, total) {
      self.emit(
        "transfer",
        undefined,
        // percentage up to 99
        // since it's incremented in the logger
        Math.min(Math.floor(total_transferred / total * 100), 99),
        100
      ),
        100;
    });
    sftp.fastPut(
      options.source,
      path.basename(options.source),
      {
        step
      },
      function(err) {
        step.cancel();
        callback(err);
      }
    );
  });
};

Client.prototype.upload = function(src, dest, callback) {
  dest = unixy(dest);

  var self = this;

  async.waterfall([
    function(callback) {
      fs.stat(src, callback);
    },
    function(stat, callback) {
      if (stat.isDirectory()) return callback(new Error('Can not upload a directory'));

      // Get the attributes of the source directory
      fs.stat(path.dirname(src), function(err, dirStat) {
        if(err) return callback(err);

        var cleanDirStat = {mode: dirStat.mode};

        self.mkdir(path.dirname(dest), cleanDirStat, function(err){ callback(err, stat) });
      });
    },
    function(stat, callback) {
      fs.open(src, 'r', function(err, fd) { callback(err, stat, fd); });
    },
    function(stat, fd, callback) {
      self.write({
        source: src,
        destination: dest,
        content: fd,
        attrs: stat
      }, callback);
    }
  ], function(err) {
    callback(err);
  });
};

Client.prototype.download = function(src, dest, callback) {
  var self = this;

  self.sftp(function(err,sftp){
    if (err) {
      return callback(err);
    }

    var sftp_readStream = sftp.createReadStream(src);
    sftp_readStream.on('error', function(err){
      callback(err);
    });
    sftp_readStream.pipe(fs.createWriteStream(dest))
    .on('close',function(){
      self.emit('read', src);
      self.close();
      callback(null);
    })
    .on('error', function(err){
      callback(err);
    });
  });
};

exports = module.exports = new Client();
exports.Client = Client;

function unixy(filepath) {
  if (process.platform === 'win32') {
    return filepath.replace(/\\/g, '/');
  }
  return filepath;
}

function getFolderAttr(platform, attrs) {
  var DEFAULT_MODE = '0755';
  if (platform === 'win32') {
    return DEFAULT_MODE;
  }
  if (attrs) {
    return attrs.mode || DEFAULT_MODE;
  }
}
