var klass = require('./klass');
var assert = require('./assert');
var NamedList = require('./named-list');
var Plug = require('./plug')
var Env = require('./env');

var DEBUG = true;

var Tree = klass({
  values: null,
  locals: null,
  root: null,

  Namespace: function(name) {
    if (name in this) throw Error(name + ' exists');

    var derived = this.subclass();
    Object.defineProperty(derived, name, {
      get: function() { return this.namespace(name); }
    });
    return derived;
  },

  init: function(parent, name, opts) {
    assert(!parent || parent.root , 'parent missing root');
    assert(!parent || name, 'missing name');

    this.parent = parent || null
    this.root = parent ? parent.root : this;
    this.name = name || '';
    this.path = parent ? parent.path.concat([name]) : [];

    this.values = parent ? Object.create(parent.values) : {};
    this.locals = opts ? Object.assign({}, opts) : {};
    if (opts) Object.assign(this.values, this.locals);

    this._ns = {}; 
    this._trees = NamedList.instance({ key: 'name', nullKey: false });
    this._plugs = NamedList.instance({ key: 'name', nullKey: true });
    this._fused = false;
  },

  namespace: function(name) {
    return this._ns[name] || (this._ns[name] = !this.parent ? {}
      : Object.create(this.parent.namespace(name)));
  },
  isRoot: function() {
    return this.root === this;
  },
  isDetached: function() {
    return !this.parent && this.root !== this;
  },

  isFused: function() {
    return this._fused;
  },

  children: function() {
    return this._trees.items;
  },

  child: function(name) {
    return this._trees.get(name);
  },

  childAt: function(idx) {
    return this._trees.getAt(idx);
  },

  addChild: function(name, opts) {
    assert(name && !this.child(name), 'child exists');
    var child = this.klass.instance(this, name, opts);
    this._trees.add(child);
    return child;
  },

  removeChild: function(name) {
    var old = this.child(name);
    if (old) {
      old.callPlugPreOrder('detaching', [this]);
      old.parent = null;
      this._trees.remove(old);
      old.callPlugPreOrder('detached', [this]);
    }
    return old;
  },

  replaceChild: function(name, opts) {
    assert(name, 'missing name');

    var child = this.klass.instance(this, name, opts);
    var old = this.child(name);
    if (old) {
      old.callPlugPreOrder('detaching', [this]);
      old.parent = null;
      this._trees.add(child, true);
      old.callPlugPreOrder('detached', [this]);
    } else {
      this._trees.add(child);
    }
    return child;
  },

  set: function(opts) {
    if (opts) {
      Object.assign(this.locals, opts);
      Object.assign(this.values, opts);
    }
    return this;
  },

  get: function(name) {
    return this.locals[name];
  },

  lookup: function(name) {
    return this.values[name];
  },

  // tree is essential for uvw app building
  isDev: function() {
    return this.values.NODE_ENV !== 'production';
  },

  join: function(app, spec) {
    return this.plugIn(Plug.instance(app, spec));
  },

  unplug: function(name) { //TODO: unnamed
    var plug = this.plug(name);
    if (plug) {
      plug.unplugging();
      this._plugs.remove(name);
      plug.unplugged();
    }
  },

  plugIn: function(plug) {
    if (this._plugs.has(plug)) return plug;

    plug.setTree(this);
    this._plugs.add(plug);

    if (this._fused) this._insertPlug(plug);
    return plug;
  },

  plugs: function(role) {
    var plugs = this._plugs.items;
    if (plugs.length === 0 || !role) return plugs;
    var fn = typeof role === 'function' ? role : function(p) { return p.hasRole(role); };
    return plugs.filter(fn);
  },

  plug: function(name) {
    return this._plugs.get(name);
  },

  plugApp: function(name) {
    var plug = this._plugs.get(name);
    return plug && plug.app;
  },

  collectPlugs: function(role, arr) {
    return collectPlugs(this, role, arr || []);
  },
  collectPlugMap: function(role, map, skip) {
    return collectPlugMap(this, role, map || {}, skip || false);
  },

  closestPlugs: function(spec, appType) {
    var plugs = this._plugs.filter(function(p) {
      return p.forType !== 'none' && p.appType === spec.need
    })

    if (plugs.length && appType) {
      var specifics = plugs.filter(function(p) {
        return p.forType === appType
      })
      plugs = specifics.length ? specifics : plugs.filter(function(p) { return !p.forType })
    }

    return plugs.length ? plugs : (this.parent && this.parent.closestPlugs(spec, appType))
  },

  fuse: function() {
    if (!this._fused) {
      // all plugs in place, start fulfilling needs
      this.callPlugPreOrder('fusing', []);

      this._fused = true;

      this.callPlugPreOrder('fused', []); // synchronous, each plug expects others fused

      var es = this._fusedEvents;
      if (es) {
        this._fusedEvents = null;
        es.forEach(function(arr) {
          this.emitPreOrder(arr[0], arr[1], arr[2]);
        }.bind(this));
      }
    }
    return this;
  },

  defuse: function() {
    if (this._fused) {
      this.callPlugPreOrder('defusing', []);
      this._fused = false;
    }
    return this;
  },

  //TODO: gone
  //pushToken: function(token) {
  //  this.root.callPlugPreOrder('onToken', [token]);
  //},

  _insertPlug: function(newPlug) {
    newPlug.fusing(); // note that newPlug see tree._fused true
    newPlug.fused();
    //this.callPlugPreOrder('onPlug', [newPlug]);
  },

  env: function(opts) {
    return Env(this, opts);
  },

  callPlugPreOrder: function(func, args, role) {
    try {
      callPlugPreOrder(this, func, args, role);
    } catch(ex) {
      if (DEBUG) console.error(ex);
      throw ex;
    }
  },

  emitAfterFused: function(event, args, role) {
    if (this._fused) {
      this.emitPreOrder(event, args, role);
    } else {
      var es = this._fusedEvents || (this._fusedEvents = []);
      es.push([event, args, role]);
    }
  },

  emitPreOrder: function(event, args, role, xemit) {
    args = args ? [event].concat(args) : [event];
    this.callPlugPreOrder(xemit ? 'xemitApp' : 'emitApp', args, role);
  },
  xemitPreOrder: function(event, args, role) {
    return this.emitPreOrder(event, args, role, true);
  },

  callAppPreOrder: function(mthd, args, role) {
    args = args ? [mthd].concat(args) : [mthd];
    this.callPlugPreOrder('callApp', args, role);
  },

  askPreOrder: function(event, args, role, xask) {
    try {
      args = args ? [event].concat(args) : [event];
      return askPlugPreOrder(this, xask ? 'xaskApp' : 'askApp', args, role);
    } catch(ex) {
      if (DEBUG) console.error(ex);
      throw ex;
    }
  },
  xaskPreOrder: function(event, args, role) {
    return this.askPreOrder(event, args, role, true);
  },

  // NOTE: collect non-null results in array rets if rets is given
  //  - bypass plug, plug.app may not hav func
  callPreOrder: function(func, args, role, rets, noSkip) {
    try {
      callPreOrder(this, func, args, role, rets, noSkip);
      return rets;
    } catch(ex) {
      if (DEBUG) console.error(ex);
      throw ex;
    }
  },
  callPreOrderWaiting: function(func, args, role, noSkip) {
    try {
      var rets = [];
      callPreOrder(this, func, args, role, rets, noSkip);
      return Promise.all(rets);
    } catch(ex) {
      if (DEBUG) console.error(ex);
      throw ex;
    }
  },
  callEach: function(func, args, role, rets, noSkip) {
    try {
      callEach(this, func, args, role, rets, noSkip);
    } catch(ex) {
      if (DEBUG) console.error(ex);
      throw ex;
    }
  },
  callChildren: function(func, args, role, rets, noSkip) {
    this.children().forEach(function(ch) {
      callEach(ch, func, args, role, rets, noSkip);
    });
  },
});

