
var arrayLike = require('./utils').arrayLike;

function pick(obj, names) {
  var picked = {};
  if (!obj || typeof obj !== 'object') return picked;

  if (arguments.length === 1) {
    names = Object.keys(obj);
  }

  var i = arrayLike(names) ? 0 : 1;
  var args = i === 0 ? names : arguments;
  for (var len = args.length; i < len; i++) {
    var val, name = args[i];
    if (typeof name === 'string') {
      val = obj[name];
    } else {
      val = undefined;
      Object.keys(name).forEach(function(key) {
        if (key in obj) {
          val = val || {};
          val[key] = pick(obj[key], name[key]);
        }
      });
    }
    if (val !== undefined) picked[name] = val;
  }
  return picked;
}

module.exports = pick;
