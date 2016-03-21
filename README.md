# scp2

Project Home: https://github.com/lepture/node-scp2

This is Just a Fork From Version 0.2.2 on 2016/03/21 to add the method testConnection on Client.js

Pull request created.

-----

### testConnection

```js
var client = require('scp2')
client.testConnection(err, isOk) {
	console.log(isOk ? 'Connection OK!' : 'Connection Error');
};
```