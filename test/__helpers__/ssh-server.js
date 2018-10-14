var fs = require('fs');
var path = require('path');
var ssh2 = require('ssh2');

var mocks = require('./mocks');

var STATUS_CODE = ssh2.SFTP_STATUS_CODE;
 
var server = new ssh2.Server({
  hostKeys: [fs.readFileSync(path.join(__dirname, 'mock_rsa'))]
}, client => {
 
  client.on('authentication', ctx => {
    ctx.accept();
  }).on('ready', () => {
 
    client.on('session', (accept, reject) => {
      var session = accept();
      
      /* https://github.com/mscdex/ssh2/blob/master/examples/sftp-server-download-only.js */
      session.on('sftp', (accept, reject) => {
        let openFiles = {};
        let handleCount = 0;
        // `sftpStream` is an `SFTPStream` instance in server mode
        // see: https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md
        var sftpStream = accept();
        sftpStream.on('OPEN', function(reqid, filename, flags, attrs) {
          // create a fake handle to return to the client, this could easily
          // be a real file descriptor number for example if actually opening
          // the file on the disk
          var handle = new Buffer(4);
          openFiles[handleCount] = { read: false };
          handle.writeUInt32BE(handleCount++, 0, true);
          sftpStream.handle(reqid, handle);
        }).on('READ', function(reqid, handle, offset, length) {
          if (handle.length !== 4 || !openFiles[handle.readUInt32BE(0, true)])
            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
          // fake the read
          let state = openFiles[handle.readUInt32BE(0, true)];
          if (state.read)
            sftpStream.status(reqid, STATUS_CODE.EOF);
          else {
            state.read = true;
            sftpStream.data(reqid, mocks.fake_remote_data);
          }
        }).on('WRITE', function(reqid, handle, offset, data) {
          if (handle.length !== 4 || !openFiles[handle.readUInt32BE(0, true)])
            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
          // fake the write
          sftpStream.status(reqid, STATUS_CODE.OK);
          var inspected = require('util').inspect(data);
        }).on('CLOSE', function(reqid, handle) {
          let fnum;
          if (handle.length !== 4 || !openFiles[(fnum = handle.readUInt32BE(0, true))])
            return sftpStream.status(reqid, STATUS_CODE.FAILURE);
          delete openFiles[fnum];
          sftpStream.status(reqid, STATUS_CODE.OK);
        }).on('REALPATH', function(reqid, p) {
          var name = [{
            filename: path,
            longname: `-rwxrwxrwx 1 foo foo 3 Dec 8 2009 ${path.basename(p)}`,
            attrs: {}
          }];
          sftpStream.name(reqid, name);
        }).on('STAT', onSTAT)
          .on('LSTAT', onSTAT);
        function onSTAT(reqid) {
          sftpStream.attrs(reqid, mocks.stat);
        }
      });
    });
  }).on('end', () => {})
});

server.on("close", () => {});

module.exports = function(host = "127.0.0.1", port = 2222) {
  server.listen(port, host, () => {});
  return {
    close() {
      return new Promise(resolve => server.close(resolve));
    },
    host,
    port
  }
};
