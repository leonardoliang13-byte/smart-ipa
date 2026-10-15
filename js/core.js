/* Shared namespace, HTML escaping and icons. Loaded first. */
(function (S) {
  'use strict';
  S.views = {};
  S.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var icon = function (body) { return '<svg aria-hidden="true" viewBox="0 0 16 16" class="icon">' + body + '</svg>'; };
  S.icons = {
    play: icon('<path class="icon-fill" d="M4 2.5 L13 8 L4 13.5 Z"></path>'),
    search: icon('<circle cx="7" cy="7" r="4.5"></circle><path d="M10.5 10.5 L14 14"></path>'),
    close: icon('<path d="M4 4 L12 12 M12 4 L4 12"></path>'),
    speaker: icon('<path class="icon-fill" d="M2 6 H5 L9 3 V13 L5 10 H2 Z"></path><path d="M11.5 5.5 Q13.5 8 11.5 10.5"></path>')
  };
})(window.SIPA = window.SIPA || {});
