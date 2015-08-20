var RemoteDispatcher = require('./dispatch-remote');

var config = require('./config');

var dispatcher = new RemoteDispatcher(config);

dispatcher.dispatch([]);
