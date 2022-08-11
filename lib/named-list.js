var assign = require('./assign');
var pick = require('./pick');
var map = require('./map');
var matcher = require('./match').matcher;
var findIndex = require('./utils').findIndex;
var arrayLike = require('./utils').arrayLike;

//TODO: don't return this
// array of objects with null or unique-key field and filtering utilities
var NamedList = {

  //INCR_ATTR: function incrAttr(key, old, item) {},

  instance: function(opts, keyName) {
    return Object.create(NamedList).init(opts, keyName);
  },

  init: function(opts, keyName) {
    if (typeof opts === 'string') {
      opts = { key: opts };
    } else if (Array.isArray(opts)) {
      opts = { items: opts, key: keyName }
    } else {
      opts = opts || {};
    }

    this._isNamedList = pick(opts, 'key', 'nullKey'); // for meta checking
    this.allowNullKey = !!opts.nullKey; // default false
    this.keyName = opts.key || 'name';
    this.factory = opts.factory;
    this.items = [];
    this.itemMap = {};
    this.reset(opts.items);
    return this;
  },

  reset: function(items) {
    this.items.length = 0;
    this.itemMap = {};
    if (Array.isArray(items)) {
      for (var i=0; i<items.length; i++) {
        this.add(items[i]);
      }
    }
  },
  get: function(key) {
    if (key != null) return this.itemMap[key];
  },
  obtain: function(key, promote) {
    if (key == null) return;
    var item = this.itemMap[key];
    if (item) {
      if (promote && this.items[0] !== item) {
        var idx = this.items.indexOf(item);
        this.items.splice(idx, 1);
        this.items.unshift(item);
      }
    } else {
      item = this.factory ? this.factory() : {};
      item[this.keyName] = key;
      this.itemMap[key] = item;
      if (promote) {
        this.items.unshift(item);
      } else {
        this.items.push(item);
      }
    }
    return item;
  },
  getAt: function(idx) {
    return this.items[idx];
  },
  update: function(key, data, fields) {
    return assign(this.get(key), data, fields, this.keyName);
  },
  updateAt: function(idx, data, fields) {
    return assign(this.items[idx], data, fields, this.keyName);
  },

  add: function(item, replace) {
    if (!item) return this;

    var key = item[this.keyName];
    if (key != null) {
      if (this.itemMap[key]) {
        if (!replace) throw Error('item ' + key + ' exists');

        var idx = findIndex(this.items, this.keyName, key);
        this.items[idx] = item;
      } else {
        this.items.push(item);
      }
      this.itemMap[key] = item;
    } else if (this.allowNullKey) {
      this.items.push(item);
    }
    return this;
  },

  // to match ordinary map
  set: function(key, item, idx) {
    if (typeof key === 'string') {
      if (item[this.keyName] !== key) throw Error('key ' + key + ' mismatch');
    } else {
      idx = item;
      item = key;
    }

    this.add(item, true);
    if (idx >= 0) this.move(item, idx);
    return this;
  },
  setAll: function(items, fn) { // falsy fn - overwrite
    var me = this, isFn = typeof fn === 'function';
    items.forEach(function(it) {
      var key = it[me.keyName];
      if (key) {
        var old = me.get(key);
        if (isFn) {
          var obj = fn(key, old, it);
          if (obj) me.set(obj);
        } else if (!fn) {
          me.add(it, true);
        }
      }
    });
  },
  remove: function(item) {
    var key = typeof item === 'string' ? item : (item && item[this.keyName]);

    if (key != null) {
      if (this.itemMap[key]) {
        var idx = findIndex(this.items, this.keyName, key);
        this.items.splice(idx, 1);
        delete this.itemMap[key];
      }
    } else if (item && this.allowNullKey) {
      for (var i=this.items.length; i>= 0; i--) {
        if (this.items[i] === item) this.items.splice(i, 1);
      }
    }
    return this;
  },

  del: function(key) {
    return this.remove(key);
  },

  removeAll: function(keys) {
    var map = this.itemMap, keyName = this.keyName;
    keys.forEach(function(key) { delete map[key]; });
    this.items = this.items.filter(function(it) {
      return !(keyName in it) || map[it[keyName]];
    });
    return this;
  },

  pop: function() {
    var last = this.items.pop();
    if (last && this.keyName in last) {
      delete this.itemMap[last[this.keyName]];
    }
    return last;
  },

  truncate: function(limit) {
    var len = this.items.length;
    if (len <= limit) return;

    var map = this.itemMap, keyName = this.keyName;
    this.items.forEach(function(it) {
      if (keyName in it) delete map[it[keyName]];
    });
    this.items.length = limit;
    return this;
  },

  retainAll: function(keys) {
    var map = this.itemMap;
    var delKeys = keys.filter(function(key) { return !map[key]; });
    this.removeAll(delKeys);
    return this;
  },

  rename: function(oldKey, newKey) {
    if (typeof oldKey !== 'string' || typeof newKey !== 'string') return false;

    var old = this.get(oldKey);
    if (!old) return false;

    if (oldKey === newKey) return true;

    if (this.itemMap[newKey]) return false; 

    old[this.keyName] = newKey;
    delete this.itemMap[oldKey];
    this.itemMap[newKey] = old;
    return true;
  },

  size: function() {
    return this.items.length;
  },

  isEmpty: function() {
    return this.items.length === 0;
  },

  indexOf: function(item) {
    return item ? this.items.indexOf(item) : -1;
  },

  has: function(item) {
    return typeof item === 'string' ? item in this.itemMap : this.indexOf(item) >= 0;
  },

  move: function(item, idx) {
    idx = Math.floor(idx);
    if (!isFinite(idx)) return -1;

    var items = this.items, len = items.length;
    if (len === 0) return -1;

    if (typeof item === 'string') item = this.itemMap[item];
    if (!item) return -1;

    var old = this.indexOf(item);
    if (old < 0) return -1;

    if (idx < 0) idx = len + idx;
    idx = idx < 0 ? 0 : (idx >= len ? len - 1 : idx);
    if (old === idx) return idx;

    var tmp = items[idx];
    items[idx] = item;
    items[old] = tmp;
    return idx;
  },

  keys: function() {
    return Object.keys(this.itemMap);
  },
  values: function() {
    return this.items;
  },
  each: function(fn, me) {
    this.items.forEach(fn, me);
  },
  map: function(fn, me, filter) {
    return map(this.items, fn, me, filter);
  },

  filter: function(opts, me) {
    if (!opts) return this.items;

    var fn = typeof opts === 'function' ? opts : matcher(opts);
    return this.items.filter(fn, me === undefined ? this : me);
  },

  first: function(opts, me) {
    if (!opts) return this.items[0];

    var fn = typeof opts === 'function' ? opts : matcher(opts);
    return this.items.find(fn, me === undefined ? this : me);
  },

  exclude: function(items) {
    if (items.length === 0) return this.items.concat();

    var its = this.items, kn = this.keyName;
    return typeof items[0] === 'string'
      ? its.filter(function(key) { return items.indexOf(key) < 0; })
      : its.filter(function(it) { return findIndex(items, kn, it[kn]) < 0; });
  },
  interset: function(items, inverse) {
    var me = this, kn = this.keyName;
    return items.filter(function(it) {
      var key = typeof it === 'string' ? it : it[kn];
      return me.get(key) ? !inverse : inverse;
    });
  },
  union: function(items) {
    return this.items.concat(this.interset(items, true));
  },

  obtainAttr: function(name, attr, factory) {
    var ret, item = factory ? this.obtain(name) : this.get(name);
    if (item) {
      if (attr in item) {
        ret = item[attr];
      } else if (factory) {
        ret = item[attr] = factory() || {};
      }
    }
    return ret;
  },

  getAttr: function(name, attr) {
    var obj = this.get(name);
    return obj && obj[attr];
  },
  listAttr: function(name, attr, opts) {
    return this.obtainAttr(name, attr, NamedList.instance.bind(null, opts));
  },
  listAttrGet: function(name, attr, key) { 
    var item = this.get(name);
    return item && item[attr] && item[attr].get(key);
  },
  setAttr: function(name, attr) {
    return this.obtainAttr(name, attr, newSet);
  },
  mapAttr: function(name, attr) {
    return this.obtainAttr(name, attr, newMap);
  },
  arrayAttr: function(name, attr) {
    return this.obtainAttr(name, attr, newArray);
  },
  arrayAttrMerge: function(name, attr, objs) {
    var arr = this.arrayAttr(name, attr);
    if (arrayLike(objs)) {
      for (var i=0, n=objs.length; i<n; i++) {
        if (arr.indexOf(objs[i]) < 0) arr.push(objs[i]);
      }
    } else if (objs !== undefined) {
      if (arr.indexOf(objs) < 0) arr.push(objs);
    }
    return arr;
  },
};

function newSet() { return new Set(); }
function newMap() { return new Map(); }
function newArray() { return []; }

module.exports = NamedList;
