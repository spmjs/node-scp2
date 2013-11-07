# scp2

A pure javascript secure copy program based on ssh2.

-----

scp2 is greatly powered by [ssh2](https://github.com/mscdex/ssh2), implemented the `scp` in a `sftp` way.

It is written in pure javascript, and should work on every OS, even Windows. Nodejs (v0.8.7 or newer) is required to make it work.


## Install

You can either use it as a library, or a program. For Windows users who miss scp on unix/linux world, you can get the command line now:

    $ npm install scp2 -g

You will get a command line tool `scp2`, and let's try:

    $ scp2 -h

Get the development version from ninja channel:

    $ npm install scp2@ninja


## High level API


Get the client:

```js
var client = require('scp2')
```

Copy a file to the server:

```js
client.scp('file.txt', 'admin:password@example.com:/home/admin/', function(err) {
})
```

Copy a file to the server in another way:

```js
client.scp('file.txt', {
    host: 'example.com',
    username: 'admin',
    password: 'password',
    path: '/home/admin/'
}, function(err) {})
```

Copy a file to the server and rename it:

```js
client.scp('file.txt', 'admin:password@example.com:/home/admin/rename.txt', function(err) {
})
```

Copy a directory to the server:

```js
client.scp('data/', 'admin:password@example.com:/home/admin/data/', function(err) {
})
```

Copy via glob pattern:

```js
client.scp('data/*.js', 'admin:password@example.com:/home/admin/data/', function(err) {
})
```

Download a file from server:

```js
client.scp('admin:password@example.com:/home/admin/file.txt', './', function(err) {
})
```

Download a file from server in another way:

```js
client.scp({
    host: 'example.com',
    username: 'admin',
    password: 'password',
    path: '/home/admin/file.txt'
}, './', function(err) {})
```

**TODO**: download via glob pattern.


## Low level API

Get the client:

```js
var Client = require('scp2').Client;
```

The high level client is an instance of `Client`, but it contains the high level API `scp`.

### Methods


- **defaults** `function({})`

  set the default values for the remote server.

  ```js
  client.defaults({
      port: 22,
      host: 'example.com',
      username: 'admin',
      privateKey: '....'
  });
  ```

  You can also initialize the instance with these values:

  ```js
  var client = new Client({
      port: 22
  });
  ```

  More on the values at [ssh2](https://github.com/mscdex/ssh2).


- **sftp** `function(callback) -> callback(err, sftp)`

  Get the sftp.

- **close** `function()`

  Close all sessions.

- **mkdir** `function(dir, [attr], callback) -> callback(err)`

  Make a directory on the remote server. It behaves like `mdkir -p`.

- **write** `function(options, callback) -> callback(err)`

  Write content on the remote server.

  ```js
  client.write({
      destination: '/home/admin/data/file.txt',
      content: 'hello world'
  }, callback)
  ```

  The options can contain:

  - destination
  - content: string or buffer
  - attrs
  - source: the source path, e.g. local/file.txt

- **upload** `function(src, dest, callback) -> callback(err)`

  upload a local file to the server.

  ```js
  client.upload('file.txt', '/home/admin/file.txt', callback)
  ```

- **download** `function(src, dest, callback) -> callback(err)`

  download a server file to local.


## Events

You can listen on these events:

- connect
- ready
- error (err)
- end
- close
- mkdir (dir)
- write (object)
- read (src)
- transfer (buffer, uploaded, total)

## Changelog

**2013-11-07** `0.1.4` ~stable

1. Bugfix

**2013-06-04** `0.1.3` ~stable

1. Fixed mkdir mode bug

**2013-06-04** `0.1.2` ~stable

1. Fixed for uploading a large file (beyond the limitation of fs.readFile)
2. Event emit for `transfer`

**2013-06-03** `0.1.1` ~stable

1. Bugfix for scp a large file.

**2013-03-08** `0.1.0` ~ stable

1. remove the require of buffer, `Buffer` is on global

**2013-03-07** `0.1.0b1` ~ ninja

1. show version options on binary
2. bugfix of upload, it should mkdir right

**2013-03-06** `0.1.0a3` ~ ninja

1. Fix path bug on windows.
2. Pretty output log.

**2013-03-06** `0.1.0a2` ~ ninja

1. Download a file from server works.
2. Documentation on this lib.

**2013-03-05** `0.1.0a1` ~ ninja

1. Init the program, take the name scp2 in npmjs.org.
2. scp to server works.


## License

Copyright (c) 2013 Hsiaoming Yang

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
