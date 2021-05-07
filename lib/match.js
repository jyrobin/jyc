
var slice = Array.prototype.slice
var isArguments = require('./utils').isArguments;

// one level comparison only
function match(obj) {
  if (!obj || typeof obj !== 'object') return false;

  for (var i=1, argn=arguments.length; i<argn; i++) {
    var pat = arguments[i];
    var keys = Object.keys(pat);
    for (var j=0, n=keys.length; j<n; j++) {
      var key = keys[j];
      var val = pat[key];
      if (val !== undefined && obj[key] !== val) return false;
    }
  }
  return true;
}

match.matcher = matcher;
function matcher() {
  var args = arguments;
  return function (obj) {
    return match.bind(null, obj).apply(null, args);
  };
}

match.filter = function(arr, opts) {
  return !arr ? [] : arr.filter(typeof opts === 'function' ? opts : matcher(opts));
};

match.find = function(arr, opts) {
  if (arr) return arr.find(typeof opts === 'function' ? opts : matcher(opts));
};

// https://github.com/othiym23/only-shallow
// - remove buffer and regex testing

match.shallower = function(a, b) {
  return shallower_(a, b, [], []);
};

function shallower_ (a, b, ca, cb) {
  if (typeof a !== 'object' && typeof b !== 'object' && a == b) {
    return true;
  } else if (a === null || b === null) {
    return a == b;
  } else if (typeof a !== 'object' || typeof b !== 'object') {
    return false;
  } else if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  } else if (isArguments(a) || isArguments(b)) {
    return shallower_(slice.call(a), slice.call(b), ca, cb);
  } else {
    var ka = Object.keys(a);
    var kb = Object.keys(b);
    // don't bother with stack acrobatics if there's nothing there
    if (ka.length === 0 && kb.length === 0) return true;
    if (ka.length !== kb.length) return false;

    var cal = ca.length;
    while (cal--) if (ca[cal] === a) return cb[cal] === b;
    ca.push(a); cb.push(b);

    ka.sort(); kb.sort();
    for (var k = ka.length - 1; k >= 0; k--) if (ka[k] !== kb[k]) return false;

    var key;
    for (var l = ka.length - 1; l >= 0; l--) {
      key = ka[l]
      if (!shallower_(a[key], b[key], ca, cb)) return false;
    }

    ca.pop(); cb.pop();

    return true;
  }
}

module.exports = match;
