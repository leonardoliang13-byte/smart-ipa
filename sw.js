/* Offline support for SmartIPA.
   - The site's own files: network first, so updates show at once; the saved copy is used when offline.
   - Fonts (Geist, Charis SIL) and the Phosphor icon font: saved the first time they load.
   - Recordings from Wikimedia Commons: served from the saved copy only if the person chose
     "Save recordings for offline" on the Credits page (see js/offline.js); otherwise passed straight through.
   Nothing here records what anyone does. */
var SHELL = 'smartipa-shell-v2';
var FONTS = 'smartipa-fonts-v2';
var RECORDINGS = 'smartipa-recordings-v1';
var FILES = [
  './', 'index.html', 'favicon.svg', 'css/app.css',
  'js/core.js', 'js/data/sounds.js', 'js/data/marks.js', 'js/data/dia-audio.js', 'js/tract.js', 'js/audio.js',
  'src/english-to-ipa.js', 'js/views/sounds.js', 'js/views/practice.js', 'js/views/transcribe.js', 'js/views/credits.js',
  'js/palette.js', 'js/offline.js', 'js/reveal.js', 'js/app.js', '404.html'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  var keep = [SHELL, FONTS, RECORDINGS];
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('smartipa-') === 0 && keep.indexOf(k) < 0; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(function (res) {
      if (res.ok && res.status === 200) { var copy = res.clone(); caches.open(SHELL).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        return hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error());
      });
    }));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'unpkg.com') {
    e.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; });
      });
    }));
    return;
  }

  if (url.hostname === 'upload.wikimedia.org') {
    e.respondWith(caches.open(RECORDINGS).then(function (c) {
      return c.match(req.url).then(function (hit) { return hit || fetch(req); });
    }));
  }
});
