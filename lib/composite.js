
module.exports = composite;

function composite(kls, spec) {
  var parts = trans(spec);
  Object.keys(parts).forEach(function(name) {
    parts[name](kls);
  });
  return kls;
}

function defAny(kls, name, field) {
  Object.defineProperty(kls, field, {
    get: function() {
      var part = this[name];
      var ret = part[field];
      return typeof ret === 'function' ? ret.bind(part) : ret;
    },
    set: function(val) {
      this[name][field] = val;
    },
  });
}

composite.trans = trans;
function trans(spec) {
  var parts = {};
  Object.keys(spec).forEach(function(name) {
    var fields = spec[name];
    if (typeof fields === 'string') fields = fields.split(',');

    if (Array.isArray(fields)) {
      parts[name] = function(kls) {
        fields.forEach(function(field) {
          defAny(kls, name, field);
        });
      };
    } else {
      parts[name] = function(kls) {
        Object.keys(fields).forEach(function(key) {
          var field = fields[key];
          if (typeof field === 'function') {
            field(kls, name, key);
          } else if (field === 'var') {
            Object.defineProperty(kls, key, {
              get: function() {
                return this[name][key];
              },
              set: function(val) {
                this[name][key] = val;
              },
            });
          } else if (field === 'get') {
            Object.defineProperty(kls, key, {
              get: function() {
                return this[name][key];
              },
            });
          } else if (field === 'fun') {
            Object.defineProperty(kls, key, {
              get: function() {
                var part = this[name];
                return part[key].bind(part);
              },
            });
          } else if (field) {
            defAny(kls, name, key);
          } else {
            Object.defineProperty(kls, key, {
              get: function() {
                throw Error('denied');
              },
              set: function(val) {
                throw Error('denied');
              },
            });
          }
        });
      };
    }
  });
  return parts;
};

