
module.exports = Object.assign({
  assetLoader: require('./asset-loader'),
}, require('./comp'), require('./ajax'), require('./loadjs'), require('./dom'),
  require('../lib/glob'), require('../lib/access'),  require('../lib/utils'));

