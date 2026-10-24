/* Practice: short drills that test what the chart teaches. Route: #/practice/<mode>
   Modes: listen (hear a recording, pick the symbol), pairs (hear one of two close sounds, pick which), name (see a symbol, pick its name),
   diagram (read the vocal tract, pick the symbol), transcribe (write an English word in IPA, in the style chosen on the Transcribe page).
   A neutral tool: questions are drawn at random and nothing about past answers is kept. */
(function (S) {
  'use strict';
  var esc = S.esc, D = S.sounds;
  var MODES = [
    ['listen', 'Listen', 'Hear a sound, pick its symbol'],
    ['pairs', 'Pairs', 'Hear one of two close sounds, pick which'],
    ['name', 'Name it', 'See a symbol, pick its description'],
    ['diagram', 'Diagram', 'Read the vocal tract, pick the symbol'],
    ['transcribe', 'Transcribe', 'Write an English word in IPA']
  ];
  var SCOPES = [['all', 'All sounds'], ['cons', 'Consonants'], ['vow', 'Vowels'], ['english', 'Sounds of English']];
  // Phonemes of General American, as the class writes them (diphthongs are drilled in Transcribe).
  var ENGLISH = 'p b t d k ɡ m n ŋ f v θ ð s z ʃ ʒ h t͡ʃ d͡ʒ ɹ l j w ɾ ʔ i ɪ ɛ æ ɑ ɔ ʊ u ʌ ə'.split(' ');
  // Words for the Transcribe drill: everyday words that exercise the class's symbols.
  var WORDS = ('cat dog fish thin this ship measure judge chip sing hope date buy boy how bird butter sofa buck book boot heat hit bed ' +
    'four water yes west rat lamp think that shoe vision church jump ring house time voice road day sky cup father thought nurse letter ' +
    'mother city party little bottle button lazy music phone teacher garden window yellow rhythm').split(' ');
  // Keys for typing IPA in the Transcribe drill, in the order the class handout lists them.
  // On-screen keys; the diphthong keys follow the chosen transcription style.
  function keyList() {
    var d = S.transcriptionStyle() === 'textbook' ? 'aɪ aʊ ɔɪ eɪ oʊ' : 'aj aw ɔj ej ow';
    return ('ɑ æ ɛ ɪ i ʊ u ʌ ə ɚ ɝ ɔ ' + d + ' ŋ ɹ ʃ ʒ tʃ dʒ θ ð ɾ j w ʔ').split(' ');
  }

  // Contrasts that English speakers and learners often confuse, for the Pairs drill with "Sounds of English".
  var ENGLISH_PAIRS = ('s ʃ|θ s|θ f|ð d|ð z|v b|f p|ɹ l|i ɪ|u ʊ|ɛ æ|æ ʌ|ɑ ʌ|ɪ ɛ|n ŋ|t͡ʃ ʃ|d͡ʒ ʒ|p b|t d|k ɡ|s z|ʃ ʒ|ʊ ʌ|ɔ ɑ|w v|j d͡ʒ|h ʔ')
    .split('|').map(function (x) { return x.split(' '); });

  // Pairs for the current scope: the English list, or each sound with its nearest neighbour on the chart.
  function pairs() {
    if (scope === 'english') return ENGLISH_PAIRS.filter(function (p) { return D.by[p[0]].audio && D.by[p[1]].audio; });
    var list = pool(), ok = {}, out = [], seen = {};
    list.forEach(function (o) { ok[o.s] = true; });
    list.forEach(function (o) {
      S.related(o).forEach(function (r) {
        var k = [o.s, r[0]].sort().join(' ');
        if (ok[r[0]] && !seen[k]) { seen[k] = true; out.push([o.s, r[0]]); }
      });
    });
    return out;
  }

  var el, mode = 'listen', scope = 'all', q = null, answered = false, loadingDict = null;

  function pool() {
    var all = D.all.filter(function (o) { return o.audio; });
    if (scope === 'cons') return all.filter(function (o) { return o.kind === 'consonant'; });
    if (scope === 'vow') return all.filter(function (o) { return o.kind === 'vowel'; });
    if (scope === 'english') return all.filter(function (o) { return ENGLISH.indexOf(o.s) >= 0; });
    return all;
  }

  // A random sound, avoiding an immediate repeat.
  function pickTarget(list, avoid) {
    var choices = list.filter(function (o) { return o.s !== avoid; });
    return choices[Math.floor(Math.random() * choices.length)];
  }

  // Distractors that are plausibly confusable: same kind, sharing place, manner or voicing (or near on the vowel chart).
  function distractors(t, list, n) {
    var score = function (o) {
      if (o.kind !== t.kind) return -5;
      if (t.kind === 'vowel') return 3 - (Math.abs(o.h - t.h) * 3 + Math.abs(o.b - t.b) * 2) + (o.r === t.r ? 0.5 : 0);
      return (o.place === t.place ? 1.2 : 0) + (o.manner === t.manner ? 1 : 0) + (o.voiced === t.voiced ? 0.4 : 0);
    };
    var others = list.filter(function (o) { return o.s !== t.s; })
      .map(function (o) { return { o: o, s: score(o) + Math.random() * 0.8 }; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 8);
    shuffle(others);
    return others.slice(0, n).map(function (x) { return x.o; });
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function newQuestion() {
    answered = false;
    if (mode === 'transcribe') {
      var w = WORDS[Math.floor(Math.random() * WORDS.length)];
      if (q && q.word === w) w = WORDS[(WORDS.indexOf(w) + 1) % WORDS.length];
      q = { word: w, typed: '' };
      return;
    }
    if (mode === 'pairs') {
      var all = pairs(), prev = q && q.pair ? q.pair.join(' ') : '';
      var pick = all.filter(function (p) { return p.join(' ') !== prev; });
      var pr = pick[Math.floor(Math.random() * pick.length)];
      var a = D.by[pr[0]], b = D.by[pr[1]];
      q = { pair: pr, target: Math.random() < 0.5 ? a : b, options: shuffle([a, b]), picked: null };
      return;
    }
    var list = pool();
    var t = pickTarget(list, q && q.target ? q.target.s : null);
    var opts = shuffle([t].concat(distractors(t, list, 3)));
    q = { target: t, options: opts, picked: null };
  }


  function questionHTML() {
    var t = q.target;
    if (mode === 'listen') {
      return '<div class="pr-prompt"><p class="pr-ask">Which sound is this?</p><button type="button" class="btn-play pr-big-play" data-pr-play>' +
        S.icons.play + '<span>Play the sound</span></button><span class="play-msg" role="status"></span></div>';
    }
    if (mode === 'pairs') {
      return '<div class="pr-prompt"><p class="pr-ask">Which of the two did you hear: <span class="ipa">[' + esc(q.options[0].s) + ']</span> or <span class="ipa">[' + esc(q.options[1].s) + ']</span>?</p>' +
        '<button type="button" class="btn-play pr-big-play" data-pr-play>' + S.icons.play + '<span>Play the sound</span></button><span class="play-msg" role="status"></span></div>';
    }
    if (mode === 'name') {
      return '<div class="pr-prompt"><p class="pr-ask">What is this sound called?</p><div class="glyph ipa pr-glyph">' + esc(t.s) + '</div></div>';
    }
    return '<div class="pr-prompt"><p class="pr-ask">Which sound is the diagram showing?</p><div class="pr-tract">' + S.tractSVG(S.tractParams(t)) + '</div></div>';
  }

  function optionsHTML() {
    return '<div class="pr-options' + (mode === 'name' ? ' is-text' : '') + '">' + q.options.map(function (o, i) {
      var state = '';
      if (answered) state = o.s === q.target.s ? ' is-right' : o.s === q.picked ? ' is-wrong' : ' is-dim';
      var label = mode === 'name' ? '<span class="pr-opt-text">' + esc(o.name) + '</span>' : '<span class="ipa pr-opt-glyph">' + esc(o.s) + '</span>';
      return '<button type="button" class="pr-opt' + state + '" data-opt="' + esc(o.s) + '"' + (answered ? ' disabled' : '') + '>' +
        '<span class="pr-key">' + (i + 1) + '</span>' + label + '</button>';
    }).join('') + '</div>';
  }

  function feedbackHTML() {
    if (!answered) return '<p class="hint pr-tip">' + (mode === 'pairs' ? 'Keys 1 and 2 answer' : 'Keys 1 to 4 answer') + '; Enter goes to the next question.</p>';
    if (mode === 'pairs') {
      var ok = q.picked === q.target.s, a = q.options[0], b = q.options[1];
      return '<div class="pr-feedback ' + (ok ? 'is-right' : 'is-wrong') + '"><div><strong>' + (ok ? 'Correct.' : 'Not quite.') + '</strong> That was <span class="ipa">[' + esc(q.target.s) + ']</span>, the ' +
        esc(q.target.name.toLowerCase()) + '. ' + esc(S.compareSounds.sentence(a, b, S.compareSounds.differences(a, b))) + '</div>' +
        '<div class="pr-actions"><button type="button" class="btn-secondary" data-pr-hear-s="' + esc(a.s) + '">' + S.icons.play + '<span>[' + esc(a.s) + ']</span></button>' +
        '<button type="button" class="btn-secondary" data-pr-hear-s="' + esc(b.s) + '">' + S.icons.play + '<span>[' + esc(b.s) + ']</span></button>' +
        '<a class="btn-secondary" href="#/sounds/' + encodeURIComponent(a.s) + '?vs=' + encodeURIComponent(b.s) + '">Compare them</a>' +
        '<button type="button" class="btn-play" data-next>Next</button></div></div>';
    }
    var t = q.target, right = q.picked === t.s;
    return '<div class="pr-feedback ' + (right ? 'is-right' : 'is-wrong') + '">' +
      '<div><strong>' + (right ? 'Correct.' : 'Not quite.') + '</strong> <span class="ipa">[' + esc(t.s) + ']</span> is the ' + esc(t.name.toLowerCase()) + '.' +
      '</div>' +
      '<div class="pr-actions"><a class="btn-secondary" href="#/sounds/' + encodeURIComponent(t.s) + '">Open its lesson</a>' +
      (mode !== 'listen' ? '<button type="button" class="btn-secondary" data-pr-hear>' + S.icons.play + '<span>Hear it</span></button>' : '') +
      '<button type="button" class="btn-play" data-next>Next</button></div></div>';
  }

  // ---------- Transcribe drill ----------
  function loadDictionary() {
    if (window.SMARTIPA_CMUDICT_RAW) return Promise.resolve();
    if (S.loadDictionary) return S.loadDictionary();
    if (!loadingDict) {
      loadingDict = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'data/cmudict.js';
        s.onload = resolve;
        s.onerror = function () { loadingDict = null; reject(new Error('Dictionary failed to load')); };
        document.head.appendChild(s);
      });
    }
    return loadingDict;
  }
  var norm = function (s) {
    return String(s).toLowerCase().replace(/[\/\[\]ˈˌ.\s'’]/g, '').replace(/͡/g, '').replace(/g/g, 'ɡ').replace(/:/g, 'ː');
  };
  // Accepted answers: every dictionary pronunciation, in the chosen style first and then the other style.
  function answers(word) {
    var cur = S.transcriptionStyle(), other = cur === 'class' ? 'textbook' : 'class', out = [];
    [cur, other].forEach(function (st) {
      var r = S.SmartIPAWord(word, st);
      [r.ipa].concat(r.alternatives).forEach(function (x) { x = x.replace(/[ˈˌ]/g, ''); if (out.indexOf(x) < 0) out.push(x); });
    });
    return out;
  }

  function transcribeHTML() {
    if (!window.SMARTIPA_CMUDICT_RAW) return '<p class="empty">Loading the pronunciation dictionary…</p>';
    var keys = '<div class="pr-keys" aria-label="IPA keyboard">' + keyList().map(function (k) {
      return '<button type="button" class="pr-k ipa" data-key="' + esc(k) + '">' + esc(k) + '</button>';
    }).join('') + '<button type="button" class="pr-k pr-k-wide" data-key="⌫" aria-label="Delete last character">⌫</button></div>';
    var fb = '';
    if (answered) {
      var ok = answers(q.word).map(norm).indexOf(norm(q.typed)) >= 0;
      fb = '<div class="pr-feedback ' + (ok ? 'is-right' : 'is-wrong') + '"><div><strong>' + (ok ? 'Correct.' : 'Not quite.') + '</strong> ' +
        '<span class="ipa">/' + esc(answers(q.word)[0]) + '/</span>' + (answers(q.word).length > 1 ? ' <span class="hint">(also accepted: ' +
        answers(q.word).slice(1).map(function (a) { return '/' + esc(a) + '/'; }).join(', ') + ')</span>' : '') +
        (ok ? '' : '<div class="hint">You wrote <span class="ipa">/' + esc(q.typed) + '/</span>.</div>') + '</div>' +
        '<div class="pr-actions"><a class="btn-secondary" href="#/transcribe">Open in Transcribe</a><button type="button" class="btn-play" data-next>Next</button></div></div>';
    }
    return '<div class="pr-prompt"><p class="pr-ask">Transcribe this word (' + (S.transcriptionStyle() === 'textbook' ? 'textbook style' : 'class conventions') + ')</p><div class="pr-word">' + esc(q.word) + '</div>' +
      (S.audio.canSpeak('English (American)') ? '<button type="button" class="btn-secondary" data-pr-say>' + S.icons.speaker + '<span>Say it</span></button>' : '') + '</div>' +
      '<label class="label" for="pr-input">Your transcription <span class="hint">(stress marks optional)</span></label>' +
      '<div class="pr-input-row"><span class="pr-slash ipa">/</span><input id="pr-input" class="ipa pr-input" autocomplete="off" spellcheck="false" value="' + esc(q.typed) + '"' + (answered ? ' disabled' : '') + '><span class="pr-slash ipa">/</span>' +
      (answered ? '' : '<button type="button" class="btn-play" data-check>Check</button>') + '</div>' + (answered ? '' : keys) + fb;
  }


  function render() {
    var body = mode === 'transcribe' ? transcribeHTML() : questionHTML() + optionsHTML() + feedbackHTML();
    el.innerHTML = '<div class="narrow practice">' +
      '<div class="page-head"><h1>Practice</h1><p class="hint">Short drills on what the chart teaches. Each question is random, and nothing about your answers is saved.</p></div>' +
      '<div class="pr-modes" role="group" aria-label="Drill">' + MODES.map(function (m) {
        return '<a class="pr-mode' + (m[0] === mode ? ' is-selected' : '') + '" href="#/practice/' + m[0] + '"' + (m[0] === mode ? ' aria-current="true"' : '') + '>' +
          '<span class="pr-mode-name">' + esc(m[1]) + '</span><span class="pr-mode-sub">' + esc(m[2]) + '</span></a>';
      }).join('') + '</div>' +
      (mode === 'transcribe' ? '' : '<div class="pr-scopes" role="group" aria-label="Which sounds">' + SCOPES.map(function (s) {
        return '<button type="button" class="chip' + (s[0] === scope ? ' is-on' : '') + '" data-scope="' + s[0] + '" aria-pressed="' + (s[0] === scope) + '">' + esc(s[1]) + '</button>';
      }).join('') + '</div>') +
      '<section class="card pr-card">' + body + '</section></div>';
    var inp = el.querySelector('#pr-input');
    if (inp && !answered) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }

  function answer(sym) {
    if (answered || !q || mode === 'transcribe') return;
    q.picked = sym; answered = true;

    render();
  }
  function check() {
    if (answered || mode !== 'transcribe') return;
    var inp = el.querySelector('#pr-input');
    q.typed = inp ? inp.value : q.typed;
    if (!norm(q.typed)) return;
    answered = true;

    render();
  }
  function next() { newQuestion(); render(); }

  S.views.practice = {
    title: 'Practice',
    mount: function (root) {
      el = root;
      el.addEventListener('click', function (e) {
        var t;
        if ((t = e.target.closest('[data-opt]'))) return answer(t.getAttribute('data-opt'));
        if ((t = e.target.closest('[data-scope]'))) { scope = t.getAttribute('data-scope'); next(); return; }
        if (e.target.closest('[data-next]')) return next();
        if (e.target.closest('[data-check]')) return check();
        if ((t = e.target.closest('[data-pr-play]'))) return S.withPlaying(t, function () { return S.audio.playSound(q.target.s); });
        if ((t = e.target.closest('[data-pr-hear-s]'))) { var hs = t.getAttribute('data-pr-hear-s'); return S.withPlaying(t, function () { return S.audio.playSound(hs); }); }
        if ((t = e.target.closest('[data-pr-hear]'))) return S.withPlaying(t, function () { return S.audio.playSound(q.target.s); });
        if ((t = e.target.closest('[data-pr-say]'))) return S.withPlaying(t, function () { return S.audio.speak(q.word, 'English (American)'); });
        if ((t = e.target.closest('[data-key]'))) {
          var inp = el.querySelector('#pr-input'), k = t.getAttribute('data-key');
          if (!inp) return;
          inp.value = k === '⌫' ? Array.from(inp.value).slice(0, -1).join('') : inp.value + k;
          q.typed = inp.value; inp.focus();
        }
      });
      el.addEventListener('input', function (e) { if (e.target.id === 'pr-input') q.typed = e.target.value; });
      document.addEventListener('keydown', function (e) {
        if (!el.isConnected || el.hidden || e.altKey || e.ctrlKey || e.metaKey || document.body.classList.contains('has-palette')) return;
        if (mode === 'transcribe') {
          if (e.key === 'Enter') { e.preventDefault(); if (answered) next(); else check(); }
          return;
        }
        if (/^[1-4]$/.test(e.key) && !answered && q) { var o = q.options[+e.key - 1]; if (o) answer(o.s); }
        else if (e.key === 'Enter' && answered) { e.preventDefault(); next(); }
      });
    },
    update: function (param) {
      var m = (param || '').split('?')[0];
      var changed = false;
      if (MODES.some(function (x) { return x[0] === m; }) && m !== mode) { mode = m; changed = true; }
      if (!q || changed || (mode === 'transcribe') !== !!q.word) newQuestion();
      document.title = 'Practice · SmartIPA';
      render();
      if (mode === 'transcribe' && !window.SMARTIPA_CMUDICT_RAW) {
        loadDictionary().then(render, function () {
          el.querySelector('.pr-card').insertAdjacentHTML('beforeend', '<p class="empty">The pronunciation dictionary could not be loaded.</p>');
        });
      }
      // The Listen drill starts by playing the sound, where the browser allows it.
      if ((mode === 'listen' || mode === 'pairs') && !answered && q && q.target && changed) {
        var b = el.querySelector('[data-pr-play]');
        if (b) S.withPlaying(b, function () { return S.audio.playSound(q.target.s); });
      }
    }
  };
})(window.SIPA = window.SIPA || {});
