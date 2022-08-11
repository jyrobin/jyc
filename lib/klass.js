
var mixin = require('./mixin');
var composite = require('./composite');
var forEach = Array.prototype.forEach;

module.exports = function() {
  var klass = {
    subclass: subclass,
    asclass: asclass,
    subobject: subobject,
    parts: parts,
  };

  forEach.call(arguments, function(arg, idx) {
    var isFn = typeof arg === 'function';
    if (idx === 0) {
      klass = Object.assign(Object.create(isFn ? arg.prototype : arg), klass);
      if (isFn && !klass.init) {
        klass.init = function() {
          return arg.apply(this, arguments); // not for es6 class
        };
      }
    } else {
      klass = mixin(klass, isFn ? arg.prototype : arg);
    }
  });

  klass.instance = instance.bind(klass);
  Object.defineProperty(klass, 'klass', {
    value: klass,
    writable: false
  });

  return klass;
};

function asclass() {
  if (arguments.length > 0) { // shorthand of subclass(...).asclass()
    return subclass.apply(this, arguments).asclass();
  }

  var cls = this.__class; // this is klass
  if (!cls) {
    cls = this.__class = function() {
      return instance.apply(this, arguments);
    }.bind(this);
    cls.prototype = this;
    cls.prototype.constructor = cls; 
  }
  return cls;
}

function subclass() {
  var derived = Object.create(this); // this is klass, so is derived
  for (var i=0, n=arguments.length; i<n; i++) {
    mixin(derived, arguments[i]);
  }

  derived.instance = instance.bind(derived);
  Object.defineProperty(derived, 'klass', {
    value: derived,
    writable: false
  });
  Object.defineProperty(derived, 'superclass', {
    value: this,
    writable: false
  });
  return derived;
}

function instance() {
  var obj = Object.create(this); // this is klass
  return this.init && this.init.apply(obj, arguments) || obj;
}

// extend directly from a klass or an instance and use as an instance, bypassing init()
function subobject() {
  var obj = Object.create(this); // this is klass or instance
  for (var i=0, n=arguments.length; i<n; i++) {
    mixin(obj, arguments[i]);
  }
  return obj;
}

function parts(spec) {
  return typeof spec === 'function' ? spec(this) : composite(this, spec);
}
