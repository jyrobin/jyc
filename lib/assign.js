
var isObject = require('./utils').isObject;
var pick = require('./pick');

function isIn(arr) {
  return function(key) { return arr.indexOf(key) >= 0; }
}
function hasKey(keys) {
  return function(key) { return keys[key]; }
}
function same(k) {
  return function(key) { return k === key; }
}

function assign(obj, data, fields, excepts) {
  if (!obj || !data) return obj;
  if (typeof obj !== 'object' || !isObject(data)) return obj;

  var keys = Array.isArray(fields) ? fields : Object.keys(data);
  var len = keys.length;
  if (len === 0) return obj;

  var fn = !excepts ? false
    : (typeof excepts === 'string' ? same(excepts)
    : (typeof excepts === 'function' ? excepts 
    : (Array.isArray(excepts) ? isIn(excepts) : hasKey(excepts))));

  for (var i=0; i<len; i++) {
    var key = keys[i];
    if (!fn || !fn(key)) {
      var val = data[key];
      if (val !== undefined) obj[key] = val; 
    }
  }
  return obj;
}

module.exports = assign;
