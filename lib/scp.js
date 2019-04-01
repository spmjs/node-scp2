var fs = require('fs');
var path = require('path');
var glob = require('glob');
var async = require('async');
var Client = require('./client').Client;
var global_client = new Client();

const WIDTH = process.stdout.columns;

function cp2remote(client, src, dest, callback, pFn) {
  client.parse(dest);

  var _upload = function(files, callback, pFn) {
    var rootdir = files[0];

    async.eachSeries(files, function(fpath, done) {
      fs.stat(fpath, function(err, stats) {
        if (err) {
          done(err);
          return;
        }
        if (stats.isFile()) {
          var fname = path.relative(rootdir, fpath);
          client.upload(
            fpath, path.join(client.remote.path, fname), done, pFn.bind(null, files.length)
          );
        } else {
          done();
        }
      });
    }, function(err) {
      // never forget to close the session
      client.on('close', function closeHandler() {
        callback(err);
        client.removeListener('close', closeHandler);
      });
      client.close();
    });
  };

  if (src.indexOf('*') === -1) {
    fs.stat(src, function(err, stats) {
      if (err) {
        callback(err);
        return;
      }
      if (stats.isFile()) {
        client.upload(src, client.remote.path, function(err) {
          client.on('close', function closeHandler() {
            callback(err);
            client.removeListener('close', closeHandler);
          });
          client.close();
        });
      } else if (stats.isDirectory()) {
        glob(src.replace(/\/$/, '') + '/**/**', function(err, files) {
          if (err) {
            callback(err);
          } else {
            _upload(files, callback, pFn);
          }
        });
      } else {
        callback('unsupported');
      }
    });
  } else {
    glob(src, function(err, files) {
      if (err) {
        callback(err);
        return;
      }
      _upload(files, callback, pFn);
    });
  }
}


function cp2local(client, src, dest, callback) {
  var remote = client.parse(src);
  // only works on single file now
  // TODO: glob match
  if (/\/$/.test(dest)) {
    dest = dest + path.basename(remote.path);
  }
  client.download(remote.path, dest, function () {
      client.close();
      callback.apply(this, arguments);
  });
}

exports = module.exports = global_client;

exports.Client = Client;

exports.scp = function(src, dest, client, callback) {
  let c = 0;
  let t = 0;

  if (typeof client === 'function') {
    callback = client;
    client = new Client();
  }
  client.on('error', callback);
  var parsed = client.parse(src);
  if (parsed.host && parsed.path) {
    cp2local(client, parsed, dest, callback);
  } else {
    cp2remote(client, src, dest, callback, progressFn);
  }
  
  function progressFn(len, p) {
    let str = '';
    if (p >= 100) {
        c++;
    }
    t = c * 100 + p;
    let l = parseInt(WIDTH * (t / (len * 100))) - 5;
    let progress = parseInt(t / (len * 100) * 100);
    l = l > 0 ? l : 0;
    for(let i = 0; i < l; i++) {
      str += '.';
      process.stdout.cursorTo(0);
      process.stdout.write(str);
      process.stdout.cursorTo(WIDTH - 5);
      process.stdout.write(` ${progress}%`);
    }
  }
};
