'use strict';
/* global document, window, eval */

const utils = require('../lib/utils');
const glob = require('../lib/glob');
const isArray = Array.isArray;
const slice = Array.prototype.slice;
const filter = Array.prototype.filter;

let _turbolinks = null;

function isFn(x) {
  return typeof x === 'function';
}

const dom = {
  ready(x) {
    if (document.readyState === 'complete' || document.readyState !== 'loading') {
      return Promise.resolve(x);
    }
    return new Promise(function(resolve) {
      document.addEventListener('DOMContentLoaded', function() { resolve(x); });
    });
  },

  filter(x, fn, me) { return x ? filter.call(x, fn, me) : []; },
  each: utils.each,

  attrSelector(prefix, attr, str) {
    prefix = prefix || '';
    return str ? `${prefix}[${attr}="${str}"]` : `${prefix}[${attr}]`;
  },
  dataSelector(prefix, name, str) {
    return dom.attrSelector(prefix, `data-${name}`, str);
  },

  closest(elev, selector) {
    let elem = elev.target || elev; // elev can be event

    if (isFn(elem.closest)) return elem.closest(selector);

    let matchesSelector = elem.matches || elem.webkitMatchesSelector ||
      elem.mozMatchesSelector || elem.msMatchesSelector;
    while (elem) {
      if (matchesSelector.call(elem, selector)) {
        return elem;
      } else {
        elem = elem.parentElement;
      }
    }
    return null;
  },

  closestDataElement(elev, prefix, name, value) {
    if (elev && name) return dom.closest(elev, dom.dataSelector(prefix, name, value));
  },

  find(elem, selector, fn) {
    let selFn = isFn(selector);
    if (!selector || selFn) {
      fn = selFn ? selector : fn;
      selector = elem;
      elem = document;
    }

    if (typeof elem === 'string') {
      elem = dom.find(elem)[0];
    }

    if (!elem) return [];

    let ret;
    if (!selector) {
      ret = [elem];
    } else if (typeof selector !== 'string') {
      ret = [selector];
    // REF: http://ryanmorr.com/abstract-away-the-performance-faults-of-queryselectorall/
    } else {
      if (/^(#?[\w-]+|\.[\w-.]+)$/.test(selector)) {
        let ch = selector.charAt(0);
        if (ch === '#') {
          let found = document.getElementById(selector.substr(1));
          ret = found ? [found] : [];
        } else if (ch === '.') {
          let classes = selector.substr(1).replace(/\./g, ' ');
          ret = slice.call(elem.getElementsByClassName(classes));
        } else {
          ret = slice.call(elem.getElementsByTagName(selector));
        }
      } else {
        ret = slice.call(elem.querySelectorAll(selector));
      }
      if (typeof elem.matches === 'function' && elem.matches(selector)) ret.unshift(elem);
    }

    if (ret.length && isFn(fn)) ret.forEach(fn); 

    return ret;
  },

  first(elem, selector, fn) {
    let selFn = isFn(selector);
    let ret = dom.find(elem, selFn ? null : selector)[0];
    if (ret && isFn(fn = selFn ? selector : fn)) fn(ret);
    return ret;
  },

  findDataElements(elev, prefix, name, str, fn) {
    let elem = elev && elev.target || elev;
    if (typeof str === 'function') {
      fn = str;
      str = '';
    }
    return elem && name ? dom.find(elem, dom.dataSelector(prefix, name, str), fn) : [];
  },
  firstDataElement(elev, prefix, name, str, fn) {
    return dom.findDataElements(elev, prefix, name, str, fn)[0];
  },

  firstData(elev, prefix, name) {
    let elem = dom.firstDataElement(elev, prefix, name);
    return dom.data(elem, name);
  },

  closestAttr(elev, name, val) {
    if (elev && name) {
      let sel = val ? name + '="' + val + '"' : name;
      let elem = dom.closest(elev, '[' + sel + ']');
      return dom.attr(elem, name);
    }
  },

  attr(elem, selector, name) {
    let len = arguments.length;
    let el = len < 3 ? dom.first(elem) : dom.first(elem, selector);
    if (el) {
      name = len < 3 ? selector : name;
      if (name && el.hasAttribute(name)) return el.getAttribute(name) || '';
    }
  },

  text(elem, selector, field, newVal) {
    let el = dom.first(elem, selector);
    if (el && field in el) {
      let ret = el[field];
      if (typeof newVal === 'string') el[field] = newVal; 
      return ret || '';
    }
  },
  html(elem, selector, newVal) {
    return dom.text(elem, selector, 'innerHTML', newVal);
  },
  val(elem, selector, newVal) {
    return dom.text(elem, selector, 'value', newVal);
  },
  dataElementText(elem, prefix, name, field, newVal) {
    return dom.text(elem, dom.dataSelector(prefix, name), field, newVal);
  },

  toElement(htmlString) {
    let div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild; 
  },

  traverseForm(form, fn, all) {
    if (typeof form !== 'object' || form.nodeName !== 'FORM') return;

    utils.each(form.elements, function(field) {
      let b = false, selected;
      if (field.name) {
        if (all) {
          b = isArray(all) ? all.indexOf(field.nodeName.toLowerCase()) >= 0 : true;
        } else if (!field.disabled && field.type !== 'file'
          && field.type !== 'reset' && field.type !== 'submit' && field.type !== 'button')
        {
          if (field.type === 'select-multiple') {
            b = true;
            selected = filter
              .call(field.options, function(option) { return option.selected; })
              .map(function(option) { return option.value; });
          } else if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
            b = true;
          }
        }
      }
      if (b) fn(field.name, selected || field.value, field);
    });
  },

  formData(form) {
    let s = [];
    dom.traverseForm(form, function(name, value) {
      name = encodeURIComponent(name) ;
      if (isArray(value)) {
        value.forEach(function(val) {
          s[s.length] = name + "=" + encodeURIComponent(val);
        });
      } else {
        s[s.length] = name + "=" + encodeURIComponent(value);
      }
    });
    return s.join('&').replace(/%20/g, '+');
  },
  formJson(form) {
    let ret = {};
    dom.traverseForm(form, function(name, value) { ret[name] = value; });
    if (arguments.length > 1) {
      let all = ret, ret = {};
      let args = isArray(arguments[1]) ? arguments[1] : slice.call(arguments, 1);
      args.forEach(function(arg) {
        if (arg in all) ret[arg] = all[arg];
      });
    }
    return ret;
  },

  isEmptyElement(elem) {
    return dom.isElement(elem) && elem.children.length === 0;
  },
  isElement(elem) {
    return !!(elem && typeof elem === 'object' && elem.nodeName && elem.nodeType === 1);
  },
  elem(elemId) {
    return document.getElementById(elemId);
  },

  insertBefore(elem, ref) {
    let pn = elem && ref && ref.parentNode;
    if (pn) return pn.insertBefore(elem, ref);
  },

  insertAfter(elem, ref) {
    let pn = elem && ref && ref.parentNode;
    if (pn) return pn.insertBefore(elem, ref.nextSibling);
  },

  replaceCss(elem, pat, cls) {
    if (elem = dom.first(elem)) {
      dom.removeCss(elem, pat);
      let css = elem.classList;
      isArray(cls) ? css.add.apply(css, cls) : (cls && css.add(cls));
    }
  },
  removeCss(elem, pats) {
    if (elem = dom.first(elem)) {
      let css = elem.classList;
      (isArray(pats) ? pats : [pats]).forEach(function(pat) {
        pat = glob(pat);
        css.forEach(function(cls) {
          pat.test(cls) && css.remove(cls);
        });
      });
    }
  },

  toggleCss(elem, classA, classB, b) {
    if (elem = dom.first(elem)) {
      classA = utils.toArray(classA);
      classB = classB && utils.toArray(classB);
      let css = elem.classList;
      let chooseA = b || (b !== undefined ? false
        : (classB && classB[0] ? css.contains(classB[0])
        : !css.contains(classA[0]))); 
      if (chooseA) {
        classB && css.remove.apply(css, classB);
        css.add.apply(css, classA);
      } else {
        css.remove.apply(css, classA);
        classB && css.add.apply(css, classB);
      }
    }
  },

  on(evt, elem, selector, fn, opts) {
    if (!elem) return;

    let elems;
    if (isFn(selector)) {
      opts = fn;
      fn = selector;
      elems = dom.find(elem);
    } else {
      elems = dom.find(elem, selector);
    }
    opts = opts || {};
    let fn2 = opts.noPrevent ? fn : function(e) {
      e.preventDefault();
      opts.stopProp && e.stopPropagation();
      return fn.call(this, e);
    };
    elems.forEach(function(el) {
      el.addEventListener(evt, fn2.bind(el), false);
    });
    return dom;
  },

  delegate(evt, elem, selector, fn, stopProp, childOnly) {
    elem = dom.first(elem);
    let stop = childOnly ? elem : elem.parentNode;
    elem.addEventListener(evt, function(e) {
      let triggered = false;
      for (let target=e.target; target && target!==stop; target=target.parentNode) {
        if (typeof target.matches === 'function' && target.matches(selector)) {
          triggered || e.preventDefault();
          triggered = true;
          if (fn.call(target, e) === true && stopProp) {
            e.stopPropagation();
            break;
          }
        }
      }
    }, false);

    return dom;
  },

  data(elev, name) {
    let elem = elev && elev.target || elev;
    return name && elem && elem.dataset[name] || undefined;
  },
  closestData(elev, name) {
    if (elev && name) {
      let isArr = isArray(name), elem;
      if (isArr || arguments.length > 2) {
        let arr = isArr ? name : slice.call(arguments, 1);
        let ret = {};
        arr.forEach(function(nm) {
          let elem = dom.closest(elev, '[data-' + nm + ']');
          let val = elem && dom.data(elem, nm);
          if (val) ret[nm] = val;
        });
        return ret;
      } else {
        elem = dom.closest(elev, '[data-' + name + ']');
        return dom.data(elem, name);
      }
    }
  },

  // turbolinks
  setTurbolinks(turbolinks) {
    _turbolinks = turbolinks;
  },

  relPath(url, s) {
    if (arguments.length === 1) {
      s = url;
      url = window.location.pathname;
    }
    return url[url.length-1] === '/' ? url + s : url + '/' + s;
  },

  visit(url, opts) {
    if (_turbolinks) {
      if (url && typeof url === 'object') {
        opts = url;
        url = null;
      }
      if (url && typeof url === 'string') {
        _turbolinks.visit(url, opts);
      } else {
        url = window.location.pathname;
        _turbolinks.visit(url, opts || { replace: true });
      }
    } else if (typeof url === 'string') {
      window.location = url;
    } else {
      window.location.reload();
    }
  },

  replaceWithTurbolinks(html) {
    if (_turbolinks && html) {
      let s = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];
      document.body.innerHTML = s;
      _turbolinks.dispatch('turbolinks:load');
      let arr = document.body.getElementsByTagName('script');
      for (let i=0; i<arr.length; i++) {
        eval(arr[i].innerHTML);
      }
    }
  },
};

module.exports = dom;
