var Connection = require('ssh2');
var _ = require('lodash');


function Client(options) {
  this._options = options || {};
}
Client.prototype.defaults = function(options) {
  if (options) {
    this._options = options || {};
  } else {
    return this._options;
  }
}

Client.prototype.parse = function(server) {
  if (_.isString(server)) {
    // username:password@host:/path/to
    var regex = /^([a-zA-Z0-9\-\.]+)(\:.*)?@([^:]+)(\:.*)?$/;
    var m = server.match(regex);
    var ret = {
      username: m[1],
      host: m[3]
    }
    if (m[2]) {
      ret.password = m[2].slice(1);
    }
    if (m[4]) {
      ret.path = m[4].slice(1);
    }
    return ret;
  }
  return server;
}

Client.prototype.upload = function() {
}

Client.prototype.download = function() {
}

var client = new Client();
exports = module.exports = function(local, server, callback) {
  var options = client.parse(server);
}

exports.defaults = client.defaults;

exports.Client = Client;
