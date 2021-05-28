
const debug = require('debug');
const loglevel = require('loglevel');
const loglevelDebug = require('loglevel-debug');

loglevel.debug = debug;
loglevel.debugLogger = function(name) {
  return loglevelDebug(name);
}

module.exports = loglevel;
