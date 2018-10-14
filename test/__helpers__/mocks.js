const { S_IFREG } = require("constants");
const path = require("path");
const tmpdir = require("os").tmpdir;

exports.stat = {
  mode: S_IFREG,
  uid: 0,
  gid: 0,
  size: 3,
  atime: new Date(),
  mtime: new Date()
};

exports.parsed_stat = {
  ...exports.stat,
  permissions: exports.stat.mode,
  atime: Number.parseInt(exports.stat.atime.getTime() / 1000),
  mtime: Number.parseInt(exports.stat.mtime.getTime() / 1000)
};

exports.fake_remote_path = "/fake/path";
exports.fake_remote_data = "a bunch of fake data to be confirmed later in a test";
exports.local_file = path.resolve(__dirname, "mock_rsa.pub");
exports.local_dest = filename => path.join(tmpdir(), filename || `${new Date().getTime()}.scp2`);

exports.client_defaults = {
  username: 'foo',
  password: 'bar'
}