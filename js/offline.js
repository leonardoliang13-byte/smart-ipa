/* Offline use: registers the service worker (sw.js) and, only when asked, saves the recordings so they play
   without a connection. Saved recordings stay in this browser's storage until removed here or by clearing
   site data. */
(function (S) {
  'use strict';
  var CACHE = 'smartipa-recordings-v1';
  var supported = 'serviceWorker' in navigator && 'caches' in window && /^https?:$/.test(location.protocol);

  if (supported) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }

  // Every recording the site can play: the 121 chart sounds and the diacritic combinations.
  function urls() {
    var list = S.sounds.all.filter(function (o) { return o.audio; }).map(function (o) { return o.audio.mp3; });
    S.diacriticAudioList().forEach(function (r) { list.push(r.audio.mp3); });
    return list.filter(function (u, i, a) { return a.indexOf(u) === i; });
  }

  function status() {
    if (!supported) return Promise.resolve({ supported: false, saved: 0, total: urls().length });
    var all = urls();
    return caches.open(CACHE).then(function (c) { return c.keys(); }).then(function (keys) {
      var have = {};
      keys.forEach(function (k) { have[k.url] = true; });
      return { supported: true, saved: all.filter(function (u) { return have[new URL(u).href]; }).length, total: all.length };
    });
  }

  // Downloads the recordings a few at a time. onProgress(done, total, failed) after each one.
  function save(onProgress, only) {
    var all = only || urls(), done = 0, failed = 0, next = 0;
    return caches.open(CACHE).then(function (c) {
      var one = function () {
        if (next >= all.length) return Promise.resolve();
        var u = all[next++];
        return c.match(u).then(function (hit) {
          if (hit) return;
          return fetch(u, { mode: 'cors' }).catch(function () { return fetch(u, { mode: 'no-cors' }); }).then(function (res) {
            if (res.ok || res.type === 'opaque') return c.put(u, res);
            failed++;
          });
        }).catch(function () { failed++; }).then(function () {
          done++;
          if (onProgress) onProgress(done, all.length, failed);
          return one();
        });
      };
      return Promise.all([one(), one(), one(), one(), one(), one()]);
    }).then(function () { return { total: all.length, failed: failed }; });
  }

  function remove() { return supported ? caches.delete(CACHE) : Promise.resolve(false); }

  S.offline = { supported: supported, status: status, save: save, remove: remove, urls: urls };
})(window.SIPA = window.SIPA || {});
