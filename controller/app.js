'use strict';

var exec = require('./exec').exec;

console.log('spawning "ls -a ."');

exec(['ls', '-a', '.'], 'abc', function (err, stdout, stderr) {
  console.log(err, stdout, stderr);
});
