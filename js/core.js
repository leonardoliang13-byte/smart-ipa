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
    speaker: icon('<path class="icon-fill" d="M2 6 H5 L9 3 V13 L5 10 H2 Z"></path><path d="M11.5 5.5 Q13.5 8 11.5 10.5"></path>'),
    loop: icon('<path d="M3 7 V6 A2 2 0 0 1 5 4 H12 M10 2 L12 4 L10 6 M13 9 V10 A2 2 0 0 1 11 12 H4 M6 14 L4 12 L6 10"></path>'),
    replay: icon('<path d="M3 8 A5 5 0 1 0 5 4"></path><path d="M5 1 V4 H2"></path>'),
    swap: icon('<path d="M2 5 H13 M10 2 L13 5 L10 8 M14 11 H3 M6 8 L3 11 L6 14"></path>'),
    copy: icon('<rect x="5" y="5" width="9" height="9" rx="2"></rect><path d="M11 3 V2.5 A0.5 0.5 0 0 0 10.5 2 H3 A1 1 0 0 0 2 3 V10.5 A0.5 0.5 0 0 0 2.5 11 H3"></path>')
  };
})(window.SIPA = window.SIPA || {});
