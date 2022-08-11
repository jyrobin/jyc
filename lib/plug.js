var klass = require('./klass')
var assign = require('./assign');
var pick = require('./pick');
var slice = Array.prototype.slice;

var Plug = klass({
  init: function (app, opts) {
    var spec = app.SPEC ? Object.assign({}, app.SPEC) : {};
    if (opts) Object.assign(spec, opts);

    this.app = app
    this.name = spec.name || app.name || null;
    this.role = spec.role || app.role || null;
    this.appType = spec.type || app.type || null;
    this.forType = spec.for || null;
    this.localDecls = spec.local || [];
    this.xbarDecls = spec.xbar || [];
    this.needs = {};
  },

  info: function () {
    var info = assign({}, this, null, ['tree', 'app']);
    var app = this.app;
    info.app = typeof app.info === 'function' ? app.info()
      : pick(app, 'name', 'role', 'SPEC');
    return info;
  },

  setTree: function(tree) {
    this.tree = tree;
    this.emitApp('join', this, tree);
  },

  _invokeApp: function(kind, event) {
    var app = this.app;
    var fn = app[kind ? kind + '_' + event : event];
    if (typeof fn === 'function') {
      return fn.apply(app, slice.call(arguments, 2));
    }
  },

  emitApp: function() {
    return this._invokeApp.apply(this, ['on'].concat(slice.call(arguments)));
  },

  askApp: function() {
    return this._invokeApp.apply(this, ['ask'].concat(slice.call(arguments)));
  },
  callApp: function() {
    return this._invokeApp.apply(this, [null].concat(slice.call(arguments)));
  },
  xemitApp: function() {
    return this._invokeApp.apply(this, ['xon'].concat(slice.call(arguments)));
  },

  xaskApp: function() {
    return this._invokeApp.apply(this, ['xask'].concat(slice.call(arguments)));
  },

  /*emitApp: function(event) {
    var app = this.app;
    //TODO may skip this to avoid accidents
    if (typeof app.emit === 'function') {
      return app.emit.apply(app, arguments);
    }

    var fn = app['on_' + event];
    if (typeof fn === 'function') {
      return fn.apply(app, slice.call(arguments, 1));
    }
  },

  askApp: function(event) {
    var app = this.app;
    var fn = app['ask_' + event];
    if (typeof fn === 'function') {
      return fn.apply(app, slice.call(arguments, 1));
    }
  },

  callApp: function(mthd) {
    var fn = typeof mthd === 'string' ? this.app[mthd] : mthd;
    if (typeof fn === 'function') {
      return fn.apply(this.app, slice.call(arguments, 1));
    }
  },
  */

  fusing0: function() {
    var me = this;
    me.localDecls.forEach(function(spec) {
      var plugs = me.tree.closestPlugs(spec, me.appType);
      if (plugs) {
        var apps = plugs.map(function (p) { return p.app });
        // maybe empty (for update later)
        me.emitApp('fusing', me, apps, spec);
      }
    });
  },

  fusing: function() {
    var me = this;
    me.localDecls.forEach(function(spec) {
      if (spec.name) {
        var plugs = me.tree.closestPlugs(spec, me.appType);
        if (plugs && plugs[0]) {
          var app = me.needs[spec.name] = plugs[0].app;
          var need = spec.need.replace(/[-\/\.]/g, '_');
          me.callApp('fusing_' + need, me, app, spec);
        }
      } else {
        var plugs = me.tree.closestPlugs(spec, me.appType);
        if (plugs) {
          var apps = plugs.map(function (p) { return p.app });
          // maybe empty (for update later)
          me.emitApp('fusing', me, apps, spec);
        }
      }
    });
  },

  unplugging: function() {
    this.emitApp('unplugging', this);
  },
  unplugged: function(ancester) {
    this.emitApp('unplugged', this);
  },
  fused: function () {
    this.emitApp('fused', this);
  },
  defusing: function () {
    this.emitApp('defusing', this);
  },
  detaching: function(ancester) {
    this.emitApp('detaching', this, ancester);
  },
  detached: function(ancester) {
    this.emitApp('detached', this, ancester);
  },

  hasRole: function(role) {
    return !!this.role && (typeof role === 'string' ?  this.role === role
      : role.indexOf(this.role) >= 0);
  },

  // TODO: gone
  /*onToken: function (token) {
    var me = this
    me.xbarDecls.forEach(function (spec) {
      if (spec.accept === token.type) {
        me.emitApp('token', me, token, spec);
      }
    });
  },
  */

  // from local context
  onPlug: function (offerPlug) {
    var me = this
    me.localDecls.forEach(function (spec) {
      if (offerPlug.appType === spec.need) {
        if (!offerPlug.forType || offerPlug.forType === me.appType) {
          me.emitApp('plug', me, offerPlug, spec);
        }
      }
    });
  },
})

module.exports = Plug;
