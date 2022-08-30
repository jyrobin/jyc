
module.exports = function assert(b, msg) {
  if (b) return;
  if (arguments.length === 1) throw Error('ERROR');
  if (arguments.length === 2) throw Error(msg);
  throw Error([].slice.call(arguments, 1).join(' '));
};
