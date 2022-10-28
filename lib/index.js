
var access = require('./access');
var klass = require('./klass');

module.exports = Object.assign({
  klass: klass,
  inherit: klass.inherit,
  composite: require('./composite'),
  mixin: require('./mixin'),
  assert: require('./assert'),
  ensure: require('./ensure'),
  access: access,
  obtain: access.obtain,
  get: access.get,
  match: require('./match'),
  glob: require('./glob'),
  assign: require('./assign'),
  pick: require('./pick'),
  map: require('./map'),
  //utils: require('./utils'),
}, require('./utils'));
