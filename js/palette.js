/* Search palette: opened with Ctrl+K (Cmd+K on a Mac), "/", or the search button on the chart.
   Finds sounds by symbol, name or features ("voiced velar"), X-SAMPA ("S" for ʃ), English hints
   ("sh", "as in she") and diacritic phrases ("aspirated t", "nasalized o"). Also offers actions:
   transcribe the typed text, or open a practice drill. */
(function (S) {
  'use strict';
  var esc = S.esc, D = S.sounds, DIA = S.diacritics;

  // X-SAMPA for every chart symbol (ASCII spellings of IPA used in many phonetics courses and corpora).
  var XSAMPA = {
    p: 'p', b: 'b', t: 't', d: 'd', 'ʈ': 't`', 'ɖ': 'd`', c: 'c', 'ɟ': 'J\\', k: 'k', 'ɡ': 'g', q: 'q', 'ɢ': 'G\\', 'ʔ': '?',
    m: 'm', 'ɱ': 'F', n: 'n', 'ɳ': 'n`', 'ɲ': 'J', 'ŋ': 'N', 'ɴ': 'N\\', 'ʙ': 'B\\', r: 'r', 'ʀ': 'R\\', 'ɾ': '4', 'ɽ': 'r`',
    'ɸ': 'p\\', 'β': 'B', f: 'f', v: 'v', 'θ': 'T', 'ð': 'D', s: 's', z: 'z', 'ʃ': 'S', 'ʒ': 'Z', 'ʂ': 's`', 'ʐ': 'z`',
    'ç': 'C', 'ʝ': 'j\\', x: 'x', 'ɣ': 'G', 'χ': 'X', 'ʁ': 'R', 'ħ': 'X\\', 'ʕ': '?\\', h: 'h', 'ɦ': 'h\\', 'ɬ': 'K', 'ɮ': 'K\\',
    'ʋ': 'P', 'ɹ': 'r\\', 'ɻ': 'r\\`', j: 'j', 'ɰ': 'M\\', l: 'l', 'ɭ': 'l`', 'ʎ': 'L', 'ʟ': 'L\\',
    'ʘ': 'O\\', 'ǀ': '|\\', 'ǃ': '!\\', 'ǂ': '=\\', 'ǁ': '|\\|\\', 'ɓ': 'b_<', 'ɗ': 'd_<', 'ʄ': 'J\\_<', 'ɠ': 'g_<', 'ʛ': 'G\\_<',
    'pʼ': 'p_>', 'tʼ': 't_>', 'kʼ': 'k_>', 'sʼ': 's_>', 'ʍ': 'W', w: 'w', 'ɥ': 'H', 'ʜ': 'H\\', 'ʢ': '<\\', 'ʡ': '>\\',
    'ɕ': 's\\', 'ʑ': 'z\\', 'ɺ': 'l\\', 'ɧ': 'x\\', 't͡s': 'ts', 'd͡z': 'dz', 't͡ʃ': 'tS', 'd͡ʒ': 'dZ', 't͡ɕ': 'ts\\', 'd͡ʑ': 'dz\\',
    'ʈ͡ʂ': 't`s`', 'ɖ͡ʐ': 'd`z`', 'k͡p': 'kp', 'ɡ͡b': 'gb',
    i: 'i', y: 'y', 'ɨ': '1', 'ʉ': '}', 'ɯ': 'M', u: 'u', 'ɪ': 'I', 'ʏ': 'Y', 'ʊ': 'U', e: 'e', 'ø': '2', 'ɘ': '@\\', 'ɵ': '8',
    'ɤ': '7', o: 'o', 'ə': '@', 'ɛ': 'E', 'œ': '9', 'ɜ': '3', 'ɞ': '3\\', 'ʌ': 'V', 'ɔ': 'O', 'æ': '{', 'ɐ': '6', a: 'a',
    'ɶ': '&', 'ɑ': 'A', 'ɒ': 'Q'
  };
  // English spelling hints a learner might type.
  var HINTS = {
    sh: ['ʃ'], ch: ['t͡ʃ'], tch: ['t͡ʃ'], th: ['θ', 'ð'], ng: ['ŋ'], zh: ['ʒ'], j: ['d͡ʒ'], dge: ['d͡ʒ'], y: ['j'], r: ['ɹ'],
    schwa: ['ə'], uh: ['ʌ', 'ə'], ah: ['ɑ'], ee: ['i'], oo: ['u'], 'glottal stop': ['ʔ'], tap: ['ɾ'], flap: ['ɾ'], click: ['ǃ', 'ǀ', 'ʘ']
  };

  var index = D.all.map(function (o) {
    var words = (o.name + ' ' + o.cat + ' ' + o.features.map(function (f) { return f[1]; }).join(' ')).toLowerCase();
    return { o: o, xs: XSAMPA[o.s] || '', words: words, ex: o.ex && o.ex.lang.indexOf('English') === 0 ? o.ex.word.toLowerCase() : '' };
  });
  S.xsampa = XSAMPA;

  // Diacritic names, longest first, so "velarized or pharyngealized" wins over "velarized".
  var diaNames = DIA.list.map(function (x) { return { x: x, n: x.name.toLowerCase() }; })
    .sort(function (a, b) { return b.n.length - a.n.length; });

  function search(raw) {
    var q = raw.trim(), ql = q.toLowerCase().replace(/^\/|\/$/g, '');
    var res = [];
    if (!q) return defaults();
    var seen = {};
    var push = function (o, score, why) {
      if (seen[o.s] && seen[o.s].score >= score) return;
      seen[o.s] = { o: o, score: score, why: why, i: D.all.indexOf(o) };
    };
    // "as in she", "like ship": pull the word out.
    var asIn = /^(?:as in|like)\s+(.+)$/.exec(ql), hintWord = asIn ? asIn[1] : ql;
    index.forEach(function (it) {
      var o = it.o;
      if (o.s === q || o.s.replace('͡', '') === q) push(o, 100, 'Symbol');
      if (it.xs && it.xs === q) push(o, 95, 'X-SAMPA ' + it.xs);
      if (it.ex && it.ex === hintWord) push(o, 85, 'As in "' + it.ex + '"');
      var terms = ql.split(/\s+/).filter(Boolean);
      if (terms.length && terms.every(function (t) { return it.words.split(/[\s(),/-]+/).some(function (w) { return w.indexOf(t) === 0; }); })) {
        push(o, 60, o.cat);
      }
    });
    (HINTS[hintWord] || []).forEach(function (s, i) { if (D.by[s]) push(D.by[s], 90 - i, 'Spelled "' + hintWord + '" in English'); });

    // Diacritic phrase: "<diacritic> <sound>", e.g. "aspirated t", "nasalized o", "voiceless n".
    var combos = [];
    diaNames.forEach(function (d) {
      if (ql.indexOf(d.n + ' ') !== 0) return;
      var rest = ql.slice(d.n.length + 1).trim();
      var bases = rest ? search(rest).filter(function (r) { return r.kind === 'sound'; }).slice(0, 3) : [];
      bases.forEach(function (b) {
        if (DIA.reason(d.x.id, b.o, {})) return;
        var sym = b.o.s + (d.x.spacing ? '' : d.x.m) + (d.x.spacing ? d.x.m : '');
        combos.push({ kind: 'combo', sym: sym, title: d.x.name + ' ' + b.o.name.charAt(0).toLowerCase() + b.o.name.slice(1),
          sub: 'Diacritic ' + d.x.glyph + ' on [' + b.o.s + ']' + (S.diacriticAudio(b.o.s, [d.x.id]) ? ' · has a recording' : ''),
          href: '#/sounds/' + encodeURIComponent(b.o.s) + '?d=' + d.x.id + '&open=dia', score: 99 });
      });
    });

    var sounds = Object.keys(seen).map(function (k) { return seen[k]; })
      .sort(function (a, b) { return b.score - a.score || a.i - b.i; }).slice(0, 7)
      .map(function (r) {
        return { kind: 'sound', o: r.o, sym: r.o.s, title: r.o.name, sub: r.why + (XSAMPA[r.o.s] ? ' · X-SAMPA ' + XSAMPA[r.o.s] : ''), href: '#/sounds/' + encodeURIComponent(r.o.s), score: r.score };
      });
    // Two sounds: "p vs b", "s/ʃ", "compare th and s".
    var pairs = [], pm = /^(?:compare\s+)?(\S+)\s*(?:\s(?:vs\.?|versus|and|with)\s|\/|,)\s*(\S+)$/i.exec(q);
    if (pm) {
      var best = function (t) { var r = search(t).filter(function (x) { return x.kind === 'sound' && x.score >= 85; })[0]; return r && r.o; };
      var A = best(pm[1]), B = best(pm[2]);
      if (A && B && A !== B) pairs.push({ kind: 'compare', sym: A.s + ' · ' + B.s, title: 'Compare [' + A.s + '] and [' + B.s + ']',
        sub: A.name + ' with ' + B.name.charAt(0).toLowerCase() + B.name.slice(1), href: '#/sounds/' + encodeURIComponent(A.s) + '?vs=' + encodeURIComponent(B.s) });
    }
    var out = pairs.concat(combos.slice(0, 3), sounds);
    out.push({ kind: 'action', sym: '/ /', title: 'Transcribe "' + q + '"', sub: 'English to IPA, class conventions', action: 'transcribe', text: q });
    return out;
  }

  function defaults() {
    return [
      { kind: 'action', sym: '✓', title: 'Practice: listen and identify', sub: 'Hear a recording, pick the symbol', href: '#/practice/listen' },
      { kind: 'action', sym: '✓', title: 'Practice: read the diagram', sub: 'Pick the sound the vocal tract shows', href: '#/practice/diagram' },
      { kind: 'action', sym: '/ /', title: 'Open Transcribe', sub: 'English to IPA', href: '#/transcribe' }
    ].concat(['ʃ', 'ŋ', 'ə', 'θ'].map(function (s) {
      var o = D.by[s];
      return { kind: 'sound', o: o, sym: s, title: o.name, sub: 'Try "sh", "voiced velar", "aspirated t" or "s vs ʃ"', href: '#/sounds/' + encodeURIComponent(s) };
    }));
  }

  var box = null, input = null, list = null, results = [], active = 0, lastFocus = null;

  function build() {
    box = document.createElement('div');
    box.className = 'palette-backdrop';
    box.hidden = true;
    box.innerHTML = '<div class="palette" role="dialog" aria-modal="true" aria-label="Search sounds">' +
      '<div class="palette-input">' + S.icons.search +
      '<input id="palette-q" type="text" autocomplete="off" spellcheck="false" placeholder="Symbol, name, X-SAMPA, “sh”, or “aspirated t”" ' +
      'role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list">' +
      '<span class="kbd">Esc</span></div><ul id="palette-list" class="palette-list" role="listbox" aria-label="Results"></ul>' +
      '<div class="palette-foot hint"><span><span class="kbd">↑</span> <span class="kbd">↓</span> to move</span><span><span class="kbd">Enter</span> to open</span></div></div>';
    document.body.appendChild(box);
    input = box.querySelector('#palette-q');
    list = box.querySelector('#palette-list');
    input.addEventListener('input', function () { results = search(input.value); active = 0; draw(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(results.length - 1, active + 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(0, active - 1); draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(results[active]); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { e.preventDefault(); }
    });
    box.addEventListener('mousedown', function (e) { if (e.target === box) close(); });
    list.addEventListener('click', function (e) {
      var li = e.target.closest('[data-i]');
      if (li) choose(results[+li.getAttribute('data-i')]);
    });
  }

  function draw() {
    list.innerHTML = results.map(function (r, i) {
      return '<li id="pal-' + i + '" role="option" data-i="' + i + '" aria-selected="' + (i === active) + '" class="pal-item' + (i === active ? ' is-active' : '') + '">' +
        '<span class="pal-g' + (r.kind === 'action' ? ' is-action' : ' ipa') + '">' + esc(r.sym) + '</span>' +
        '<span class="pal-t"><span class="pal-title">' + esc(r.title) + '</span><span class="pal-sub">' + esc(r.sub || '') + '</span></span>' +
        (i === active ? '<span class="kbd">Enter</span>' : '') + '</li>';
    }).join('');
    input.setAttribute('aria-activedescendant', results.length ? 'pal-' + active : '');
    var a = list.querySelector('.is-active');
    if (a && a.scrollIntoView) a.scrollIntoView({ block: 'nearest' });
  }

  function choose(r) {
    if (!r) return;
    close();
    if (r.action === 'transcribe') { S.pendingTranscribe = r.text; location.hash = '#/transcribe'; if (location.hash === '#/transcribe') window.dispatchEvent(new HashChangeEvent('hashchange')); return; }
    if (r.href) location.hash = r.href;
  }

  function open() {
    if (!box) build();
    lastFocus = document.activeElement;
    box.hidden = false;
    document.body.classList.add('has-palette');
    input.value = '';
    results = search('');
    active = 0;
    draw();
    input.focus();
  }
  function close() {
    if (!box || box.hidden) return;
    box.hidden = true;
    document.body.classList.remove('has-palette');
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
  }

  document.addEventListener('keydown', function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if (box && !box.hidden) close(); else open(); }
    else if (e.key === '/' && !typing && !(box && !box.hidden)) { e.preventDefault(); open(); }
  });
  document.addEventListener('click', function (e) { if (e.target.closest('[data-open-palette]')) open(); });

  S.palette = { open: open, close: close, search: search };
})(window.SIPA = window.SIPA || {});
