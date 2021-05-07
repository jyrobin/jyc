'use strict';
/* global document, window */

function loadAsset (asset, varName, checkHeader) {
  if (varName && typeof window[varName] !== 'undefined') {
    return Promise.resolve(window[varName]);
  }

  if (typeof asset === 'string') {
    if (/\.css$/.test(asset)) {
      asset = { src: asset, type: 'css' };
    } else {
      asset = { src: asset };
    }
  }

  let isCss = asset.type === 'css';

  if (checkHeader && asset.src) {
    let tname = isCss ? 'link' : 'script'; 
    let attr = isCss ? 'href' : 'src';
    let head = document.getElementsByTagName('head')[0];
    let elems = head.getElementsByTagName(tname);
    for (let i=0; i<elems.length; i++) {
      if (elems[i].getAttribute(attr) === asset.src) {
        return Promise.resolve(!isCss && varName ? window[varName] : undefined);
      }
    }
  }

  let tag;
  if (isCss) {
    tag = document.createElement('link');
    tag.setAttribute('rel', 'stylesheet');
    tag.setAttribute('href', asset.src);
  } else {
    tag = document.createElement('script');
    tag.setAttribute('type', 'text/javascript');
    tag.setAttribute('src', asset.src);
  }

  return new Promise(function (resolve) {
    tag.async = true;
    tag.onreadystatechange = tag.onload = function () {
      let state = tag.readyState;
      if (!state || /loaded|complete/.test(state)) {
        resolve(varName ? window[varName] : undefined);
      }
    };
    document.getElementsByTagName('head')[0].appendChild(tag);
  });
}

function loadAssets (assets, varName, checkHeader) {
  if (varName && typeof window[varName] !== 'undefined') {
    return Promise.resolve(window[varName]);
  }

  function loadIt (previous, assets, i) {
    return previous.then(function () {
      return loadAsset(assets[i], null, checkHeader);
    });
  }

  let previous = Promise.resolve();
  for (let i = 0; i < assets.length; i++) {
    previous = loadIt(previous, assets, i);
  }

  return !varName ? previous : previous.then(function () {
    return window[varName];
  });
}

exports.loadAsset = loadAsset;
exports.loadAssets = loadAssets;
