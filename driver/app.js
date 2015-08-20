var RemoteDriver = require('./driver-remote');

var config = require('./config');

var driver = new RemoteDriver(config);

driver.run();
