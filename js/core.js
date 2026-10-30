/* Shared namespace, HTML escaping and icons. Loaded first. */
(function (S) {
  'use strict';
  S.views = {};
  S.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  // Phosphor icons (icon font loaded in index.html). Decorative: the button around each one carries its name.
  var icon = function (name, fill) { return '<i class="' + (fill ? 'ph-fill' : 'ph') + ' ph-' + name + ' icon" aria-hidden="true"></i>'; };
  S.icons = {
    play: icon('play', true),
    search: icon('magnifying-glass'),
    close: icon('x'),
    speaker: icon('speaker-high'),
    loop: icon('repeat'),
    replay: icon('arrow-counter-clockwise'),
    swap: icon('arrows-left-right'),
    copy: icon('copy')
  };

})(window.SIPA = window.SIPA || {});
