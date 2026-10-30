/* Sections marked data-reveal="<key>" rise and fade in the first time they scroll into view.
   Views redraw their markup often, so each key is revealed only once per visit: a redrawn section
   with a key that was already shown appears at once, without replaying the motion. */
(function (S) {
  'use strict';
  var shown = {};
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      shown[e.target.getAttribute('data-reveal')] = true;
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;

  function prepare(el) {
    if (el.classList.contains('reveal')) return;
    var key = el.getAttribute('data-reveal');
    if (!io || shown[key]) return;
    el.classList.add('reveal');
    io.observe(el);
  }
  function scan(root) {
    if (root.nodeType !== 1) return;
    if (root.hasAttribute('data-reveal')) prepare(root);
    Array.prototype.forEach.call(root.querySelectorAll('[data-reveal]'), prepare);
  }

  var views = document.getElementById('views');
  if (views) {
    scan(views);
    new MutationObserver(function (list) {
      list.forEach(function (m) { Array.prototype.forEach.call(m.addedNodes, scan); });
    }).observe(views, { childList: true, subtree: true });
  }
  S.reveal = { scan: scan };
})(window.SIPA = window.SIPA || {});
