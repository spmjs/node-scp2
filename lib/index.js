var fs = require('fs');
var path = require('path');
var util = require('util');
var async = require('async');
var Buffer = require('buffer').Buffer;
var Connection = require('ssh2');
var _ = require('lodash');
var file = require('./file');


var client = new Client();
exports = module.exports = function(local, remote, callback) {
  var parsed = client.parse(local);

  if (parsed.username && parsed.host) {
    local = remote;
    client.remote = parsed;
    client.download(local, callback);
  } else {
    client.remote = client.parse(remote);
    client.upload(local, callback);
  }
}
exports.defaults = client.defaults;

exports.upload = client.upload;
//exports.download = client.download;

exports.Client = Client;
