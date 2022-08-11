var ensure = require('./ensure');
var arrayLike = require('./utils').arrayLike;
var slice = Array.prototype.slice;

// base is anything with non-null 'values' field from which to prototype from
function _init(parent, base, args, i) {
  var env = Object.create(Env);
  env.parent = parent;
  env.root = parent ? parent.root: env;
  env.values = parent ? Object.create(parent.values)
    : (base ? Object.create(base.values) : {});

  if (base) env.base = base;
  if (args) {
    for (var n=args.length; i<n; i++) {
      env.set(args[i]);
    }
  }
  return env;
}

function _pick(obj, names, i, to) {
  for (var n=names.length; i<n; i++) {
    var name = names[i];
    var val = obj[name];
    if (val !== undefined) {
      to[name] = val;
    }
  }
  return to;
}

var Env = {
  push: function(opts, names) {
    var env = _init(this);
    if (typeof opts === 'string') {
      env.set(opts, names);
    } else if (arguments.length < 2) {
      if (opts) env.set(opts);
    } else {
      var i = arrayLike(names) ? 0 : 1;
      var args = i === 0 ? names : arguments;
      _pick(opts, args, i, env.values);
    }
    return env;
  },
  pop: function() {
    return this.parent;
  },
  set: function(key, val) {
    var values = this.values;
    if (typeof key === 'string') {
      if (val !== undefined) values[key] = val;
    } else if (key) {
      Object.keys(key).forEach(function(name) {
        val = key[name];
        if (val !== undefined) values[name] = val;
      });
    }
    return this;
  },
  get: function(name) {
    return this.values[name];
  },
  pick: function(names) {
    var args = arrayLike(names) ? names : arguments;
    return _pick(this.values, args, 0, {});
  },
  ensure: function(names) {
    var args = arrayLike(names) ? names : arguments;
    return ensure.call(null, this.values, args);
  },
  pushEnv: function(env, names) {
    var args = arrayLike(names) ? names : slice.call(arguments, 1);
    return this.push(env.values, args);
  },
};

module.exports = function(base) {
  return _init(null, base, arguments, 1); 
};
