'use strict';

var exec = require('./exec').exec;

exec(['ls', '-a', '.'], 'abc', function (err, stdout, stderr) {
  console.log(err, stdout, stderr);
});
