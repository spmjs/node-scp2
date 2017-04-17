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

  //  NOTE: At this time, username is always required
  // it('can parse host and port', function() {
  //   ret = client.parse('example.com:12345');
  //   expect(ret.host).to.equal('example.com');
  //   expect(ret.port).to.equal('12345');
  // });

  it('can parse username, host, and port', function() {
    ret = client.parse('admin@example.com:12345');
    expect(ret.username).to.equal('admin');
    expect(ret.host).to.equal('example.com');
    expect(ret.port).to.equal('12345');
  });

  it('can parse username, password, host, and port', function() {
    ret = client.parse('admin:bx%9@example.com:12345');
    expect(ret.username).to.equal('admin');
    expect(ret.password).to.equal('bx%9');
    expect(ret.host).to.equal('example.com');
    expect(ret.port).to.equal('12345');
  });

  // NOTE: At this time, username is always required
  // it('can parse path only', function() {
  //   ret = client.parse('/home/admin/path');
  //   expect(ret.path).to.equal('/home/admin/path');
  // });

  // NOTE: At this time, username is always required
  // it('can parse host and path', function() {
  //   ret = client.parse('example.com:/home/admin/path');
  //   expect(ret.host).to.equal('example.com');
  //   expect(ret.path).to.equal('/home/admin/path');
  // });

  // NOTE: At this time, username is always required
  // it('can parse host, port, and path', function() {
  //   ret = client.parse('example.com:12345:/home/admin/path');
  //   expect(ret.host).to.equal('example.com');
  //   expect(ret.port).to.equal('12345');
  //   expect(ret.path).to.equal('/home/admin/path');
  // });

  it('can parse username, host, and path', function() {
    ret = client.parse('admin@example.com:/home/admin/path');
    expect(ret.username).to.equal('admin');
    expect(ret.host).to.equal('example.com');
    expect(ret.path).to.equal('/home/admin/path');
  });

  it('can parse username, host, port, and path', function() {
    ret = client.parse('admin@example.com:12345:/home/admin/path');
    expect(ret.username).to.equal('admin');
    expect(ret.host).to.equal('example.com');
    expect(ret.port).to.equal('12345');
    expect(ret.path).to.equal('/home/admin/path');
  });

  it('can parse username, password, host, and path', function() {
    ret = client.parse('admin:bx%9@example.com:/home/admin/path');
    expect(ret.username).to.equal('admin');
    expect(ret.password).to.equal('bx%9');
    expect(ret.host).to.equal('example.com');
    expect(ret.path).to.equal('/home/admin/path');
  });

  it('can parse username, password, host, port, and path', function() {
    ret = client.parse('admin:bx%9@example.com:12345:/home/admin/path');
    expect(ret.username).to.equal('admin');
    expect(ret.password).to.equal('bx%9');
    expect(ret.host).to.equal('example.com');
    expect(ret.port).to.equal('12345');
    expect(ret.path).to.equal('/home/admin/path');
  });

  it('can handle "@" in password', function() {
    ret = client.parse('admin:bx@%9@example.com:12345:/home/admin/path');
    expect(ret.username).to.equal('admin');
    expect(ret.password).to.equal('bx@%9');
    expect(ret.host).to.equal('example.com');
    expect(ret.port).to.equal('12345');
    expect(ret.path).to.equal('/home/admin/path');
  });

  it('can handle ":" in password', function() {
    ret = client.parse('admin:bx:%9@example.com:12345:/home/admin/path');
    expect(ret.username).to.equal('admin');
    expect(ret.password).to.equal('bx:%9');
    expect(ret.host).to.equal('example.com');
    expect(ret.port).to.equal('12345');
    expect(ret.path).to.equal('/home/admin/path');
  });

  it('can handle "_" in username', function() {
    ret = client.parse('admin_2:bx%9@example.com:12345:/home/admin/path');
    expect(ret.username).to.equal('admin_2');
    expect(ret.password).to.equal('bx%9');
    expect(ret.host).to.equal('example.com');
    expect(ret.port).to.equal('12345');
    expect(ret.path).to.equal('/home/admin/path');
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
