/* Transcribe: English text to broad IPA (General American). Each symbol in the result links to its sound. */
(function (S) {
  'use strict';
  var esc = S.esc;
  var el, loading = null, timer = null;
  var KEY = 'smartipa.transcribe';
  var opts = { r: 'ɹ', stress: true };
  var text = 'The quick brown fox jumps over the lazy dog.';
  try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) { text = saved.text; opts = saved.opts; } } catch (e) {}

  // The dictionary is about 3.6 MB, so it loads only when this tab is first opened.
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

  // Splits IPA into pieces, linking each one to its chart entry (or the stress marks to Prosody).
  function segments(ipa) {
    var out = [], ch = Array.from(ipa), D = S.sounds.by;
    for (var i = 0; i < ch.length; i++) {
      var c = ch[i], two = c + (ch[i + 1] || '');
      if (two === 'tʃ' || two === 'dʒ') { out.push({ t: two, href: 'sounds/' + (two === 'tʃ' ? 't͡ʃ' : 'd͡ʒ'), title: D[two === 'tʃ' ? 't͡ʃ' : 'd͡ʒ'].name }); i++; continue; }
      if (c === 'ˈ') out.push({ t: c, href: 'prosody/ps', title: 'Primary stress' });
      else if (c === 'ˌ') out.push({ t: c, href: 'prosody/ss', title: 'Secondary stress' });
      else if (c === 'ɚ') out.push({ t: c, href: 'sounds/ə', title: 'R-coloured schwa (ə with r-colouring)' });
      else if (c === 'ɝ') out.push({ t: c, href: 'sounds/ɜ', title: 'R-coloured open-mid central vowel (ɜ with r-colouring)' });
      else if (c === 'r' && opts.r === 'r') out.push({ t: c, href: 'sounds/ɹ', title: D['ɹ'].name });
      else if (D[c]) out.push({ t: c, href: 'sounds/' + c, title: D[c].name });
      else out.push({ t: c });
    }
    return out;
  }

  function renderResult() {
    var out = el.querySelector('#tr-out'), words = el.querySelector('#tr-words');
    if (!window.SMARTIPA_CMUDICT_RAW) return;
    var res = S.englishToIPA(text, opts);
    out.innerHTML = res.ipa ? segments(res.ipa).map(function (p) {
      return p.href ? '<a class="seg-link" href="#/' + esc(p.href) + '" title="' + esc(p.title) + '">' + esc(p.t) + '</a>' : esc(p.t);
    }).join('') : '<span class="empty">Type some English above.</span>';
    var rows = res.tokens.filter(function (t) { return t.type === 'word'; });
    words.innerHTML = rows.length ? rows.map(function (t) {
      return '<tr><td>' + esc(t.text) + '</td><td class="ipa">' + esc(t.ipa) + '</td><td><span class="tag tag-' + t.source + '">' + t.source +
        '</span></td><td class="ipa">' + esc(t.alternatives.join(', ')) + '</td></tr>';
    }).join('') : '<tr><td colspan="4" class="empty">No words yet.</td></tr>';
    var speak = el.querySelector('#tr-speak');
    speak.hidden = !S.audio.canSpeak('English (American)') || !text.trim();
    try { localStorage.setItem(KEY, JSON.stringify({ text: text, opts: opts })); } catch (e) {}
  }

  S.views.transcribe = {
    title: 'Transcribe',
    mount: function (root) {
      el = root;
      el.innerHTML = '<div class="narrow">' +
        '<div class="page-head"><h1>English to IPA</h1><p class="hint">Broad transcription, General American. Select any symbol in the result to see and hear it.</p></div>' +
        '<section class="card"><label for="tr-in" class="label">English text</label>' +
        '<textarea id="tr-in" spellcheck="false" rows="3"></textarea>' +
        '<div class="options"><label>r symbol <select id="tr-r"><option value="ɹ">ɹ (IPA)</option><option value="r">r (dictionary style)</option></select></label>' +
        '<label class="check"><input type="checkbox" id="tr-stress"> Stress marks</label></div></section>' +
        '<section class="card"><div class="block-head"><h2>Transcription</h2>' +
        '<button type="button" class="btn-icon" id="tr-speak" hidden aria-label="Say the text with this device’s voice">' + S.icons.speaker + '</button></div>' +
        '<div id="tr-out" class="ipa tr-out" aria-live="polite"><span class="empty">Loading the pronunciation dictionary…</span></div></section>' +
        '<section class="card"><h2>Word by word</h2><div class="scroll-x"><table class="table"><thead><tr><th>Word</th><th>IPA</th><th>Source</th><th>Other pronunciations</th></tr></thead>' +
        '<tbody id="tr-words"></tbody></table></div>' +
        '<p class="hint">dictionary: CMU Pronouncing Dictionary · derived: dictionary word plus a regular ending · spelled: read letter by letter · ' +
        'number: read as words · guess: spelling rules, often wrong.</p></section></div>';
      var input = el.querySelector('#tr-in');
      input.value = text;
      el.querySelector('#tr-r').value = opts.r;
      el.querySelector('#tr-stress').checked = opts.stress;
      input.addEventListener('input', function () {
        text = input.value;
        clearTimeout(timer);
        timer = setTimeout(renderResult, 120);
      });
      el.querySelector('#tr-r').addEventListener('change', function (e) { opts.r = e.target.value; renderResult(); });
      el.querySelector('#tr-stress').addEventListener('change', function (e) { opts.stress = e.target.checked; renderResult(); });
      el.querySelector('#tr-speak').addEventListener('click', function (e) {
        S.withPlaying(e.currentTarget, S.audio.speak(text, 'English (American)'));
      });
      document.addEventListener('sipa:voices', function () { if (el.isConnected) renderResult(); });
    },
    update: function () {
      document.title = 'English to IPA · SmartIPA';
      loadDictionary().then(renderResult, function () {
        el.querySelector('#tr-out').innerHTML = '<span class="empty">The pronunciation dictionary could not be loaded. Check that data/cmudict.js was uploaded with the site.</span>';
      });
    }
  };
})(window.SIPA = window.SIPA || {});
