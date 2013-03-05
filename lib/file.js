var _ = require('lodash');

var file = module.exports = {};

file.ignorecvs = false;
file.glob = require('glob');

file.list = function(src, filter) {
  var ret = [];
  file.recurse(src, function(filepath) {
    ret.push(filepath);
  }, filter);
  return ret;
}

file.recurse = function(rootdir, callback, subdir, filter) {
  if (_.isFunction(subdir)) {
    filter = subdir;
    subdir = null;
  }
  var abspath = subdir ? path.join(rootdir, subdir) : rootdir;
  fs.readdirSync(abspath).forEach(function(filename) {
    var filepath = path.join(abspath, filename);
    if (filter && !filter(filepath, subdir, filename)) {
      return;
    }
    if (file.ignorecvs && /^\.(git|hg|svn)$/.test(subdir)) {
      return;
    }
    if (fs.statSync(filepath).isDirectory()) {
      recurse(rootdir, callback, unixifyPath(path.join(subdir, filename)), filter);
    } else {
      callback(unixifyPath(filepath), rootdir, subdir, filename);
    }
  });
}

function unixifyPath(filepath) {
  if (process.platform === 'win32') {
    return filepath.replace(/\\/g, '/');
  }
  return filepath;
}
