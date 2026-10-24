/* Sounds: the IPA chart on the left and the lesson on the right. Pick a sound; modify it with diacritics
   or a prosody mark from the tray inside the lesson, which explains the combination.
   Route: #/sounds/<symbol>?d=<diacritic ids>&p=<prosody id>&open=<dia|pro> (open picks the tray tab)
   Compare: #/sounds/<A>?vs=<B> puts two plain sounds side by side; chart clicks then change B. */
(function (S) {
  'use strict';
  var esc = S.esc, D = S.sounds, DIA = S.diacritics, PRO = S.prosody;
  var el, sel = 'p', dia = {}, pro = null, vs = null, lastBase = null, fromMenu = false;
  var trayTab = 'dia', trayOpenBlocked = false;
  // On phones the lesson is a sheet that slides up over the chart.
  var sheetOpen = false, touch = null;
  var isPhone = function () { return window.matchMedia('(max-width: 699px)').matches; };

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
    go(hashFor(base, d, p));
  }
  function compareHash(a, b) { return '#/sounds/' + encodeURIComponent(a) + '?vs=' + encodeURIComponent(b); }
  function go(h) {
    fromMenu = true;
    if (location.hash !== h) location.hash = h; else render();
  }
  // The applied diacritics that actually work together on this sound, in menu order.
  function activeDia(base) {
    var has = DIA.resolve(dia, base);
    return DIA.list.filter(function (x) { return has[x.id]; });
  }

  // ---------- Left menu ----------
  function symBtn(s, cls) {
    var o = D.by[s];
    var isB = vs && s === vs;
    return '<button type="button" class="' + cls + (s === sel ? ' is-selected' : '') + (isB ? ' is-compare' : '') + '" data-sym="' + esc(s) + '" tabindex="' + (s === sel ? 0 : -1) +
      '" aria-label="' + esc(o.name) + (vs ? (s === sel ? ', sound A' : isB ? ', sound B' : '') : '') + '" title="' + esc(o.name) + '" aria-pressed="' + (s === sel || !!isB) + '">' +
      '<span class="ipa">' + esc(s) + '</span>' + (vs && (s === sel || isB) ? '<span class="ab-badge" aria-hidden="true">' + (isB ? 'B' : 'A') + '</span>' : '') + '</button>';
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
        var isB = vs && s === vs;
        return '<button type="button" class="row-btn' + (s === sel ? ' is-selected' : '') + (isB ? ' is-compare' : '') + '" data-sym="' + esc(s) + '" tabindex="' + (s === sel ? 0 : -1) +
          '" aria-label="' + esc(D.by[s].name) + (vs ? (s === sel ? ', sound A' : isB ? ', sound B' : '') : '') + '" aria-pressed="' + (s === sel || !!isB) + '">' +
          '<span class="ipa">' + esc(s) + '</span><span class="row-sub">' + esc(D.by[s].short) + '</span>' +
          (vs && (s === sel || isB) ? '<span class="ab-badge" aria-hidden="true">' + (isB ? 'B' : 'A') + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    };
    // Second row: the vowel chart on the left, filling the row's height; non-pulmonic consonants and
    // other symbols stacked on the right, so no box is left with empty space.
    h += '<div class="three-up">' + vowelChart() + '<div class="side-col">' +
      '<section class="card np-card"><h2 class="sec-title">' + secIcon('cons', 'ʘ') + 'Non-pulmonic consonants</h2><div class="np">' +
      listGroup('Clicks', D.clicks) + listGroup('Voiced implosives', D.implosives) + listGroup('Ejectives', D.ejectives) +
      '</div></section><section class="card other-card"><h2 class="sec-title">' + secIcon('cons', 'w') + 'Other symbols</h2><div class="tiles">' +
      D.others.map(function (s) { return symBtn(s, 'tile-btn'); }).join('') +
      '</div><h3 class="sub-h">Affricates and double articulations</h3><p class="hint">Two symbols joined by a tie bar.</p><div class="tiles">' +
      D.affricates.map(function (s) { return symBtn(s, 'tile-btn wide'); }).join('') + '</div></section></div></div>';
    return h;
  }

  function vowelChart() {
    return '<section class="card vowel-card"><div class="card-head"><h2 class="sec-title">' + secIcon('vow', 'a') + 'Vowels</h2><p class="hint">Right-hand symbol of each pair is rounded.</p>' +
      '</div><div class="scroll-x"><div class="vowel-chart">' +
      '<div class="v-heights"><span style="top:0">Close</span><span style="top:33.3%">Close-mid</span><span style="top:66.7%">Open-mid</span><span style="top:100%">Open</span></div>' +
      '<div class="v-main"><div class="v-backs"><span style="left:0">Front</span><span style="left:50%">Central</span><span style="left:100%">Back</span></div>' +
      '<div class="v-area"><svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none">' +
      '<path d="M 0 0 L 100 0 L 100 100 L 50 100 Z M 50 0 L 75 100 M 16.7 33.3 L 100 33.3 M 33.3 66.7 L 100 66.7"></path></svg>' +
      D.vnodes.map(function (n) {
        return '<div class="v-node" style="left:' + n.left + ';top:' + n.top + '">' + n.syms.map(function (s) { return symBtn(s, 'v-btn'); }).join('') + '</div>';
      }).join('') + '</div></div></div></div></section>';
  }

  // ---------- Modify tray (in the lesson panel) ----------
  // Diacritics: the marks that can apply, by family; the ones that cannot are listed apart with reasons.
  function diacriticTray(c) {
    var base = c.base, has = {}, ids = c.active.map(function (x) { has[x.id] = true; return x.id; });
    var usable = [], blocked = [];
    DIA.list.forEach(function (x) {
      var why = has[x.id] ? '' : DIA.reason(x.id, base, has);
      (why ? blocked : usable).push({ x: x, why: why });
    });
    var chip = function (u) {
      var x = u.x, on = !!has[x.id];
      var recorded = !!S.diacriticAudio(base.s, on ? ids : ids.concat([x.id]));
      return '<button type="button" class="mod-chip' + (on ? ' is-selected' : '') + '" data-dia="' + x.id + '" aria-pressed="' + on + '" title="' + esc(x.name + ': ' + x.effect) + '">' +
        '<span class="ipa mod-glyph">' + esc(x.glyph) + '</span><span>' + esc(x.name) + '</span>' +
        (recorded ? '<span class="rec-dot" aria-label="has a recording">' + S.icons.speaker + '</span>' : '') + '</button>';
    };
    var families = [];
    DIA.groups.forEach(function (g) { g[3].forEach(function (f) { families.push(f); }); });
    var rows = families.map(function (f) {
      var inFam = usable.filter(function (u) { return u.x.family === f; });
      return inFam.length ? '<div class="mod-row"><div class="mod-row-name">' + esc(f) + '</div><div class="mod-chips">' + inFam.map(chip).join('') + '</div></div>' : '';
    }).join('');
    var blockedList = blocked.length ? '<details class="mod-blocked"' + (trayOpenBlocked ? ' open' : '') + '><summary>Not available for [' + esc(c.sym.replace(c.p ? c.p.sym : '', '').trim() || base.s) + '] (' + blocked.length + ')</summary><ul>' +
      blocked.map(function (u) {
        return '<li><span class="ipa">' + esc(u.x.glyph) + '</span><span class="mod-b-name">' + esc(u.x.name) + '</span><span class="hint">' + esc(u.why) + '</span></li>';
      }).join('') + '</ul></details>' : '';
    return '<p class="hint mod-note">' + S.icons.speaker + ' marks a combination with its own recording.</p>' + rows + blockedList;
  }

  function prosodyTray() {
    return '<p class="hint mod-note">Stress, length, breaks, tones and intonation belong to syllables and phrases. Pick one at a time.</p>' +
      PRO.groups.map(function (g) {
        return '<div class="mod-row"><div class="mod-row-name">' + esc(g[1]) + '</div><div class="mod-chips">' +
          PRO.items.filter(function (x) { return x.grp === g[0]; }).map(function (x) {
            var on = x.id === pro;
            return '<button type="button" class="mod-chip' + (on ? ' is-selected' : '') + '" data-pro="' + x.id + '" aria-pressed="' + on + '" title="' + esc(x.desc) + '">' +
              '<span class="ipa mod-glyph">' + esc(x.sym) + '</span><span>' + esc(x.name) + '</span></button>';
          }).join('') + '</div></div>';
      }).join('');
  }

  function tray(c) {
    var p = c.p, nDia = c.active.length;
    var applied = c.active.map(function (x) {
      return '<button type="button" class="chip" data-remove-dia="' + x.id + '" aria-label="Remove ' + esc(x.name) + '"><span class="ipa">' + esc(x.glyph) + '</span>' + esc(x.name) + S.icons.close + '</button>';
    }).join('') + (p ? '<button type="button" class="chip" data-remove-pro aria-label="Remove ' + esc(p.name) + '"><span class="ipa">' + esc(p.sym) + '</span>' + esc(p.name) + S.icons.close + '</button>' : '');
    return '<section class="tray" aria-label="Modify this sound"><div class="tray-head"><h2>Modify</h2>' +
      '<div class="segmented tray-tabs" role="tablist" aria-label="Kind of mark">' +
      '<button type="button" role="tab" data-tray="dia" aria-selected="' + (trayTab === 'dia') + '" aria-pressed="' + (trayTab === 'dia') + '">Diacritics' + (nDia ? ' · ' + nDia : '') + '</button>' +
      '<button type="button" role="tab" data-tray="pro" aria-selected="' + (trayTab === 'pro') + '" aria-pressed="' + (trayTab === 'pro') + '">Prosody' + (p ? ' · 1' : '') + '</button></div></div>' +
      (c.flavoured ? '<div class="chips tray-applied">' + applied + '<button type="button" class="chip chip-clear" data-clear>Clear all</button></div>' : '') +
      '<div class="tray-body" role="tabpanel">' + (trayTab === 'dia' ? diacriticTray(c) : prosodyTray()) + '</div></section>';
  }

  // Arrow keys move between chart symbols by position on screen: the nearest symbol in that direction,
  // preferring ones in line with the current one. Home and End go to the first and last symbol.
  function chartKey(e) {
    var cur = e.target.closest && e.target.closest('#menu [data-sym]');
    if (!cur) return;
    var all = Array.prototype.slice.call(el.querySelectorAll('#menu [data-sym]'));
    var target = null;
    if (e.key === 'Home') target = all[0];
    else if (e.key === 'End') target = all[all.length - 1];
    else {
      var dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!dir) return;
      var r = cur.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, best = Infinity;
      all.forEach(function (b) {
        if (b === cur) return;
        var q = b.getBoundingClientRect(), x = q.left + q.width / 2 - cx, y = q.top + q.height / 2 - cy;
        var along = x * dir[0] + y * dir[1], across = Math.abs(x * dir[1] - y * dir[0]);
        if (along <= 4) return;
        var score = along + across * 3;
        if (score < best) { best = score; target = b; }
      });
    }
    if (!target) return;
    e.preventDefault();
    all.forEach(function (b) { b.tabIndex = b === target ? 0 : -1; });
    target.focus();
    target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function renderMenu() {
    el.querySelector('#menu').innerHTML = consonantChart();
  }

  // ---------- Composition ----------
  function compose() {
    var base = D.by[sel], active = activeDia(base), has = {};
    active.forEach(function (x) { has[x.id] = true; });
    var p = pro ? proById[pro] : null;
    var rec = S.diacriticAudio(base.s, active.map(function (x) { return x.id; }));

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

    return { base: base, active: active, p: p, sym: sym, name: name, tract: t, rec: rec, flavoured: active.length > 0 || !!p };
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
      // Main play button: the pitch pattern for prosody, else the recording of this exact combination
      // when one exists, else the plain sound. A second button offers the plain sound for comparison.
      (p ? '<button type="button" class="btn-play" data-play-pitch>' + S.icons.play + '<span>Play pitch</span></button>'
        : c.rec ? '<button type="button" class="btn-play" data-play-dia>' + S.icons.play + '<span>Play [' + esc(c.sym) + ']</span></button>'
        : '<button type="button" class="btn-play" data-play-sound="' + esc(o.s) + '">' + S.icons.play + '<span>Play sound</span></button>') +
      (p && c.rec ? '<button type="button" class="btn-secondary" data-play-dia>' + S.icons.play + '<span>[' + esc(c.sym.replace(p.sym, '').trim()) + ']</span></button>' : '') +
      (c.flavoured && (p || c.rec) ? '<button type="button" class="btn-secondary" data-play-sound="' + esc(o.s) + '">' + S.icons.play + '<span>Plain [' + esc(o.s) + ']</span></button>' : '') +
      '<span class="play-msg" role="status"></span></div>' +
      // Speed and loop apply to recordings (the synthesized pitch keeps its own timing).
      '<div class="playback" role="group" aria-label="Playback"><div class="segmented speed" role="group" aria-label="Speed">' +
      [[0.5, '0.5×'], [0.75, '0.75×'], [1, '1×']].map(function (r) {
        var on = S.audio.settings.rate === r[0];
        return '<button type="button" data-rate="' + r[0] + '" aria-pressed="' + on + '">' + r[1] + '</button>';
      }).join('') + '</div><button type="button" class="toggle-btn" data-loop aria-pressed="' + S.audio.settings.loop + '">' + S.icons.loop + '<span>Loop</span></button></div>' +
      '</div></div>';

    if (c.active.length && !c.rec) h += '<p class="hint rec-note">No recording of [' + esc(c.sym.replace(p ? p.sym : '', '')) + '] yet, so Play uses plain [' + esc(o.s) + '].</p>';
    if (c.rec) {
      h += '<p class="hint rec-note">Recording: <a href="' + esc(c.rec.page) + '" target="_blank" rel="noopener">' + esc(c.rec.file) + '</a>' +
        (c.rec.author ? ' by ' + esc(c.rec.author) : '') + ', ' + esc(c.rec.licence) + ', via Wikimedia Commons' +
        (c.rec.written && c.rec.written !== c.sym ? ' (filed there as [' + esc(c.rec.written) + '])' : '') + '.</p>';
    }

    h += tray(c);

    h += '<div class="features">' + o.features.map(function (f) {
      return '<div class="feature"><div class="eyebrow">' + esc(f[0]) + '</div><div class="feature-v">' + esc(f[1]) + '</div></div>';
    }).join('') + '</div>';

    h += '<section class="block"><div class="block-head"><h2>How it is made</h2><button type="button" class="btn-secondary small" data-watch>' + S.icons.replay + '<span>Watch the movement</span></button></div>' +
      '<div class="tract-card"><div class="tract-wrap">' + S.tractSVG(c.tract, { animate: true }) +
      '</div><dl class="legend">' + info.legend.map(function (l) {
        return '<div><dt class="eyebrow">' + esc(l[0]) + '</dt><dd>' + esc(l[1]) + '</dd></div>';
      }).join('') + '</dl></div><p>' + esc(info.how) + '</p></section>';

    if (c.active.length) {
      h += '<section class="block"><h2>What the diacritics do</h2>' + c.active.map(function (x) {
        return '<div class="explain"><div class="explain-glyph ipa">' + esc(x.glyph) + '</div><div><div class="explain-name">' + esc(x.name) +
          ' <span class="hint">· ' + esc(x.family) + ' · used on ' + esc(x.applies.charAt(0).toLowerCase() + x.applies.slice(1)) + '</span></div>' +
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
      return '<button type="button" class="rel-btn" data-compare="' + esc(r[0]) + '" aria-label="Compare with ' + esc(D.by[r[0]].name) + '"><span class="ipa rel-glyph">' + esc(r[0]) + '</span><span>' + esc(r[1]) + '</span></button>';
    }).join('') + '</div><p class="hint">Opens the two sounds side by side.</p></section>';

    if (a) {
      h += '<p class="credit">Recording: <a href="' + esc(a.page) + '" target="_blank" rel="noopener">' + esc(a.file) + '</a>' +
        (a.author ? ' by ' + esc(a.author) : '') + ', ' + esc(a.licence) + ', via Wikimedia Commons.</p>';
    }
    return h;
  }

  // ---------- Compare two sounds ----------
  function rowsOf(o) { return [['Kind', o.cat]].concat(o.features); }
  function differences(a, b) {
    var ra = rowsOf(a), rb = rowsOf(b), labels = [];
    ra.concat(rb).forEach(function (r) { if (labels.indexOf(r[0]) < 0) labels.push(r[0]); });
    var get = function (rows, l) { var f = rows.filter(function (r) { return r[0] === l; })[0]; return f ? f[1] : '—'; };
    return labels.map(function (l) { var x = get(ra, l), y = get(rb, l); return { label: l, a: x, b: y, diff: x !== y }; });
  }
  function diffSentence(a, b, rows) {
    if (a.kind !== b.kind) return '[' + a.s + '] is a ' + a.kind + ' and [' + b.s + '] is a ' + b.kind + ', so they are made in quite different ways.';
    var WORD = { Voicing: 'voicing', Place: 'place of articulation', Manner: 'manner of articulation', Height: 'tongue height', Backness: 'backness', Lips: 'lip rounding' };
    var d = rows.filter(function (r) { return r.diff && r.label !== 'Kind'; }).map(function (r) { return WORD[r.label] || r.label.toLowerCase(); });
    var kind = rows[0].diff ? ' Their kinds also differ: ' + a.cat.toLowerCase() + ' versus ' + b.cat.toLowerCase() + '.' : '';
    if (!d.length) return '[' + a.s + '] and [' + b.s + '] share every feature listed on the chart.' + kind;
    var list = d.length === 1 ? d[0] : d.slice(0, -1).join(', ') + ' and ' + d[d.length - 1];
    return '[' + a.s + '] and [' + b.s + '] differ ' + (d.length === 1 && !kind ? 'only ' : '') + 'in ' + list + '.' + kind;
  }
  S.compareSounds = { differences: differences, sentence: diffSentence };

  function compareDetail(a, b) {
    var rows = differences(a, b);
    var side = function (o, tag) {
      return '<div class="cmp-side cmp-' + tag.toLowerCase() + '"><span class="ab-badge" aria-hidden="true">' + tag + '</span>' +
        '<div class="glyph ipa">' + esc(o.s) + '</div><div class="cmp-name">' + esc(o.name) + '</div>' +
        '<button type="button" class="btn-secondary small" data-play-sound="' + esc(o.s) + '">' + S.icons.play + '<span>Play ' + tag + '</span></button></div>';
    };
    var h = '<div class="cmp-head"><h1 class="eyebrow">Compare</h1><div class="cmp-tools">' +
      '<button type="button" class="btn-icon" data-swap aria-label="Swap A and B" title="Swap A and B">' + S.icons.swap + '</button>' +
      '<button type="button" class="btn-icon" data-exit-compare aria-label="Close compare" title="Close compare">' + S.icons.close + '</button></div></div>' +
      '<div class="cmp-pair">' + side(a, 'A') + side(b, 'B') + '</div>' +
      '<div class="hero-actions"><button type="button" class="btn-play" data-play-ab>' + S.icons.play + '<span>Play A B A B</span></button>' +
      '<span class="play-msg" role="status"></span></div>' +
      '<div class="playback" role="group" aria-label="Playback"><div class="segmented speed" role="group" aria-label="Speed">' +
      [[0.5, '0.5×'], [0.75, '0.75×'], [1, '1×']].map(function (r) {
        return '<button type="button" data-rate="' + r[0] + '" aria-pressed="' + (S.audio.settings.rate === r[0]) + '">' + r[1] + '</button>';
      }).join('') + '</div></div>' +
      '<p class="hint">Select any symbol in the chart to change B.</p>';

    h += '<section class="block"><h2>What differs</h2><p>' + esc(diffSentence(a, b, rows)) + '</p>' +
      '<div class="scroll-x"><table class="table cmp-table"><thead><tr><th></th><th>A <span class="ipa">[' + esc(a.s) + ']</span></th><th>B <span class="ipa">[' + esc(b.s) + ']</span></th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr' + (r.diff ? ' class="is-diff"' : '') + '><th scope="row">' + esc(r.label) + (r.diff ? ' <span class="diff-tag">differs</span>' : '') + '</th><td>' + esc(r.a) + '</td><td>' + esc(r.b) + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';

    h += '<section class="block"><h2>How they are made</h2><div class="tract-card"><div class="tract-wrap">' +
      S.tractCompareSVG(S.tractParams(a), S.tractParams(b), [a.name, b.name]) + '</div><dl class="legend cmp-legend">' +
      '<div><dt class="eyebrow"><span class="key key-a" aria-hidden="true"></span>A [' + esc(a.s) + ']</dt><dd>Solid line, red circle</dd></div>' +
      '<div><dt class="eyebrow"><span class="key key-b" aria-hidden="true"></span>B [' + esc(b.s) + ']</dt><dd>Dashed orange line, orange circle</dd></div>' +
      '</dl></div><p class="hint">Where only one line shows, both sounds use the same position.</p></section>';

    var words = [a, b].map(function (o, i) {
      var ex = o.ex; if (!ex) return '';
      var speakable = S.audio.canSpeak(ex.lang);
      return '<div class="example"><span class="ab-badge" aria-hidden="true">' + (i ? 'B' : 'A') + '</span><div class="example-text"><div><span class="ex-word">' + esc(ex.word) +
        '</span> <span class="ipa ex-ipa">' + esc(ex.ipa) + '</span></div><div class="hint">' + esc(ex.lang) + (ex.gloss ? ' · “' + esc(ex.gloss) + '”' : '') + '</div></div>' +
        (speakable ? '<button type="button" class="btn-icon" data-speak="' + esc(spokenForm(ex.word)) + '" data-lang="' + esc(ex.lang) + '" aria-label="Say the word with this device’s voice">' + S.icons.speaker + '</button>' : '') +
        '</div>';
    }).join('');
    if (words) h += '<section class="block"><h2>In words</h2><div class="cmp-words">' + words + '</div></section>';

    h += '<div class="cmp-open"><button type="button" class="btn-secondary small" data-sym-lesson="' + esc(a.s) + '">Lesson for [' + esc(a.s) + ']</button>' +
      '<button type="button" class="btn-secondary small" data-sym-lesson="' + esc(b.s) + '">Lesson for [' + esc(b.s) + ']</button></div>';
    [a, b].forEach(function (o) {
      if (o.audio) h += '<p class="credit">[' + esc(o.s) + '] recording: <a href="' + esc(o.audio.page) + '" target="_blank" rel="noopener">' + esc(o.audio.file) + '</a>' +
        (o.audio.author ? ' by ' + esc(o.audio.author) : '') + ', ' + esc(o.audio.licence) + ', via Wikimedia Commons.</p>';
    });
    return h;
  }

  // Previous and next sound in chart order, for the phone sheet.
  function neighbour(step) {
    var i = D.all.indexOf(D.by[sel]);
    return D.all[(i + step + D.all.length) % D.all.length];
  }
  function sheetBar() {
    var bar = el.querySelector('.sheet-bar');
    var prev = neighbour(-1), next = neighbour(1);
    bar.querySelector('.sheet-title').textContent = vs ? 'Compare [' + sel + '] and [' + vs + ']' : 'Lesson';
    var bp = bar.querySelector('[data-step="-1"]'), bn = bar.querySelector('[data-step="1"]');
    bp.hidden = bn.hidden = !!vs;
    bp.setAttribute('aria-label', 'Previous sound: ' + prev.name);
    bn.setAttribute('aria-label', 'Next sound: ' + next.name);
    bp.querySelector('.ipa').textContent = prev.s;
    bn.querySelector('.ipa').textContent = next.s;
  }
  function setSheet(open) {
    sheetOpen = open;
    var pane = el.querySelector('#lesson'), phone = isPhone();
    pane.classList.toggle('is-open', open);
    el.querySelector('.sheet-backdrop').hidden = !(open && phone);
    document.body.classList.toggle('has-sheet', open && phone);
    if (phone) {
      pane.setAttribute('role', 'dialog'); pane.setAttribute('aria-modal', String(open));
      pane.inert = !open;
      if (!open) {
        var btn = el.querySelector('#menu [data-sym].is-selected');
        if (btn) btn.focus({ preventScroll: true });
      }
    } else {
      pane.removeAttribute('role'); pane.removeAttribute('aria-modal'); pane.inert = false;
    }
  }

  function render(focusSel) {
    renderMenu();
    if (vs) {
      el.querySelector('#detail').innerHTML = compareDetail(D.by[sel], D.by[vs]);
      document.title = sel + ' vs ' + vs + ' · Compare · SmartIPA';
    } else {
      var c = compose();
      el.querySelector('#detail').innerHTML = detail(c);
      document.title = c.sym + ' · ' + c.name + ' · SmartIPA';
    }
    sheetBar();
    if (focusSel) { var f = el.querySelector(focusSel); if (f) f.focus(); }
  }

  S.views.sounds = {
    title: 'Sounds',
    mount: function (root) {
      el = root;
      el.innerHTML = '<div class="split"><section class="pane-main" aria-label="IPA chart">' +
        '<div class="toolbar"><div class="toolbar-title"><h1 class="page-title">IPA chart</h1></div>' +
        '<button type="button" class="search search-btn" data-open-palette>' + S.icons.search + '<span>Search sounds</span><span class="kbd">Ctrl K</span></button></div>' +
        '<p class="sr-only" id="chart-help">In the chart, use the arrow keys to move between symbols and Enter to open one.</p>' +
        '<div id="menu" role="group" aria-label="IPA chart" aria-describedby="chart-help"></div></section>' +
        '<aside class="pane-detail" id="lesson" aria-label="Lesson"><div class="sheet-bar"><span class="sheet-grabber" aria-hidden="true"></span>' +
        '<button type="button" class="btn-icon sheet-step" data-step="-1"><span aria-hidden="true">‹</span><span class="ipa"></span></button>' +
        '<span class="sheet-title"></span>' +
        '<button type="button" class="btn-icon sheet-step" data-step="1"><span class="ipa"></span><span aria-hidden="true">›</span></button>' +
        '<button type="button" class="btn-icon" data-close-sheet aria-label="Close the lesson">' + S.icons.close + '</button></div>' +
        '<div id="detail" class="detail-body" aria-live="polite"></div></aside></div>' +
        '<div class="sheet-backdrop" data-close-sheet hidden></div>';

      // Phone sheet: Escape or a swipe down on its bar closes it; a sideways swipe moves to the next sound.
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && sheetOpen && isPhone() && !el.hidden && !document.body.classList.contains('has-palette')) setSheet(false);
      });
      var lesson = el.querySelector('#lesson');
      lesson.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        touch = { x: t.clientX, y: t.clientY, bar: !!e.target.closest('.sheet-bar'), scrolled: lesson.scrollTop > 0 };
      }, { passive: true });
      lesson.addEventListener('touchend', function (e) {
        if (!touch || !isPhone()) return;
        var t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
        var onControl = e.target.closest('input, textarea, .scroll-x, .segmented');
        if ((touch.bar || !touch.scrolled) && dy > 90 && Math.abs(dx) < 60) setSheet(false);
        else if (!vs && !onControl && Math.abs(dx) > 70 && Math.abs(dy) < 40) navigate(neighbour(dx < 0 ? 1 : -1).s, {}, null);
        touch = null;
      }, { passive: true });
      window.matchMedia('(max-width: 699px)').addEventListener('change', function () { setSheet(sheetOpen); });

      // Remember whether the "Not available" list in the tray is open across redraws.
      el.addEventListener('toggle', function (e) {
        if (e.target.classList && e.target.classList.contains('mod-blocked')) trayOpenBlocked = e.target.open;
      }, true);

      el.addEventListener('keydown', chartKey);
      el.addEventListener('click', function (e) {
        var tb = e.target.closest('[data-tray]');
        if (tb) { trayTab = tb.getAttribute('data-tray'); render('#detail [data-tray="' + trayTab + '"]'); return; }
        var rt = e.target.closest('[data-rate]');
        if (rt) { S.audio.settings.rate = +rt.getAttribute('data-rate'); render('#detail [data-rate="' + rt.getAttribute('data-rate') + '"]'); return; }
        if (e.target.closest('[data-loop]')) { S.audio.settings.loop = !S.audio.settings.loop; S.audio.stop(); render('#detail [data-loop]'); return; }
        var cmp = e.target.closest('[data-compare]');
        if (cmp) { go(compareHash(sel, cmp.getAttribute('data-compare'))); return; }
        if (e.target.closest('[data-swap]')) { go(compareHash(vs, sel)); return; }
        if (e.target.closest('[data-exit-compare]')) { go(hashFor(sel, {}, null)); return; }
        var lesson = e.target.closest('[data-sym-lesson]');
        if (lesson) { go(hashFor(lesson.getAttribute('data-sym-lesson'), {}, null)); return; }
        var ab = e.target.closest('[data-play-ab]');
        if (ab) {
          var A = D.by[sel], B = D.by[vs], sides = el.querySelectorAll('#detail .cmp-side');
          var mark = function (i) { Array.prototype.forEach.call(sides, function (n, k) { n.classList.toggle('is-sounding', i >= 0 && k === i % 2); }); };
          S.withPlaying(ab, function () {
            return S.audio.playSequence([A.audio, B.audio, A.audio, B.audio], 450, mark).then(function () { mark(-1); }, function (err) { mark(-1); throw err; });
          });
          return;
        }
        if (e.target.closest('[data-watch]')) { S.tractAnimate(el.querySelector('#detail svg.tract')); return; }
        // Playing the sound also plays the movement on the diagram.
        if (e.target.closest('#detail [data-play-sound], #detail [data-play-dia], #detail [data-play-pitch]')) S.tractAnimate(el.querySelector('#detail svg.tract'));
        var b = e.target.closest('[data-sym]');
        if (e.target.closest('[data-close-sheet]')) { setSheet(false); return; }
        var stp = e.target.closest('[data-step]');
        if (stp) { navigate(neighbour(+stp.getAttribute('data-step')).s, {}, null); return; }
        if (b && vs) {
          // In compare mode the chart picks B (picking A again swaps them).
          var t = b.getAttribute('data-sym');
          go(t === sel ? compareHash(vs, sel) : compareHash(sel, t));
          if (isPhone()) setSheet(true);
          return;
        }
        if (b) {
          var s = b.getAttribute('data-sym');
          var kept = DIA.resolve(dia, D.by[s]);
          navigate(s, kept, pro);
          if (isPhone()) { setSheet(true); el.querySelector('#lesson').scrollTop = 0; }
          else if (window.matchMedia('(max-width: 899px)').matches) el.querySelector('#lesson').scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        var d = e.target.closest('[data-dia]');
        if (d) {
          // Blocked marks stay focusable so their reason can be read, but adding them does nothing.
          if (d.getAttribute('aria-disabled') === 'true') return;
          var id = d.getAttribute('data-dia'), next = DIA.resolve(dia, D.by[sel]);
          if (next[id]) delete next[id]; else next[id] = true;
          navigate(sel, DIA.resolve(next, D.by[sel]), pro);
          return;
        }
        var pd = e.target.closest('[data-play-dia]');
        if (pd) { var cc = compose(); if (cc.rec) S.withPlaying(pd, function () { return S.audio.playClip(cc.rec); }); return; }
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
          S.withPlaying(pp, function () { return S.audio.playSegments(segs, vowel); });
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
      var v = q.vs ? decodeURIComponent(q.vs) : null;
      vs = v && D.by[v] && v !== sel ? v : null;
      if (vs) { dia = {}; pro = null; }
      var reveal = q.open === 'dia' || q.open === 'pro' ? q.open : null;
      if (reveal) trayTab = reveal;
      else if (pro && !Object.keys(dia).length && !fromMenu) trayTab = 'pro';
      var baseChanged = sel !== lastBase, external = !fromMenu;
      if (external && (symPart || q.vs || q.open)) sheetOpen = true;
      lastBase = sel;
      fromMenu = false;

      // Keep keyboard focus on the button that was pressed, since both panes are redrawn.
      var a = document.activeElement, focusSel = null;
      if (a && a.closest) {
        var pane = a.closest('#menu') ? '#menu' : a.closest('#detail') ? '#detail' : null;
        if (pane) ['data-sym', 'data-dia', 'data-pro'].forEach(function (attr) {
          if (a.hasAttribute(attr)) focusSel = pane + ' [' + attr + '="' + a.getAttribute(attr).replace(/"/g, '\\"') + '"]';
        });
      }
      render(focusSel);
      setSheet(sheetOpen);

      // Arriving from elsewhere (a link, search, an old address): bring the relevant part into view.
      if (reveal) { var tr = el.querySelector('#detail .tray'); if (tr) tr.scrollIntoView({ block: 'nearest' }); }
      else if (external && baseChanged) {
        var btn = el.querySelector('#menu [data-sym].is-selected');
        if (btn && window.matchMedia('(min-width: 900px)').matches) btn.scrollIntoView({ block: 'center' });
      }
    }
  };
})(window.SIPA = window.SIPA || {});
