# scp2


## API

```js
var client = require('scp2')

// set some default values
client.defaults({
    port: 22,
    remote: '127.0.0.1',
    path: '/home/admin/data/',
    username: 'admin',
    password: '123'
});

// scp a file to a server
client.scp('file.txt', 'root:password@example.com:~/new-file.txt', function(err) {
});


// scp a file to a new host
client.scp('file.txt', {
    port: 22,
    remote: 'example.com',
    username: 'admin',
    path: '/home/admin/data/',
    filename: 'file.txt',
    privateKey: fs.readFileSync('/path/to/user/.ssh/id_dsa')
}, function(err) {
})

// scp a directory
client.scp('dir/', {...}, function(err) {
});

// scp a glab pattern
client.scp('dir/*.css', {...}, function(err) {
});
```
