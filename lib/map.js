
var arrayLike = require('./utils').arrayLike;
var access = require('./access');

function nonNull(obj) { return obj != null; }

module.exports = function map(obj, fn, me, filter) {
  if (!obj) return []; // lodash

  var path = typeof fn === 'string' ? fn.split('.') : (arrayLike(fn) ? fn : null);
  var acc = path && access.bind(null, path, undefined);

  if (filter && typeof filter !== 'function') filter = nonNull;

  var ret, val, i, n;
  if (arrayLike(obj)) {
    ret = [];
    for (i=0, n=obj.length; i<n; i++) {
      val = acc ? acc(obj[i]) : fn.call(me, obj[i], i, obj);
      if (!filter || filter(val, i, obj)) ret.push(val);
    }
  } else {
    ret = {};
    var keys = Object.keys(obj);
    for (i=0, n=keys.length; i<n; i++) {
      var key = keys[i];
      val = acc ? acc(obj[key]) : fn.call(me, obj[key], key, obj);
      if (!filter || filter(val, key, obj)) ret[key] = val;
    }
  }
  return ret;
};

