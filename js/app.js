/* App shell: hash router, shared helpers and play buttons.
   Routes: #/sounds/<symbol>?d=...&p=...  #/transcribe  #/credits
   Older links #/diacritics and #/prosody/<id> open the matching tab of the Sounds menu. */
(function (S) {
  'use strict';
  var ROUTES = ['sounds', 'transcribe', 'credits'];
  var mounted = {}, currentView = null;

  S.englishToIPA = window.SmartIPA.englishToIPA;

  // Shows "Playing" on a button while a playback promise runs, and a message if it fails.
  S.withPlaying = function (btn, promise) {
    var label = btn.querySelector('span');
    var before = label ? label.textContent : '';
    var msg = btn.parentNode.querySelector('.play-msg');
    btn.classList.add('is-playing');
    if (label) label.textContent = 'Playing';
    if (msg) msg.textContent = '';
    var done = function () { btn.classList.remove('is-playing'); if (label) label.textContent = before; };
    promise.then(done, function (e) {
      done();
      if (msg) msg.textContent = e && e.name === 'NotAllowedError' ? 'Tap again to allow sound.' : 'The recording could not be loaded. Check your connection.';
    });
  };

  function route() {
    var raw = location.hash.replace(/^#\/?/, '');
    var parts = raw.split('/');
    var name = parts[0].split('?')[0], param = '';
    if (name === 'diacritics') { name = 'sounds'; param = '?open=dia'; }
    else if (name === 'prosody') { name = 'sounds'; param = '?p=' + (parts[1] || 'ps') + '&open=pro'; }
    else if (ROUTES.indexOf(name) < 0) { name = 'sounds'; }
    else param = parts[1] ? decodeURIComponent(parts.slice(1).join('/')) : '';
    var view = S.views[name];
    ROUTES.forEach(function (r) { document.getElementById('view-' + r).hidden = r !== name; });
    if (!mounted[name]) { view.mount(document.getElementById('view-' + name)); mounted[name] = true; }
    view.update(param);
    if (currentView && currentView !== name) window.scrollTo(0, 0);
    currentView = name;
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-play-sound]');
    if (b) { S.withPlaying(b, S.audio.playSound(b.getAttribute('data-play-sound'))); return; }
    var sp = e.target.closest('[data-speak]');
    if (sp) S.withPlaying(sp, S.audio.speak(sp.getAttribute('data-speak'), sp.getAttribute('data-lang')));
  });
  window.addEventListener('hashchange', function () { S.audio.stop(); route(); });
  route();
})(window.SIPA = window.SIPA || {});
