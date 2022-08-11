
var access = require('./access');

module.exports = Object.assign({
  klass: require('./klass'),
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
  Tree: require('./tree'),
  Env: require('./env'),
  Plug: require('./plug'),
  utils: require('./utils'),
}, require('./utils'));
