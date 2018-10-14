var MockServer = require("./__helpers__/ssh-server");
var mocks = require("./__helpers__/mocks");
var { Client } = require("../lib/client");
var expect = require("expect.js");
var { readFile } = require("fs");
var { promisify } = require("util");

var readFileAsync = promisify(readFile);

describe("Client E2E", () => {
  let server, client;
  beforeEach(() => {
    server = MockServer();
    client = new Client();
    client.defaults(
      Object.assign(
        {
          host: server.host,
          port: server.port
        },
        mocks.client_defaults
      )
    );
  });
  afterEach(async () => {
    try {
      client.close();
      client.defaults({});
      client = null;
    } catch (e) {
      console.log('Failed to close sftp client');
    }
    return await server.close();
  });
  it("can upload a file", async () => {
    var result = await new Promise((resolve, reject) => client.upload(mocks.local_file, mocks.fake_remote_path, err => {
      if (err) {
        reject(err);
      } else {
        resolve(mocks.fake_remote_path);
      }
    }));
    expect(result).to.eql(mocks.fake_remote_path);
    return result;
  });
  it("can download a file", async () => {
    var dest = mocks.local_dest("download_test");
    var result = await new Promise((resolve, reject) =>
      client.download(mocks.fake_remote_path, dest, err => {
          if (err) {
            reject(err);
          } else {
            resolve(dest);
          }
        }
      )
    );
    expect(await readFileAsync(result, "utf8")).to.eql(mocks.fake_remote_data);
    return result;
  });
  describe("scp2.sftp", () => {
    let sftp;
    beforeEach(async () => {
      client.defaults({
        host: server.host,
        port: server.port,
        ...mocks.client_defaults
      });
      sftp = await new Promise((resolve, reject) => {
        client.sftp((err, sftp) => {
          if(err) {
            reject(err);
          } else {
            resolve(sftp);
          }
        });
      });
      return sftp;
    });
    it("can make a stat request", async () => {
      var attr = await new Promise((resolve, reject) => sftp.stat(mocks.fake_remote_path, (err, attr) => {
        if(err) {
          reject(err);
        } else {
          resolve(attr);
        }
      }));
      expect(attr).to.eql(mocks.parsed_stat);
      return sftp;
    });
  });
});