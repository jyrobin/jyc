
var toString = Object.prototype.toString;
var CH = '[\\w-_\.]';
var CHSTAR = CH + '*';

function glob(pat) {
  if (toString.call(pat) === '[object RegExp]') return pat;

  pat = pat.replace(/\?/g, CH);
  pat = pat.replace(/\*/g, CHSTAR);
  return RegExp('^' + pat + '$');
}

glob.match = function(s, pat) {
  return s.match(glob(pat));
};
glob.test = function(pat, s) {
  return glob(pat).test(s);
};

module.exports = glob;
