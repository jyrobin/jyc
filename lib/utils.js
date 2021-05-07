
var isArray = Array.isArray;
var toString = Object.prototype.toString;
var slice = Array.prototype.slice;
var forEach = Array.prototype.forEach;
var concat = Array.prototype.concat;
var repeat = Array.prototype.repeat;

var _arrayLikes = [
  '[object Arguments]',
  '[object NodeList]',
  '[object HTMLCollection]',
];

function isArguments(obj) {
  return !!obj && typeof obj === 'object' && toString.call(obj) === '[object Arguments]';
}

function arrayLike(obj) {
  return !!obj && (isArray(obj) || _arrayLikes.indexOf(toString.call(obj)) >= 0);
}

function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
}

// non-standard: [] if obj == null; no cloning if isArray(obj)
function toArray(obj) {
  return obj == null && [] || isArray(obj) && obj || arrayLike(obj) && slice.call(obj) || [obj];
}

function _find(arr, field, val) {
  var idx = _findIndex(arr, field, val);
  if (idx >= 0) return arr[idx];
}
function _findIndex(arr, field, val) {
  var b = val === undefined;
  for (var i=0, n=arr.length; i<n; i++) {
    var it = arr[i];
    if (it && (b ? field in it : it[field] === val)) return i; 
  }
  return -1;
}
function findIndex(arr, fn, me) { 
  if (!arr) return -1;
  return typeof fn === 'string' ? _findIndex(arr, fn, me) : toArray(arr).findIndex(fn, me);
}

function _comp(field) {
  return function(a, b) {
    var x = a[field], y = b[field];
    return x < y ? -1 : (x > y ? 1 : 0);
  };
}

function _filter(arr, field, val) {
  var b = val === undefined;
  var ret = [];
  for (var i=0, n=arr.length; i<n; i++) {
    var it = arr[i];
    if (it && (b ? field in it : it[field] === val)) ret.push(it);
  }
  return ret;
}

function filter(arr, fn, me) {
  if (!arr) return [];
  return typeof fn === 'string' ? _filter(arr, fn, me) : toArray(arr).filter(fn, me);
}

function each(obj, fn, me) {
  if (!obj || typeof obj !== 'object') return;

  if (arrayLike(obj)) {
    forEach.call(obj, fn, me);
  } else {
    Object.keys(obj).forEach(function(key) {
      fn.call(me, obj[key], key);
    });
  }
};

var utils = {
  identity: function(x) { return x; },
  isPromise: function(p) { return Promise.resolve(p) === p; },
  isArray: isArray,
  isArguments: isArguments,
  isObject: isObject,
  arrayLike: arrayLike,
  toArray: toArray,
  each: each,
  filter: filter,
  findIndex: findIndex,

  indexOf: function(arr, val) {
    return arr && arrayLike(arr) ? toArray(arr).indexOf(val) : -1;
  },

  find: function(arr, fn, me) { 
    if (arr) return typeof fn === 'string' ? _find(arr, fn, me) : toArray(arr).find(fn, me);
  },

  contains: function(arr, fn, me) {
    return findIndex(arr, fn, me) >= 0;
  },

  // for short array
  unique: function(arr, field) {
    if (!arrayLike(arr)) return [];

    if (field) {
      return filter(arr, function(item, idx) {
        return _findIndex(arr, field, item[field]) === idx;
      });
    } else {
      return filter(arr, function(it, idx, a) { return a.indexOf(it) === idx; });
    }
  },

  slice: function(obj, start, end) {
    return toArray(obj).slice(start, end);
  },

  sortBy: function(arr, fn) {
    if (!arr || !arr.length) return [];
    return arr.sort(typeof fn === 'string' ? _comp(fn) : fn);
  },

  // non-standard
  // - array-like args
  // - return either first arg if array-like or whole args
  // - no slicing if isArray and start from 0
  argArray: function(args, start) {
    start = start > 0 ? start : 0;
    var arg = args[start];
    if (arg && isArray(arg)) return arg;
    if (arg && isArguments(arg)) return slice.call(arg);
    if (isArray(args)) return start === 0 ? args : args.slice(start);
    return slice.call(args, start);
  },

  entries: Object.entries || function(obj) {
    var keys = Object.keys(obj);
    var len = ownProps.length;
    var arr = new Array(len);
    while (len--) arr[len] = [keys[i], obj[keys[i]]];
    return arr;
  },

  // assuming str must be is string
  repeat: function(str, len) {
    if (len === 1) return str;  
    if (!len || len <= 0) return ''; // diff from native repeat

    if (repeat) return str.repeat(len);

    var len = Math.floor(len);
    var arr = new Array(len);
    while (len--) arr[len] = str;
    return arr.join('');
  },

  // pythonic dictionary items
  items: function(dict, sortKeys) {
    if (!dict) return [];

    var keys = Object.keys(dict);
    if (!keys.length) return [];
    if (sortKeys) keys.sort();

    return keys.map(function(key) { return [key, dict[key]]; });
  },

  // pythonic like repeat
  range: function(start, end, step, reverse) {
    if (end == null) {
      end = start;
      start = 0;
    }
    step = step || 1;
    var len = Math.max(Math.ceil((end - start) / step), 0);
    var arr = Array(len);
    for (var idx = -1; len > 0; len--, start += step) {
      arr[reverse ? len : ++idx] = start;
    }
    return arr;
  },

  concat: function(arr) {
    return concat.apply([], arr);
  },

  flatten: function(arr, depth) {
    arr = isArray(arr) ? arr.slice() : toArray(arr); // force cloning
    if (arr.length === 0) return arr; 

    for (var d = depth > 0 ? depth : 1; d > 0; d--) {
      arr = concat.apply([], arr.map(function(it) {
        return it == null ? [it] : toArray(it);
      }));
    }
    return arr;
  },

  union: function() {
    var ret = [];
    each(arguments, function(arg) {
      ret = ret.concat(arg.filter(function(x) { return ret.indexOf(x) < 0; }));
    });
    return ret;
  },

  // null arg means []
  intersect: function(arr1) {
    var ret = arr1 || [], arr;
    for (var i=1, n=arguments.length; ret.length > 0 && i<n; i++) {
      if (arr = arguments[i]) {
        var old = ret;
        ret = arr.filter(function(it) { return old.indexOf(it) >= 0; });
      } else {
        ret = [];
      }
    }
    return ret;
  },
};

module.exports = utils;
