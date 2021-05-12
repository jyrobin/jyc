
var arrayLike = require('./utils').arrayLike;

module.exports = function ensure(obj, names) {
  var i = arrayLike(names) ? 0 : 1;
  var args = i === 0 ? names : arguments;
  for (var n=args.length; i<n; i++) {
    var name = args[i];
    if (obj[name] == null) throw Error('missing ' + name);
  }
  return obj;
};

