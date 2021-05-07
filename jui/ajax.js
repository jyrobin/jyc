/* global fetch */

function http(url, method, data, opts={}) {
  method = method.toUpperCase();
  opts = {
    ...opts,
    method,
    headers: {
      ...opts.headers,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };
  if (data && method !== 'GET') {
    if (typeof data === 'string') {
      opts.body = data;
    } else if (typeof data === 'object') {
      opts.body = new URLSearchParams(data);
      opts.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
  }

  return fetch(url, opts).then(res => res.text());
}

function parseJson(res) {
  return res.text().then(s => {
    if (s === 'undefined') return undefined;
    if (!s) return '';
    if (s[0] === '[' || s[0] === '{') return JSON.parse(s);
    return s;
  });
}

function ajax(url, opts={}) {
  return fetch(url, opts).then(parseJson);
}

function ajaxPost(url, data, opts={}, isPut) {
  return fetch(url, {
    ...opts,
    method: isPut ? 'PUT' : 'POST',
    headers: {
      ...opts.headers,
      'Content-Type': 'application/json', // never 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify(data),
  }).then(parseJson);
}

function ajaxPut(url, data, opts={}) {
  return ajaxPost(url, data, opts, true);
}

function ajaxGet(url, opts={}) {
  return fetch(url, {
    ...opts,
    method: 'GET',
  }).then(parseJson);
}

function ajaxDelete(url, opts={}) {
  return fetch(url, {
    ...opts,
    method: 'DELETE',
  }).then(parseJson);
}

module.exports = {
  http,
  ajax,
  ajaxPost,
  ajaxPut,
  ajaxGet,
  ajaxDelete,
};
