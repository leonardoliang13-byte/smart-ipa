/* Transcribe: English text to IPA (General American). Two styles: the class handout (aj, ej, ow…) and the
   common textbook style (aɪ, eɪ, oʊ…). Words with more than one pronunciation can be switched, and the result
   can be copied in several formats. Each symbol in the result links to its sound. */
(function (S) {
  'use strict';
  var esc = S.esc;
  var el, loading = null, timer = null, last = null, copyTimer = null;
  var KEY = 'smartipa.transcribe.v2';
  var opts = { stress: true, phonetic: false };
  var text = 'The quick brown fox jumps over the lazy dog.';
  var choice = {}; // lower-case word -> chosen pronunciation index (this session only)
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) { text = saved.text; opts = { stress: saved.opts.stress !== false, phonetic: !!saved.opts.phonetic }; }
  } catch (e) {}

  var STYLES = {
    'class': { name: 'Class handout', hint: 'General American in the class conventions: /aj/ buy, /ɔj/ boy, /aw/ how, /ej/ date, /ow/ hope, /ɑ/ dog, /ɔ/ only before r (four), and /ɹ/ for r.' },
    textbook: { name: 'Textbook', hint: 'General American in the common textbook style: /aɪ/ buy, /ɔɪ/ boy, /aʊ/ how, /eɪ/ date, /oʊ/ hope, /ɔ/ in thought and dog, and /ɹ/ for r.' }
  };

  // The dictionary is about 1.6 MB (0.7 MB compressed), so it loads only when this tab is first opened.
  function loadDictionary() {
    if (window.SMARTIPA_CMUDICT_RAW) return Promise.resolve();
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = 'data/cmudict.js';
        s.onload = function () { resolve(); };
        s.onerror = function () { loading = null; reject(new Error('Dictionary failed to load')); };
        document.head.appendChild(s);
      });
    }
    return loading;
  }
  S.loadDictionary = loadDictionary;

  // Splits IPA into pieces, linking each one to its chart entry (or the stress marks to Prosody).
  function segments(ipa) {
    var out = [], ch = Array.from(ipa), D = S.sounds.by;
    for (var i = 0; i < ch.length; i++) {
      var c = ch[i], two = c + (ch[i + 1] || '');
      if (two === 'tʃ' || two === 'dʒ') { out.push({ t: two, href: 'sounds/' + (two === 'tʃ' ? 't͡ʃ' : 'd͡ʒ'), title: D[two === 'tʃ' ? 't͡ʃ' : 'd͡ʒ'].name }); i++; continue; }
      if (c === 'ˈ') out.push({ t: c, href: 'sounds/?p=ps', title: 'Primary stress' });
      else if (c === 'ˌ') out.push({ t: c, href: 'sounds/?p=ss', title: 'Secondary stress' });
      else if (c === 'ɚ') out.push({ t: c, href: 'sounds/ə?d=rho', title: 'R-coloured schwa (ə with r-colouring)' });
      else if (c === 'ɝ') out.push({ t: c, href: 'sounds/ɜ?d=rho', title: 'R-coloured open-mid central vowel (ɜ with r-colouring)' });
      else if (c === 'ʰ' && out.length && out[out.length - 1].href && /^sounds\/[ptk]$/.test(out[out.length - 1].href)) {
        var base = out[out.length - 1].href.slice(7);
        out.push({ t: c, href: 'sounds/' + base + '?d=asp', title: 'Aspirated ' + D[base].name.toLowerCase() });
      }
      else if (D[c]) out.push({ t: c, href: 'sounds/' + c, title: D[c].name });
      else out.push({ t: c });
    }
    return out;
  }

  // Runs the converter, then applies the pronunciations chosen in the word table.
  function compute() {
    var res = S.englishToIPA(text, { stress: opts.stress, phonetic: opts.phonetic, style: S.transcriptionStyle(), slashes: false });
    res.tokens.forEach(function (t) {
      if (t.type !== 'word') return;
      t.options = [t.ipa].concat(t.alternatives || []);
      var k = choice[t.text.toLowerCase()] || 0;
      t.pick = k < t.options.length ? k : 0;
      t.ipa = t.options[t.pick];
    });
    res.body = res.tokens.map(function (k) { return k.ipa; }).join('').replace(/\s+/g, ' ').trim();
    return res;
  }

  function renderResult() {
    var out = el.querySelector('#tr-out'), words = el.querySelector('#tr-words');
    if (!window.SMARTIPA_CMUDICT_RAW) return;
    var res = last = compute();
    out.innerHTML = res.body ? '<span class="bracket">/</span>' + segments(res.body).map(function (p) {
      return p.href ? '<a class="seg-link" href="#/' + esc(p.href) + '" title="' + esc(p.title) + '">' + esc(p.t) + '</a>' : esc(p.t);
    }).join('') + '<span class="bracket">/</span>' : '<span class="empty">Type some English above.</span>';
    var seen = {};
    var rows = res.tokens.filter(function (t) {
      if (t.type !== 'word') return false;
      var k = t.text.toLowerCase();
      if (seen[k]) return false;
      return (seen[k] = true);
    });
    words.innerHTML = rows.length ? rows.map(function (t) {
      var pron = t.options.length > 1
        ? '<div class="alt-picks" role="group" aria-label="Pronunciations of ' + esc(t.text) + '">' + t.options.map(function (x, i) {
          return '<button type="button" class="alt-pick ipa" data-word="' + esc(t.text.toLowerCase()) + '" data-pick="' + i + '" aria-pressed="' + (i === t.pick) + '">' + esc(x) + '</button>';
        }).join('') + '</div>'
        : '<span class="ipa">' + esc(t.ipa) + '</span>';
      return '<tr><td>' + esc(t.text) + '</td><td>' + pron + '</td><td><span class="tag tag-' + t.source + '">' + t.source + '</span></td></tr>';
    }).join('') : '<tr><td colspan="3" class="empty">No words yet.</td></tr>';
    var speak = el.querySelector('#tr-speak');
    speak.hidden = !S.audio.canSpeak('English (American)') || !text.trim();
    el.querySelector('#tr-copy-row').hidden = !res.body;
    try { localStorage.setItem(KEY, JSON.stringify({ text: text, opts: opts })); } catch (e) {}
  }

  function copyText(kind) {
    if (!last || !last.body) return '';
    if (kind === 'plain') return last.body;
    if (kind === 'brackets') return '[' + last.body + ']';
    if (kind === 'table') {
      var seen = {};
      return 'Word\tIPA\n' + last.tokens.filter(function (t) {
        if (t.type !== 'word' || seen[t.text.toLowerCase()]) return false;
        return (seen[t.text.toLowerCase()] = true);
      }).map(function (t) { return t.text + '\t/' + t.ipa + '/'; }).join('\n');
    }
    return '/' + last.body + '/';
  }
  function copy(kind, btn) {
    var value = copyText(kind), msg = el.querySelector('#tr-copy-msg');
    var done = function (ok) {
      msg.textContent = ok ? 'Copied.' : 'Copying is blocked here. Select the text and copy it instead.';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () { msg.textContent = ''; }, 2500);
    };
    // Older method, for browsers or frames where the Clipboard API is not allowed.
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = value; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      if (btn) btn.focus();
      done(ok);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(function () { done(true); }, fallback);
    else fallback();
  }

  function styleSwitch() {
    var cur = S.transcriptionStyle();
    return '<div class="segmented" role="group" aria-label="Transcription style">' + Object.keys(STYLES).map(function (k) {
      return '<button type="button" data-style="' + k + '" aria-pressed="' + (k === cur) + '">' + esc(STYLES[k].name) + '</button>';
    }).join('') + '</div>';
  }

  S.views.transcribe = {
    title: 'Transcribe',
    mount: function (root) {
      el = root;
      el.innerHTML = '<div class="narrow">' +
        '<div class="page-head"><h1>English to IPA</h1><p class="hint" id="tr-style-hint"></p></div>' +
        '<section class="card"><label for="tr-in" class="label">English text</label>' +
        '<textarea id="tr-in" spellcheck="false" rows="3"></textarea>' +
        '<div class="options"><div id="tr-style"></div><label class="check"><input type="checkbox" id="tr-stress"> Stress marks</label>' +
        '<label class="check"><input type="checkbox" id="tr-phonetic"> Aspiration and flaps (pʰ tʰ kʰ, ɾ)</label></div></section>' +
        '<section class="card"><div class="block-head"><h2>Transcription</h2>' +
        '<button type="button" class="btn-icon" id="tr-speak" hidden aria-label="Say the text with this device’s voice">' + S.icons.speaker + '</button></div>' +
        '<div id="tr-out" class="ipa tr-out" aria-live="polite"><span class="empty">Loading the pronunciation dictionary…</span></div>' +
        '<div class="copy-row" id="tr-copy-row" hidden><span class="eyebrow">Copy</span>' +
        '<button type="button" class="chip" data-copy="slashes">' + S.icons.copy + '/…/</button>' +
        '<button type="button" class="chip" data-copy="brackets">' + S.icons.copy + '[…]</button>' +
        '<button type="button" class="chip" data-copy="plain">' + S.icons.copy + 'Plain</button>' +
        '<button type="button" class="chip" data-copy="table">' + S.icons.copy + 'Word list</button>' +
        '<span class="hint" id="tr-copy-msg" role="status"></span></div>' +
        '<p class="hint">Select any symbol to see and hear it.</p></section>' +
        '<section class="card"><h2>Word by word</h2><p class="hint">Where a word has more than one pronunciation, select the one you want; the transcription above follows it.</p>' +
        '<div class="scroll-x"><table class="table"><thead><tr><th>Word</th><th>IPA</th><th>Source</th></tr></thead>' +
        '<tbody id="tr-words"></tbody></table></div>' +
        '<p class="hint">dictionary: CMU Pronouncing Dictionary · derived: dictionary word plus a regular ending · spelled: read letter by letter · ' +
        'number: read as words · guess: spelling rules, often wrong.</p></section></div>';
      var input = el.querySelector('#tr-in');
      input.value = text;
      el.querySelector('#tr-stress').checked = opts.stress;
      el.querySelector('#tr-phonetic').checked = opts.phonetic;
      var paintStyle = function () {
        el.querySelector('#tr-style').innerHTML = styleSwitch();
        el.querySelector('#tr-style-hint').textContent = STYLES[S.transcriptionStyle()].hint;
      };
      paintStyle();
      input.addEventListener('input', function () {
        text = input.value;
        clearTimeout(timer);
        timer = setTimeout(renderResult, 120);
      });
      el.querySelector('#tr-phonetic').addEventListener('change', function (e) { opts.phonetic = e.target.checked; renderResult(); });
      el.querySelector('#tr-stress').addEventListener('change', function (e) { opts.stress = e.target.checked; renderResult(); });
      el.addEventListener('click', function (e) {
        var st = e.target.closest('[data-style]');
        if (st) { S.setTranscriptionStyle(st.getAttribute('data-style')); paintStyle(); renderResult(); el.querySelector('[data-style="' + S.transcriptionStyle() + '"]').focus(); return; }
        var pk = e.target.closest('[data-pick]');
        if (pk) {
          choice[pk.getAttribute('data-word')] = +pk.getAttribute('data-pick');
          renderResult();
          var again = el.querySelector('[data-word="' + pk.getAttribute('data-word').replace(/"/g, '\\"') + '"][data-pick="' + pk.getAttribute('data-pick') + '"]');
          if (again) again.focus();
          return;
        }
        var cp = e.target.closest('[data-copy]');
        if (cp) copy(cp.getAttribute('data-copy'), cp);
      });
      el.querySelector('#tr-speak').addEventListener('click', function (e) {
        S.withPlaying(e.currentTarget, function () { return S.audio.speak(text, 'English (American)'); });
      });
      document.addEventListener('sipa:voices', function () { if (el.isConnected) renderResult(); });
    },
    update: function () {
      document.title = 'English to IPA · SmartIPA';
      // Text sent from the search palette ("Transcribe …").
      if (S.pendingTranscribe) {
        text = S.pendingTranscribe; S.pendingTranscribe = null;
        el.querySelector('#tr-in').value = text;
      }
      loadDictionary().then(renderResult, function () {
        el.querySelector('#tr-out').innerHTML = '<span class="empty">The pronunciation dictionary could not be loaded. Check that data/cmudict.js was uploaded with the site.</span>';
      });
    }
  };
})(window.SIPA = window.SIPA || {});
