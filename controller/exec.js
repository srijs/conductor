'use strict';

var Promise = require('bluebird');

var http = require('http');

var retry = require('retry');

var runExec = function (image, name, args) {

  return new Promise(function (resolve, reject) {

    var operation = retry.operation();

    operation.attempt(function () {

      var req = http.request({
        socketPath: image + '.sock',
        method: 'POST',
        path: '/exec'
      });

      req.end(JSON.stringify({
        name: name,
        args: args
      }));

      req.on('error', function (err) {
        if (!operation.retry(err)) {
          reject(operation.mainError());
        }
      });

      req.on('response', function (res) {

        var bufs = [];

        res.on('data', function (buf) {
          bufs.push(buf);
        });

        res.on('end', function () {
          resolve(Buffer.concat(bufs));
        });

      });

    });

  });

};

exports.exec = function (cmd, image, opts, cb) {

  if (!cb && typeof opts === 'function') {
    cb = opts;
    opts = {};
  }

  var maxBuffer = opts.maxBuffer || 200 * 1024;
  var timeout = opts.timeout;

  if(typeof cb !== 'function') {
    throw new TypeError('Given cb is not a function');
  }

  if (typeof image !== 'string') {
    return cb(new Error('safe_proc: image not set on exec() call.'));
  }
  
  // remove falsy (incl. empty string) elements from cmd array
  cmd = cmd.filter(function (arg) { return !!arg; });

  runExec(image, cmd[0], cmd.slice(1)).then(function (json) {

    var result = JSON.parse(json);

    if (!result.success) {
      var err = new Error(result.error);
      Object.defineProperties(err, {
        stdout: {value: result.stdout},
        stderr: {value: result.stderr}
      });
      return Promise.reject(err);
    }

    return Promise.resolve({
      stdout: result.stdout,
      stderr: result.stderr
    });

  }).done(function (stdio) {
    cb(null, stdio.stdout, stdio.stderr);
  }, function (err) {
    cb(err, err.stdout, err.stderr);
  });

};
