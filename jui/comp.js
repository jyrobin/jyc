
const dom = require('./dom');
const { get } = require('../lib/access');

module.exports = {
  applyBindings(vm, elem, events=['click', 'submit', 'enter']) {
    elem = dom.first(elem);
    if (!vm || !elem || elem._bindingsApplied) return; // hack

    elem._bindingsApplied = true;

    events.forEach(event => {
      if (event === 'enter') {
        elem.addEventListener('keyup', evt => {
          if (evt.key === 'Enter') return _invoke(event, evt);
        }, true);
      } else {
        dom.delegate(event, elem, `[data-${event}]`, evt => {
          return _invoke(event, evt);
        }, true);
      }
    });

    function _invoke(event, evt) {
      let mthd = dom.closestData(evt, event);
      let idx = mthd && mthd.lastIndexOf('.');
      if (idx > 0) {
        vm = get(vm, mthd.slice(0, idx));
        mthd = mthd.slice(idx + 1);
      }

      let fn = vm && mthd && vm[mthd];
      if (fn) return fn.call(vm, evt);
    }
  },
};

