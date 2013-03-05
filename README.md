# scp2


## API

```js
var scp = require('scp2')

// set some default values
scp.defaults({
    port: 22,
    remote: '127.0.0.1',
    path: '/home/admin/data/',
    username: 'admin',
    password: '123'
});

// scp a file to a server
scp('file.txt', 'root:password@example.com:~/new-file.txt', function(err, result) {
});


// scp a file to a new host
scp('file.txt', {
    port: 22,
    remote: 'example.com',
    username: 'admin',
    path: '/home/admin/data/',
    filename: 'file.txt',
    privateKey: fs.readFileSync('/path/to/user/.ssh/id_dsa')
}, function(err, results) {
})

// scp a directory
scp('dir/', '~/data/', function(err, result) {
});

// scp a glab pattern
scp('dir/*.css', '~/data/', function(err, result) {
});
```
