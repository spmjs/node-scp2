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
});
