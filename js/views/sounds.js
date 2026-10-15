/* Learn: one page on the left (consonants, vowels, then folded Diacritics and Prosody sections) and one
   teaching panel on the right. Pick a sound, then add diacritics and a prosody mark as "flavour";
   the panel explains the combination.
   Route: #/sounds/<symbol>?d=<diacritic ids>&p=<prosody id>&open=<dia|pro> */
(function (S) {
  'use strict';
  var esc = S.esc, D = S.sounds, DIA = S.diacritics, PRO = S.prosody;
  var el, sel = 'p', dia = {}, pro = null, lastBase = null, fromMenu = false;
  var chart = 'cons'; // which chart the switch shows: 'cons' or 'vow'
  var open = { dia: false, pro: false };

  var BEFORE = { ps: 1, ss: 1, ds: 1, us: 1, gr: 1, gf: 1 };
  var BETWEEN = { sb: '.', mn: ' | ', mj: ' ‖ ', lk: '‿' };
  var LENGTH = { lg: 1, hf: 1, xs: 1 };
  var proById = {}; PRO.items.forEach(function (x) { proById[x.id] = x; });
  var diaById = {}; DIA.list.forEach(function (x) { diaById[x.id] = x; });
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };

  // ---------- State and URL ----------
  function hashFor(base, d, p) {
    var q = [];
    var ids = DIA.list.filter(function (x) { return d[x.id]; }).map(function (x) { return x.id; });
    if (ids.length) q.push('d=' + ids.join(','));
    if (p) q.push('p=' + p);
    return '#/sounds/' + encodeURIComponent(base) + (q.length ? '?' + q.join('&') : '');
  }
  function navigate(base, d, p) {
    fromMenu = true;
    var h = hashFor(base, d, p);
    if (location.hash !== h) location.hash = h; else render();
  }
  function activeDia(base) {
    return DIA.list.filter(function (x) { return dia[x.id] && DIA.fits(x, base); });
  }

  // ---------- Left menu ----------
  function symBtn(s, cls) {
    var o = D.by[s];
    return '<button type="button" class="' + cls + (s === sel ? ' is-selected' : '') + '" data-sym="' + esc(s) +
      '" aria-label="' + esc(o.name) + '" title="' + esc(o.name) + '" aria-pressed="' + (s === sel) + '">' +
      '<span class="ipa">' + esc(s) + '</span></button>';
  }

  // iOS Settings-style section icon: a coloured rounded tile with a white glyph.
  function secIcon(cat, glyph, small) {
    return '<span class="sec-icon' + (small ? ' sm' : '') + ' cat-' + cat + '" aria-hidden="true">' + esc(glyph) + '</span>';
  }

  function consonantChart() {
    var h = '<section class="card"><div class="card-head"><h2 class="sec-title">' + secIcon('cons', 'p') + 'Pulmonic consonants</h2>' +
      '<p class="hint">In each pair the right-hand symbol is voiced. Shaded cells are judged impossible.</p></div>' +
      '<div class="scroll-x"><div class="pulmonic"><div class="pul-head"><div></div>' +
      D.places.map(function (p) { return '<div>' + esc(p) + '</div>'; }).join('') + '</div>';
    D.rows.forEach(function (r) {
      h += '<div class="pul-row"><div class="pul-label">' + esc(r.label) + '</div>';
      r.cells.forEach(function (c, i) {
        h += '<div class="pul-cell' + (c.shade ? ' is-impossible' : '') + (i % 2 === 0 ? ' pair-start' : '') + '">' +
          (c.s ? symBtn(c.s, 'cell-btn') : '') + '</div>';
      });
      h += '</div>';
    });
    h += '</div></div></section>';
    var listGroup = function (title, syms) {
      return '<div class="np-group"><h3 class="eyebrow">' + esc(title) + '</h3>' + syms.map(function (s) {
        return '<button type="button" class="row-btn' + (s === sel ? ' is-selected' : '') + '" data-sym="' + esc(s) + '" aria-pressed="' + (s === sel) + '">' +
          '<span class="ipa">' + esc(s) + '</span><span class="row-sub">' + esc(D.by[s].short) + '</span></button>';
      }).join('') + '</div>';
    };
    h += '<div class="two-up"><section class="card"><h2 class="sec-title">' + secIcon('cons', 'ʘ') + 'Non-pulmonic consonants</h2><div class="np">' +
      listGroup('Clicks', D.clicks) + listGroup('Voiced implosives', D.implosives) + listGroup('Ejectives', D.ejectives) +
      '</div></section><section class="card"><h2 class="sec-title">' + secIcon('cons', 'w') + 'Other symbols</h2><div class="tiles">' +
      D.others.map(function (s) { return symBtn(s, 'tile-btn'); }).join('') +
      '</div><h3 class="sub-h">Affricates and double articulations</h3><p class="hint">Two symbols joined by a tie bar.</p><div class="tiles">' +
      D.affricates.map(function (s) { return symBtn(s, 'tile-btn wide'); }).join('') + '</div></section></div>';
    return h;
  }

  function vowelChart() {
    return '<section class="card"><div class="card-head"><h2 class="sec-title">' + secIcon('vow', 'a') + 'Vowels</h2><p class="hint">In each pair the right-hand symbol is rounded. ' +
      'Position on the chart mirrors tongue position in the mouth.</p></div><div class="scroll-x"><div class="vowel-chart">' +
      '<div class="v-heights"><span style="top:0">Close</span><span style="top:33.3%">Close-mid</span><span style="top:66.7%">Open-mid</span><span style="top:100%">Open</span></div>' +
      '<div class="v-main"><div class="v-backs"><span style="left:0">Front</span><span style="left:50%">Central</span><span style="left:100%">Back</span></div>' +
      '<div class="v-area"><svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<path d="M 0 0 L 100 0 L 100 100 L 50 100 Z M 50 0 L 75 100 M 16.7 33.3 L 100 33.3 M 33.3 66.7 L 100 66.7"></path></svg>' +
      D.vnodes.map(function (n) {
        return '<div class="v-node" style="left:' + n.left + ';top:' + n.top + '">' + n.syms.map(function (s) { return symBtn(s, 'v-btn'); }).join('') + '</div>';
      }).join('') + '</div></div></div></div></section>';
  }

  function baseBanner() {
    var o = D.by[sel];
    return '<div class="base-banner"><span class="hint">Adding flavour to</span><span class="ipa base-glyph">' + esc(o.s) + '</span>' +
      '<span class="base-name">' + esc(o.name) + '</span><span class="hint">Pick a different sound in the chart above.</span></div>';
  }

  // A folded section: closed by default, opened by its header; the header says what is applied inside.
  function fold(key, title, hint, status, body) {
    return '<details class="card fold" data-fold="' + key + '"' + (open[key] ? ' open' : '') + '>' +
      '<summary>' + secIcon(key, key === 'dia' ? '◌̃' : 'ˈ') + '<span class="fold-title"><span class="fold-name">' + esc(title) + '</span><span class="hint">' + esc(hint) + '</span></span>' +
      (status ? '<span class="fold-status">' + status + '</span>' : '') +
      '<svg class="chevron" aria-hidden="true" viewBox="0 0 16 16"><path d="M3 6 L8 11 L13 6"></path></svg></summary>' +
      '<div class="fold-body">' + baseBanner() + body + '</div></details>';
  }

  function diacriticMenu() {
    var base = D.by[sel], active = activeDia(base);
    var status = active.length ? '<span class="ipa">' + active.map(function (x) { return esc(x.glyph); }).join(' ') + '</span> ' + active.length + ' applied' : '';
    return fold('dia', 'Diacritics', 'Small marks that modify a sound, grouped by what they change', status,
      '<p class="hint">Dimmed marks do not apply to this sound. Several can be combined.</p>' +
      DIA.groups.map(function (g) {
        return '<div class="group"><div class="group-head"><h3>' + esc(g[1]) + '</h3><span class="hint">' + esc(g[2]) + '</span></div><div class="mark-tiles">' +
          DIA.list.filter(function (x) { return x.grp === g[0]; }).map(function (x) {
            var off = !DIA.fits(x, base), on = !!dia[x.id] && !off;
            return '<button type="button" class="mark-btn' + (on ? ' is-selected' : '') + '" data-dia="' + x.id + '" aria-pressed="' + on + '"' + (off ? ' disabled' : '') + '>' +
              '<span class="ipa mark-glyph">' + esc(x.glyph) + '</span><span class="mark-name">' + esc(x.name) + '</span></button>';
          }).join('') + '</div></div>';
      }).join(''));
  }

  function prosodyMenu() {
    var p = pro ? proById[pro] : null;
    var status = p ? '<span class="ipa">' + esc(p.sym) + '</span> ' + esc(p.name) : '';
    return fold('pro', 'Prosody', 'Stress, length, breaks, tones and intonation', status,
      '<p class="hint">These marks belong to syllables, words and phrases: how loud, how long, how high, and where the breaks fall. Pick one at a time.</p>' +
      PRO.groups.map(function (g) {
        return '<div class="group"><div class="group-head"><h3>' + esc(g[1]) + '</h3><span class="hint">' + esc(g[2]) + '</span></div><div class="mark-tiles">' +
          PRO.items.filter(function (x) { return x.grp === g[0]; }).map(function (x) {
            var on = x.id === pro;
            return '<button type="button" class="mark-btn' + (on ? ' is-selected' : '') + '" data-pro="' + x.id + '" aria-pressed="' + on + '">' +
              '<span class="ipa mark-glyph">' + esc(x.sym) + '</span><span class="mark-name">' + esc(x.name) + '</span></button>';
          }).join('') + '</div></div>';
      }).join(''));
  }

  function renderMenu() {
    el.querySelectorAll('[data-chart]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-chart') === chart);
    });
    el.querySelector('#menu').innerHTML = (chart === 'vow' ? vowelChart() : consonantChart()) + diacriticMenu() + prosodyMenu();
  }

  // ---------- Composition ----------
  function compose() {
    var base = D.by[sel], active = activeDia(base), has = {};
    active.forEach(function (x) { has[x.id] = true; });
    var p = pro ? proById[pro] : null;

    var core = base.s + active.filter(function (x) { return !x.spacing; }).map(function (x) { return x.m; }).join('') +
      active.filter(function (x) { return x.spacing; }).map(function (x) { return x.m; }).join('');
    var sym = core;
    if (p) {
      if (BEFORE[p.id]) sym = p.sym + core;
      else if (BETWEEN[p.id]) sym = core + BETWEEN[p.id] + core;
      else if (p.id === 'xs') sym = base.s + '̆' + core.slice(base.s.length);
      else sym = core + p.sym;
    }

    var n = base.name.charAt(0).toLowerCase() + base.name.slice(1), pre = [];
    var setVoice = function (v) {
      if (/^(voiced|voiceless) /.test(n)) n = n.replace(/^(voiced|voiceless) /, v ? v + ' ' : '');
      else if (v) n = v + ' ' + n;
    };
    if (has.vl) setVoice('voiceless');
    if (has.vd) setVoice('voiced');
    if (has.br || has.cr) setVoice('');
    var denDone = false;
    if (has.den && / alveolar /.test(' ' + n + ' ')) { n = n.replace('alveolar', 'dental'); denDone = true; }
    active.forEach(function (x) {
      if (x.id === 'vl' || x.id === 'vd' || (x.id === 'den' && denDone)) return;
      pre.push(x.name.toLowerCase());
    });
    if (p && LENGTH[p.id]) pre.unshift(p.name.toLowerCase());
    var name = cap(pre.concat([n]).join(' '));
    if (p && !LENGTH[p.id]) name += ' with ' + (p.grp === 'C' || p.grp === 'D' ? p.name.toLowerCase() + ' tone' : p.name.toLowerCase());

    var t = S.tractParams(base);
    if (has.vl) t.voiced = false;
    if (has.vd || has.br || has.cr) t.voiced = true;
    if (has.den && t.place === 'alveolar') t.place = 'dental';
    if (base.kind === 'vowel') {
      var h = t.vheight, b = t.vback;
      if (has.rai) h -= 0.14;
      if (has.low) h += 0.14;
      if (has.adv) b -= 0.18;
      if (has.ret) b += 0.18;
      if (has.cen) b = b + (0.5 - b) * 0.6;
      if (has.mcen) { b = b + (0.5 - b) * 0.6; h = h + (0.5 - h) * 0.6; }
      t.vheight = Math.max(0, Math.min(1, h)); t.vback = Math.max(0, Math.min(1, b));
      t.rounded = (t.rounded || !!has.mor) && !has.les;
    }
    t.nasalized = !!has.nas;
    t.secondary = has.pal ? 'palatalized' : (has.vel || has.vph) ? 'velarized' : has.pha ? 'pharyngealized' : has.lab ? 'labialized' : 'none';

    return { base: base, active: active, p: p, sym: sym, name: name, tract: t, flavoured: active.length > 0 || !!p };
  }

  // Pitch-and-timing segments for the selected prosody mark, using the chosen sound where it makes sense.
  function segmentsFor(c) {
    var p = c.p, s = c.base.s;
    if (p.grp === 'C' || p.grp === 'D') return [{ l: c.sym, d: 2.4, p: p.segs[0].p, hl: true, gap: 0 }];
    if (LENGTH[p.id]) {
      return p.segs.map(function (g) { return { l: g.l.replace('a', s), d: g.d, p: g.p, hl: g.hl, gap: g.gap }; });
    }
    return p.segs;
  }

  function graph(segs) {
    var total = 0;
    segs.forEach(function (s, i) { total += s.d + (i < segs.length - 1 ? s.gap : 0); });
    var x0 = 14, w = 372, y = function (l) { return 132 - (l - 1) * 26; };
    var t = 0, rest = '', hl = '', labels = '';
    segs.forEach(function (s) {
      var a = x0 + (t / total) * w + 5, b = x0 + ((t + s.d) / total) * w - 5;
      var pts = s.p.length === 1 ? [s.p[0], s.p[0]] : s.p;
      var d = pts.map(function (l, i) { return (i ? ' L ' : 'M ') + (a + (b - a) * i / (pts.length - 1)).toFixed(1) + ' ' + y(l).toFixed(1); }).join('');
      if (s.hl) hl += d + ' '; else rest += d + ' ';
      labels += '<span class="ipa' + (s.hl ? ' is-hl' : '') + '" style="left:' + (((a + b) / 2) / 4).toFixed(1) + '%">' + esc(s.l) + '</span>';
      t += s.d + s.gap;
    });
    return '<div class="pitch"><div class="pitch-axis"><span>High</span><span>Mid</span><span>Low</span></div><div class="pitch-plot">' +
      '<svg viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true">' +
      '<path class="grid" d="M 0 28 L 400 28 M 0 54 L 400 54 M 0 80 L 400 80 M 0 106 L 400 106 M 0 132 L 400 132"></path>' +
      (rest ? '<path class="seg" d="' + rest + '"></path>' : '') + (hl ? '<path class="seg is-hl" d="' + hl + '"></path>' : '') +
      '</svg><div class="pitch-labels">' + labels + '</div></div></div><div class="pitch-time hint">Time</div>';
  }

  // Example words in other scripts carry a romanization ("书 shū"); the voice should read the original script.
  function spokenForm(word) {
    var first = word.split(' ')[0];
    return /[^\u0000-ɏ]/.test(first) ? first : word;
  }

  // ---------- Right panel ----------
  function detail(c) {
    var o = c.base, p = c.p, info = S.describe(o), ex = o.ex || null, a = o.audio;
    var eng = ex && ex.lang.indexOf('English') === 0;
    var cp = Array.from(c.sym).filter(function (ch) { return ch.trim(); })
      .map(function (ch) { return 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'); }).join(' ');
    var speakable = ex && S.audio.canSpeak(ex.lang);
    var h = '';

    h += '<div class="hero"><div class="glyph ipa">' + esc(c.sym) + '</div><div class="hero-text">' +
      '<div class="eyebrow">' + esc(c.flavoured ? o.cat + ' with flavour' : o.cat) + '</div><h1>' + esc(c.name) + '</h1>' +
      '<div class="meta">' + cp + '</div><div class="hero-actions">' +
      (p ? '<button type="button" class="btn-play" data-play-pitch>' + S.icons.play + '<span>Play pitch</span></button>' +
        '<button type="button" class="btn-secondary" data-play-sound="' + esc(o.s) + '">' + S.icons.play + '<span>Recording</span></button>'
        : '<button type="button" class="btn-play" data-play-sound="' + esc(o.s) + '">' + S.icons.play + '<span>Play sound</span></button>') +
      '<span class="play-msg" role="status"></span></div></div></div>';

    if (c.flavoured) {
      h += '<div class="recipe"><span class="recipe-label hint">Built from</span><div class="chips">' +
        '<span class="chip chip-base"><span class="ipa">' + esc(o.s) + '</span>' + esc(o.name) + '</span>' +
        c.active.map(function (x) {
          return '<button type="button" class="chip" data-remove-dia="' + x.id + '" aria-label="Remove ' + esc(x.name) + '"><span class="ipa">' + esc(x.glyph) + '</span>' + esc(x.name) + S.icons.close + '</button>';
        }).join('') +
        (p ? '<button type="button" class="chip" data-remove-pro aria-label="Remove ' + esc(p.name) + '"><span class="ipa">' + esc(p.sym) + '</span>' + esc(p.name) + S.icons.close + '</button>' : '') +
        '<button type="button" class="chip chip-clear" data-clear>Clear flavour</button></div>' +
        (c.active.length ? '<p class="hint">The recording is of plain [' + esc(o.s) + ']. Modified versions are not recorded.</p>' : '') + '</div>';
    } else {
      h += '<p class="hint tip">Open Diacritics or Prosody below the chart to add flavour and see how marks change this sound.</p>';
    }

    h += '<div class="features">' + o.features.map(function (f) {
      return '<div class="feature"><div class="eyebrow">' + esc(f[0]) + '</div><div class="feature-v">' + esc(f[1]) + '</div></div>';
    }).join('') + '</div>';

    h += '<section class="block"><h2>How it is made</h2><div class="tract-card"><div class="tract-wrap">' + S.tractSVG(c.tract) +
      '</div><dl class="legend">' + info.legend.map(function (l) {
        return '<div><dt class="eyebrow">' + esc(l[0]) + '</dt><dd>' + esc(l[1]) + '</dd></div>';
      }).join('') + '</dl></div><p>' + esc(info.how) + '</p></section>';

    if (c.active.length) {
      h += '<section class="block"><h2>What the diacritics do</h2>' + c.active.map(function (x) {
        return '<div class="explain"><div class="explain-glyph ipa">' + esc(x.glyph) + '</div><div><div class="explain-name">' + esc(x.name) + '</div>' +
          '<p>' + esc(x.effect) + '</p>' + (x.exWord ? '<div class="explain-ex"><span class="hint">' + esc(x.exLang) + '</span> <strong>' + esc(x.exWord) +
          '</strong> <span class="ipa ex-ipa">' + esc(x.exIpa) + '</span></div>' : '') + '</div></div>';
      }).join('') + '</section>';
    }

    if (p) {
      var tone = p.grp === 'C' || p.grp === 'D';
      h += '<section class="block"><h2>' + esc(p.name) + ': pitch and timing</h2><p>' + esc(p.desc) + '</p>' +
        (p.alt ? '<p class="hint">Also written as an accent over the vowel: <span class="ipa alt-glyph">' + esc(p.alt) + '</span></p>' : '') +
        '<div class="pitch-card">' + graph(segmentsFor(c)) + '</div><p class="hint">' +
        (tone ? 'A tone letter is a tiny pitch graph: the bar shows where the voice sits between low and high.' + (o.kind === 'vowel' ? '' : ' Tones are normally carried by vowels, so playback uses a vowel.')
          : 'Each line is one syllable. Its height is pitch, its width is duration, and the blue part is what the mark changes.') +
        ' Pitch playback is synthesized.</p>' +
        '<div class="where"><div class="eyebrow">In a real word</div><div class="ipa where-line"><span class="bracket">[</span>' +
        p.parts.map(function (x) { return '<span' + (x[1] ? ' class="mark-hl"' : '') + '>' + esc(x[0]) + '</span>'; }).join('') +
        '<span class="bracket">]</span></div>' +
        (p.ex ? '<div class="where-ex"><span class="hint">' + esc(p.ex[0]) + '</span> <strong>' + esc(p.ex[1]) + '</strong> <span class="hint">' + esc(p.ex[2]) + '</span></div>' : '') +
        '</div></section>';
    }

    if (ex) {
      h += '<section class="block"><h2>Hear [' + esc(o.s) + '] in a word</h2><div class="example"><div class="example-text">' +
        '<div><span class="ex-word">' + esc(ex.word) + '</span> <span class="ipa ex-ipa">' + esc(ex.ipa) + '</span></div>' +
        '<div class="hint">' + (eng ? 'This sound occurs in English.' : 'Not a sound of English. ' + esc(ex.lang) + ' for “' + esc(ex.gloss) + '”.') + '</div></div>' +
        '<span class="lang-tag' + (eng ? ' is-english' : '') + '">' + esc(ex.lang) + '</span>' +
        (speakable ? '<button type="button" class="btn-icon" data-speak="' + esc(spokenForm(ex.word)) + '" data-lang="' + esc(ex.lang) +
          '" aria-label="Say the word with this device’s voice">' + S.icons.speaker + '</button>' : '') +
        '</div></section>';
    }

    h += '<section class="block"><h2>Compare with</h2><div class="related">' + S.related(o).map(function (r) {
      return '<button type="button" class="rel-btn" data-sym="' + esc(r[0]) + '"><span class="ipa rel-glyph">' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></button>';
    }).join('') + '</div></section>';

    if (a) {
      h += '<p class="credit">Recording: <a href="' + esc(a.page) + '" target="_blank" rel="noopener">' + esc(a.file) + '</a>' +
        (a.author ? ' by ' + esc(a.author) : '') + ', ' + esc(a.licence) + ', via Wikimedia Commons.</p>';
    }
    return h;
  }

  function render(focusSel) {
    renderMenu();
    var c = compose();
    el.querySelector('#detail').innerHTML = detail(c);
    document.title = c.sym + ' · ' + c.name + ' · SmartIPA';
    if (focusSel) { var f = el.querySelector(focusSel); if (f) f.focus(); }
  }

  function find(q) {
    q = q.trim().toLowerCase();
    if (!q) return null;
    var hit = D.by[q] || D.all.filter(function (x) { return x.s.toLowerCase() === q || x.s.replace('͡', '') === q; })[0] ||
      D.all.filter(function (x) { return x.name.toLowerCase().indexOf(q) >= 0; })[0];
    return hit ? hit.s : null;
  }

  S.views.sounds = {
    title: 'Sounds',
    mount: function (root) {
      el = root;
      el.innerHTML = '<div class="split"><section class="pane-main" aria-label="Sounds and marks">' +
        '<div class="toolbar"><div class="toolbar-title"><h1 class="page-title">IPA chart</h1>' +
        '<span class="hint">Pick a sound, then open Diacritics or Prosody below to add flavour.</span></div>' +
        '<div class="segmented chart-switch" role="group" aria-label="Chart">' +
        '<button type="button" data-chart="cons">' + secIcon('cons', 'p', true) + 'Consonants</button>' +
        '<button type="button" data-chart="vow">' + secIcon('vow', 'a', true) + 'Vowels</button></div>' +
        '<label class="search">' + S.icons.search + '<span class="sr-only">Search sounds</span>' +
        '<input type="search" id="sound-search" placeholder="Symbol or name, e.g. velar nasal" autocomplete="off"></label></div>' +
        '<div id="menu"></div></section><aside class="pane-detail" id="detail" aria-label="Lesson" aria-live="polite"></aside></div>';

      // Remember which folded sections are open, so re-rendering keeps them as the learner left them.
      el.addEventListener('toggle', function (e) {
        var k = e.target.getAttribute && e.target.getAttribute('data-fold');
        if (k) open[k] = e.target.open;
      }, true);

      el.addEventListener('click', function (e) {
        var sw = e.target.closest('[data-chart]');
        if (sw) { chart = sw.getAttribute('data-chart'); renderMenu(); return; }
        var b = e.target.closest('[data-sym]');
        if (b) {
          var s = b.getAttribute('data-sym');
          var kept = {}; DIA.list.forEach(function (x) { if (dia[x.id] && DIA.fits(x, D.by[s])) kept[x.id] = true; });
          navigate(s, kept, pro);
          if (window.matchMedia('(max-width: 899px)').matches) el.querySelector('#detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        var d = e.target.closest('[data-dia]');
        if (d) {
          var id = d.getAttribute('data-dia'), next = Object.assign({}, dia);
          if (next[id]) delete next[id];
          else {
            DIA.exclusive.forEach(function (set) { if (set.indexOf(id) >= 0) set.forEach(function (o) { delete next[o]; }); });
            next[id] = true;
          }
          navigate(sel, next, pro);
          return;
        }
        var pr = e.target.closest('[data-pro]');
        if (pr) { var pid = pr.getAttribute('data-pro'); navigate(sel, dia, pro === pid ? null : pid); return; }
        var rd = e.target.closest('[data-remove-dia]');
        if (rd) { var nd = Object.assign({}, dia); delete nd[rd.getAttribute('data-remove-dia')]; navigate(sel, nd, pro); return; }
        if (e.target.closest('[data-remove-pro]')) { navigate(sel, dia, null); return; }
        if (e.target.closest('[data-clear]')) { navigate(sel, {}, null); return; }
        var pp = e.target.closest('[data-play-pitch]');
        if (pp) {
          var c = compose(), o = c.base, segs = segmentsFor(c);
          var vowel = o.kind === 'vowel' ? S.audio.formants(c.tract.vheight, c.tract.vback, c.tract.rounded) : null;
          S.withPlaying(pp, S.audio.playSegments(segs, vowel));
        }
      });
      el.querySelector('#sound-search').addEventListener('input', function (e) {
        var s = find(e.target.value);
        if (s && s !== sel) {
          var kept = {}; DIA.list.forEach(function (x) { if (dia[x.id] && DIA.fits(x, D.by[s])) kept[x.id] = true; });
          history.replaceState(null, '', hashFor(s, kept, pro));
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        }
      });
    },
    // param looks like "t?d=asp,pal&p=tf&open=dia". An empty symbol keeps the current sound.
    update: function (param) {
      var qi = (param || '').indexOf('?');
      var symPart = qi >= 0 ? param.slice(0, qi) : (param || '');
      var q = {};
      (qi >= 0 ? param.slice(qi + 1) : '').split('&').forEach(function (kv) {
        var i = kv.indexOf('=');
        if (i > 0) q[kv.slice(0, i)] = kv.slice(i + 1);
      });
      if (symPart && D.by[symPart]) sel = symPart;
      dia = {};
      (q.d || '').split(',').forEach(function (id) { if (diaById[id]) dia[id] = true; });
      pro = proById[q.p] ? q.p : null;
      var reveal = q.open === 'dia' || q.open === 'pro' ? q.open : null;
      if (reveal) open[reveal] = true;
      var baseChanged = sel !== lastBase, external = !fromMenu;
      // When the selected sound changes from outside the chart (a link, search, "Compare with"), show its chart.
      if (baseChanged && (external || !document.activeElement || !document.activeElement.closest('#menu'))) {
        chart = D.by[sel].kind === 'vowel' ? 'vow' : 'cons';
      }
      lastBase = sel;
      fromMenu = false;

      // Keep keyboard focus on the button that was pressed, since the menu is redrawn.
      var a = document.activeElement, focusSel = null;
      if (a && a.closest && a.closest('#menu')) {
        ['data-sym', 'data-dia', 'data-pro'].forEach(function (attr) {
          if (a.hasAttribute(attr)) focusSel = '#menu [' + attr + '="' + a.getAttribute(attr).replace(/"/g, '\\"') + '"]';
        });
      }
      render(focusSel);

      // Arriving from elsewhere (a link, search, an old address): bring the relevant part of the menu into view.
      if (reveal) { var fd = el.querySelector('[data-fold="' + reveal + '"]'); if (fd) fd.scrollIntoView({ block: 'start' }); }
      else if (external && baseChanged) {
        var btn = el.querySelector('#menu [data-sym].is-selected');
        if (btn && window.matchMedia('(min-width: 900px)').matches) btn.scrollIntoView({ block: 'center' });
      }
    }
  };
})(window.SIPA = window.SIPA || {});
