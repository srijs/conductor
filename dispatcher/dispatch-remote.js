'use strict';

var Promise = require('bluebird');

var Docker = require('dockerode');
var retry = require('retry');

var RemoteDispatcher = module.exports = function (config) {

  this.config = config;
  this._docker = new Docker(config.remote);

};

RemoteDispatcher.prototype.dispatch = function (workers) {
  var cc;
  return Promise.bind(this).then(function () {
    return this._createController();
  }).then(function (controllerContainer) {
    cc = controllerContainer;
    console.log(controllerContainer);
  }).then(function () {
    return this._createWorker(cc, 'abc');
  }).then(function (workerContainer) {
    console.log(workerContainer);
    return this._startContainer(workerContainer);
  }).then(function () {
    return this._startContainer(cc);
  });
};

RemoteDispatcher.prototype._createController = function () {
  var config = this.config;
  var docker = this._docker;
  return new Promise(function (resolve, reject) {
    docker.createContainer({
      Image: config.images.controller
    }, function (err, container) {
      if (err) {
        return reject(err);
      }
      resolve(container);
    });
  });
};

RemoteDispatcher.prototype._createWorker = function (controllerContainer, worker) {
  var config = this.config;
  var docker = this._docker;
  return new Promise(function (resolve, reject) {
    docker.createContainer({
      Image: config.images.worker,
      VolumesFrom: [controllerContainer.id],
      // Enforce multiplexed logging output
      Tty: false,
      // Disable external network communication
      NetworkDisabled: true,
      Memory: (config.constraints.memory || 512) * 1024 * 1024,
      MemorySwap: (config.constraints.memorySwap || 512) * 1024 * 1024,
      Env: ['WORKER='+worker]
    }, function (err, container) {
      if (err) {
        return reject(err);
      }
      resolve(container);
    });
  });
};

RemoteDispatcher.prototype._startContainer = function (container) {
  return new Promise(function (resolve, reject) {
    container.start({}, function (err, data) {
      if (err) {
        return reject(err);
      }
      resolve(data);
    });
  });
};

RemoteDispatcher.prototype._cleanupContainer = function (container) {
  return new Promise(function (resolve, reject) {
    // Workaround to give docker some time to actually finish
    // to stop the container (We see errors otherwise)
    var operation = retry.operation({
      maxTimeout: 15000
    });
    operation.attempt(function () {
      container.remove({v: true}, function (err) {
        if (operation.retry(err)) {
          return;
        }
        if (err) {
          return reject(operation.mainError());
        }
        resolve();
      });
    });
  });
};
