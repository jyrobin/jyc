
module.exports = access;

// otherwise is default value if obtain truy
function access(path, otherwise, obj, obtain, value) {
  var isSet = obtain && arguments.length >= 5;

  if (typeof path === 'function') {
    obj = path(obj);
    // cannot set value when path is function
    return obj === undefined ? otherwise : obj;
  }

  if (!obj || typeof obj !== 'object') return otherwise;

  if (!path) return obj;

  if (typeof path === 'string') path = path.split('.');

  var name, child, last = path.length-1;
  if (last < 0) return obj;

  for (var i=0; i<last; i++) {
    name = path[i];
    if (!name) continue;

    child = obj[name];
    if (child === undefined) {
      if (!obtain) return otherwise;

      obj = (obj[name] = {});
    } else if (child && typeof child === 'object') {
      obj = child;
    } else {
      return obtain ? undefined : otherwise; 
    }
  }

  name = path[last];

  if (isSet) {
    if (value === undefined) {
      delete obj[name];
    } else {
      obj[name] = value;
    }
    return value;
  }

  child = obj[name];
  if (obtain && child === undefined && otherwise !== undefined) {
    child = obj[name] = otherwise;
  }
  return child;
}

access.get = function(obj, path, otherwise) {
  return access(path, otherwise, obj);
};

access.obtain = function(obj, path, defaultVal) {
  return access(path, defaultVal, obj, true);
};
access.obtainFactory = function(obj, path, factory, opts) {
  var ret = access.obtain(obj, path);
  ret === undefined && access.set(obj, path, ret = factory(opts));
  return ret;
};

access.set = function(obj, path, value) {
  return access(path, undefined, obj, true, value);
};
access.del = function(obj, path, key) {
  var data = access.get(obj, path);
  if (data && typeof data === 'object') delete data[key];
};
access.merge = function(obj, path, data) {
  if (data && typeof data === 'object') {
    var ret = access.obtain(obj, path, {});
    if (ret && typeof ret === 'object') return Object.assign(ret, data);
  }
};

access.push = function(obj, path, value) {
  var arr = access.obtain(obj, path, []);
  arr.push(value);
  return arr;
};

access.map = function(arr, path, otherwise) {
  if (typeof path === 'string') path = path.split('.');
  return arr.map(function(item) {
    return access(path, otherwise, item);
  }); 
};

access.find = function(arr, path, val) {
  if (!arr || !path) return;

  if (typeof path === 'string') path = path.split('.');

  for (var i=0, n=arr.length; i<n; i++) {
    var obj = arr[i];
    if (access(path, undefined, obj) === val) return obj;
  }
};

access.sorter = function(path, otherwise) {
  return function(a, b) {
    var va = access(path, otherwise, a);
    var vb = access(path, otherwise, b);
    return va < vb ? -1 : (va > vb ? 1 : 0);
  };
};