// plug must have mthd (the plug contract)
function callPlugPreOrder(tree, mthd, args, role) {
  tree.plugs(role).forEach(function(plug) {
    plug[mthd].apply(plug, args);
  });
  tree.children().forEach(function(child) {
    callPlugPreOrder(child, mthd, args, role);
  });
}

// plug must have mthd
function askPlugPreOrder(tree, mthd, args, role, rets) {
  rets = rets || [];
  var plugs = tree.plugs(role);
  var ret, i, n;
  for (i=0, n=plugs.length; i<n; i++) {
    ret = plugs[i][mthd].apply(plugs[i], args);
    if (ret != null) rets.push(ret);
  }

  var children = tree.children();
  for (i=0, n=children.length; i<n; i++) {
    askPlugPreOrder(children[i], mthd, args, role, rets);
    if (ret != null) rets.push(ret);
  }
  return rets;
}

function callEach(tree, func, args, role, rets, noSkip) {
  args = args || [];
  tree.plugs(role).forEach(function(plug) {
    var fn = typeof func === 'string' ? plug.app[func] : func;
    if (!noSkip && typeof fn !== 'function') return;
    var ret = fn.apply(plug.app, args);
    if (rets && ret != null) rets.push(ret);
  });
}

function callPreOrder(tree, func, args, role, rets, noSkip) {
  args = args || [];

  callEach(tree, func, args, role, rets, noSkip);

  tree.children().forEach(function(ch) {
    callPreOrder(ch, func, args, role, rets, noSkip);
  });
}

function collectPlugs(tree, role, arr) {
  tree.plugs(role).forEach(function(plug) { arr.push(plug); });
  tree.children().forEach(function(ch) {
    collectPlugs(ch, role, arr);
  });
  return arr;
}
function collectPlugMap(tree, role, map, skip) {
  tree.plugs(role).forEach(function(plug) {
    if (!skip && map[plug.name]) throw Error('plug ' + plug.name + ' exists');
    map[plug.name] = plug;
  });

  tree.children().forEach(function(ch) {
    collectPlugMap(ch, role, map, skip);
  });
  return map;
}

module.exports = Tree;
