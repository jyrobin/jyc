
module.exports = function(obj, arg) {
  Object.getOwnPropertyNames(arg).forEach(function(prop) {
    var desc = Object.getOwnPropertyDescriptor(arg, prop);
    Object.defineProperty(obj, prop, desc);
  });
  return obj;
};

