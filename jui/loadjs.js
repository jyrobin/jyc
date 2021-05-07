
const slice = Array.prototype.slice;
const isArray = Array.isArray;
const { ready } = require('./dom');
const assetLoader = require('./asset-loader');
const _modules = {}; // ready modules
const _mods = {}; // Module map

function _mod(name) {
  if (typeof name === 'string') return _mods[name] || (_mods[name] = Module.instance(name));
}

const Module = {
  instance(name, val) {
    let obj = Object.create(Module);
    obj.init(name, val);
    return obj;
  },

  init(name, val) {
    if (!name) throw Error('null name');
    this.name = name;
    this.value = val;
    let loaded = this.loaded = val !== undefined;
    this.promise = loaded ? Promise.resolve(val)
      : new Promise(resolve => { this._resolve = resolve });

    if (loaded) _modules[name] = val;
  },

  resolve(val) {
    if (this.loaded) {
      if (val !== this.value) throw Error('module ' + this.name + ' conflict');
    } else {
      this.value = val;
      this.loaded = true;
      this.promise = Promise.resolve(val);
      _modules[this.name] = val;

      let resolve = this._resolve;
      if (resolve) {
        this._resolve = null;
        resolve(val);
      }
    }
  },
};

function peekModule(name) {
  let mod = _mod(name);
  return mod && mod.value;
}

function register(name, val) {
  if (!name || typeof name !== 'string') throw Error('bad name');
  let mod = _mod(name);
  mod && mod.resolve(val);
}

function loadModule(name) {
  let mod = _mod(name);
  return mod ? mod.promise : Promise.resolve();
}

function rdall() {
  let args = isArray(arguments[0]) ? arguments[0] : slice.call(arguments);
  return ready().then(function() {
    return Promise.all(args.map(function(arg) {
      return typeof arg === 'string' ? load(arg) : arg;
    }));
  });
}

function load(name, mthd) {
  let ret = loadModule(name);
  if (!mthd) return ret;

  let args = slice.call(arguments, 2);
  return ret.then(val => {
    let err = typeof val !== 'object' ? 'not an object'
      : (!val ? 'null object'
      : (typeof val[mthd] !== 'function' ? 'method ' + mthd + ' not found'
      : null));
    return err ? Promise.reject(Error(err)) : val[mthd].apply(val, args);
  });
}

function rdload() {
  return ready(arguments).then(function(args) {
    return load.apply(null, args);
  });
}

function prdload() {
  return ready(arguments).then(function(args) {
    let arg0 = args[0];
    let rest = slice.call(args, 1);
    let name = rest[0];
    let q = !arg0 || typeof name === 'string' && name in _modules
          ? Promise.resolve()
          : assetLoader.loadAssets(isArray(arg0) ? arg0 : [arg0], null, true);

    return q.then(function() { return load.apply(null, rest); });
  });
}

function rd() {
  let n = arguments.length, fn = arguments[n-1];
  rdall([].slice.call(arguments, 0, n-1)).then(function(args) {
    fn.apply(null, args);
  });
}

module.exports = {
  modules: _modules,
  module: peekModule,
  register,
  loadModule,
  load,
  rdload,
  prdload,
  rdall,
  rd,
};
