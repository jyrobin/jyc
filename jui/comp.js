
const dom = require('./dom');
const { Env, isArray } = require('../lib');
const { get } = require('../lib/access');

const comp = {
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

  applyRules(vm, elem, evt, dataSet, ruleSets) {
    let env = Env(null, {
      vm, elem, evt, dataSet,
      curElem: evt && evt.target || elem,
    });
    ruleSets.forEach(ruleSet => evalRules(env, ruleSet));
  },

  compRules: {
    renderValue(sel, key, field="value") {
      return function(env) {
        let el = env.values.curElem;
        if (sel) el = jui.first(el, sel);
        if (el) {
            if (typeof key === 'function') {
              key(env, el);
            } else if (key) {
              let data = getData(env, key);
              if (data != null) {
                el[field] = String(data);
              }
            }
            return env;
        }
        throw Error('fail');
      };
    },

    hasClosestData(dataName, key) {
      return function(env) {
        let val = key ? getData(env, key) : null;
        if (!key || val) {
          let el = jui.closestDataElement(env.values.curElem, null, dataName, val);
          if (el) return env;
        }

        throw Error('fail');
      };
    },

    hasElemData(dataName, key) {
      return function(env) {
        let el = env.values.curElem;
        if (dataName in el.dataset) {
          if (!key || jui.data(el, dataName) === getData(env, key)) {
            return env;
          }
        }

        throw Error('fail');
      };
    },

    toClosestDataElem(dataName, key) {
      return function(env) {
        let val = key ? getData(env, key) : null;
        if (!key || val) {
          let el = jui.closestDataElement(env.values.curElem, null, dataName, val);
          if (el) return env.push({ curElem: el });
        }

        throw Error('fail');
      };
    },
    toBaseElem() {
      return function(env) {
        return env.push({ curElem: env.elem });
      }
    },
    toTargetElem() {
      return function(env) {
        return env.push({ curElem: env.evt.target }); // can throw
      }
    },

    toElem(sel) {
      return function(env) {
        let el = jui.first(env.values.curElem, sel);
        if (el) return env.push({ curElem: el });

        throw Error('fail');
      }
    },
    toDataElem(dataName, key) {
      return function(env) {
        let val = key ? getData(env, key) : null;
        if (!key || val) {
          let el = jui.firstDataElement(env.values.curElem, null, dataName, val);
          if (el) return env.push({ curElem: el });
        }

        throw Error(`fail toDataElem ${dataName} ${key} ` + env.values + " " + el);
      }
    },
  },
};

function getData(env, key) {
  if (key && key[0] == '$') {
    return env.values.dataSet[key.slice(1)];
  } else {
    return key;
  }
}

function evalRules(env, ruleSet) {
  try {
    let curEnv = env;
    for (let i=0, n=ruleSet.length; i<n && curEnv; i++) {
      let rule = ruleSet[i];
      if (isArray(rule)) {
        curEnv = evalRules(curEnv, rule);
      } else if (typeof rule === 'function') {
        curEnv = rule(curEnv);
      } else {
        throw Error('Unknown rule');
      }
    }
    return curEnv;
  } catch(ex) {
    console.error(ex);
  }
}

module.exports = comp;
