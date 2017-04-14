var libpath = process.env['SCP2_COVERAGE'] ? '../lib-cov' : '../lib';

var client = require(libpath + '/client');
var expect = require('expect.js');

describe('Client', function() {

  var ret;
  it('can parse username and host', function() {
    ret = client.parse('admin@example.com');
    expect(ret.username).to.equal('admin');
    expect(ret.host).to.equal('example.com');
  });

  it('can parse username, password and host', function() {
    ret = client.parse('admin:bx%9@example.com');
    expect(ret.username).to.equal('admin');
    expect(ret.password).to.equal('bx%9');
    expect(ret.host).to.equal('example.com');
  });

  it('can parse username, password, host, and path', function() {
    ret = client.parse('admin:bx%9@example.com:/home/admin/path');
    expect(ret.username).to.equal('admin');
    expect(ret.password).to.equal('bx%9');
    expect(ret.host).to.equal('example.com');
    expect(ret.path).to.equal('/home/admin/path');
  });


  it('returns non-string objects ', function() {
    var stringBuffer = new Buffer('1234'),
        arrayBuffer = new Buffer([ '1', '2', '3', '4' ]),
        obj = { username: 'admin', host: 'example.com' };

    expect(client.parse(false)).to.equal(false);
    expect(client.parse(42)).to.equal(42);
    expect(client.parse(stringBuffer)).to.equal(stringBuffer);
    expect(client.parse(arrayBuffer)).to.equal(arrayBuffer);
    expect(client.parse(obj)).to.equal(obj);
  });

});

describe('when calling from windows', function() {
  var originPlatform = process.platform;

  afterEach(function() {
    Object.defineProperty(process, 'platform', {
      value: originPlatform
    });
  });

  it('should create return 0755 for windows', function() {
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    });
    var originSftp = client.sftp;
    client.sftp = function(callback) {
      callback(new Error()); // just want to test attrs.mode, make method return earily
    };

    var attrs = {
      mode: 16822
    };

    client.mkdir('testdir', attrs, function(err) {
      expect(attrs.mode).to.equal('0755');
    });
  });

  it('should create return actual mode for mac or linux', function() {
    Object.defineProperty(process, 'platform', {
      value: 'darwin'
    });
    var originSftp = client.sftp;
    client.sftp = function(callback) {
      callback(new Error()); // just want to test attrs.mode, make method return earily
    };

    var attrs = {
      mode: '0777'
    };

    client.mkdir('testdir', attrs, function(err) {
      expect(attrs.mode).to.equal('0777');
    });
  });



});
