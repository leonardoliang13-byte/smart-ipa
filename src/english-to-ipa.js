/*
 * SmartIPA: English text to IPA, General American, following the class conventions in
 * "IPA for English" (rev. 2025-01-08):
 *   - diphthongs /aj/ (buy), /ɔj/ (boy), /aw/ (how), /ej/ (date), /ow/ (hope)
 *   - /ɑ/ for the vowel in "dog"; /ɔ/ only before r, as in "four"
 *   - /ɹ/ for English r, never /r/
 *   - /ə/, /ɚ/ in unstressed syllables; /ʌ/, /ɝ/ in stressed ones
 *   - optional phonetic detail (opts.phonetic): aspirated pʰ tʰ kʰ at the start of a stressed or
 *     word-initial syllable (not after s, as in "spin"), and the flap ɾ for t/d between a vowel
 *     (or r) and an unstressed vowel, as in "butter"
 *
 * Lookup order for each word:
 *   1. dictionary  - CMU Pronouncing Dictionary (data/cmudict.js)
 *   2. derived     - a dictionary stem plus a regular ending (-s, -'s, -ed, -ing, -ly, -er, -est, -ness)
 *   3. spelled     - short all-caps words read letter by letter
 *   4. guess       - spelling-to-sound rules; unreliable, always flagged
 *
 * Usage:
 *   SmartIPA.transcribe('Hello world')            -> '/həˈlow wɝld/'
 *   SmartIPA.transcribe('potato', { phonetic: true }) -> '/pʰəˈtʰejɾow/'
 *   SmartIPA.englishToIPA('Hello world').tokens   -> per-word detail with source and alternatives
 */
(function (root) {
  'use strict';

  // AO is handled separately: /ɔ/ before r, otherwise /ɑ/ (class convention: "dog" is /dɑɡ/).
  var VOWELS = {
    AA: 'ɑ', AE: 'æ', AW: 'aw', AY: 'aj', EH: 'ɛ', EY: 'ej', IH: 'ɪ', IY: 'i',
    OW: 'ow', OY: 'ɔj', UH: 'ʊ', UW: 'u'
  };
  var CONSONANTS = {
    B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', F: 'f', G: 'ɡ', HH: 'h', JH: 'dʒ', K: 'k', L: 'l', M: 'm',
    N: 'n', NG: 'ŋ', P: 'p', R: 'ɹ', S: 's', SH: 'ʃ', T: 't', TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ'
  };
  var ONSETS = {};
  ('P L|P R|P Y|B L|B R|B Y|T R|T W|D R|D W|K L|K R|K W|K Y|G L|G R|G W|F L|F R|F Y|TH R|TH W|SH R|' +
    'S P|S T|S K|S M|S N|S L|S W|S F|HH Y|M Y|V Y|S P L|S P R|S P Y|S T R|S K R|S K W|S K Y')
    .split('|').forEach(function (c) { ONSETS[c] = true; });
  var LETTERS = {
    a: 'ej', b: 'bi', c: 'si', d: 'di', e: 'i', f: 'ɛf', g: 'dʒi', h: 'ejtʃ', i: 'aj', j: 'dʒej', k: 'kej',
    l: 'ɛl', m: 'ɛm', n: 'ɛn', o: 'ow', p: 'pi', q: 'kju', r: 'ɑɹ', s: 'ɛs', t: 'ti', u: 'ju', v: 'vi',
    w: 'dʌbəlju', x: 'ɛks', y: 'waj', z: 'zi'
  };

  var dict = null;

  // Parses CMUdict text ("word PH PH PH", variants as "word(2)") into a Map of word -> [pronunciations].
  function loadDictionary(raw) {
    var map = new Map();
    var lines = raw.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var hash = line.indexOf(' #');
      if (hash >= 0) line = line.slice(0, hash);
      var sp = line.indexOf(' ');
      if (sp <= 0) continue;
      var word = line.slice(0, sp);
      var paren = word.indexOf('(');
      if (paren > 0) word = word.slice(0, paren);
      var pron = line.slice(sp + 1).trim();
      var list = map.get(word);
      if (!list) map.set(word, [pron]);
      else if (list.indexOf(pron) < 0) list.push(pron);
    }
    dict = map;
    return map.size;
  }

  function getDict() {
    if (!dict && root.SMARTIPA_CMUDICT_RAW) loadDictionary(root.SMARTIPA_CMUDICT_RAW);
    return dict;
  }

  // ARPABET string -> IPA, placing stress marks before the onset of the stressed syllable.
  function arpabetToIPA(pron, opts) {
    var ph = pron.split(' ').filter(function (p) { return /^[A-Z]+[012]?$/.test(p); });
    var names = ph.map(function (p) { return p.replace(/[012]$/, ''); });
    var stress = ph.map(function (p) { var m = /[012]$/.exec(p); return m ? m[0] : null; });
    var isVowel = stress.map(function (s) { return s !== null; });
    var count = isVowel.filter(Boolean).length;

    // Where each syllable's onset starts: between two vowels, the longest legal English onset.
    var onsetOf = {};
    for (var v = 0; v < ph.length; v++) {
      if (!isVowel[v]) continue;
      var start = v;
      while (start > 0 && !isVowel[start - 1]) start--;
      var onset = start;
      if (start > 0) {
        onset = v;
        for (var k = Math.min(3, v - start); k >= 1; k--) {
          var cluster = names.slice(v - k, v).join(' ');
          if (k === 1 ? cluster !== 'NG' : ONSETS[cluster]) { onset = v - k; break; }
        }
      }
      onsetOf[v] = onset;
    }
    // The vowel whose syllable a consonant at index i begins (if i is the first consonant of an onset).
    var syllableStartingAt = function (i) {
      for (var nv = i + 1; nv < ph.length; nv++) if (isVowel[nv]) return onsetOf[nv] === i ? nv : -1;
      return -1;
    };

    var noMark = {}; // syllables whose stress mark is dropped because they begin with a flap
    var parts = names.map(function (n, i) {
      if (isVowel[i]) {
        var s = stress[i];
        if (n === 'AH') return s === '0' ? 'ə' : 'ʌ';
        if (n === 'ER') return s === '0' ? 'ɚ' : 'ɝ';
        if (n === 'AO') return names[i + 1] === 'R' ? 'ɔ' : 'ɑ';
        return VOWELS[n] || '';
      }
      var c = CONSONANTS[n] || '';
      if (opts.phonetic) {
        // Flap: t or d after a vowel (or r) and before a vowel without primary stress, as in "butter",
        // "water", "party", "potato". CMUdict sometimes gives such final syllables secondary stress; a flap
        // cannot begin a stressed syllable, so that syllable's stress mark is dropped.
        if ((n === 'T' || n === 'D') && i > 0 && (isVowel[i - 1] || names[i - 1] === 'R') && isVowel[i + 1] && stress[i + 1] !== '1') {
          noMark[i + 1] = true;
          return 'ɾ';
        }
        // Aspiration: p, t, k beginning a stressed or word-initial syllable, but not after s ("spin", "stop").
        if (n === 'P' || n === 'T' || n === 'K') {
          var sv = syllableStartingAt(i);
          if (sv >= 0 && (stress[sv] !== '0' || i === 0)) c += 'ʰ';
        }
      }
      return c;
    });

    var marks = {};
    if (opts.stress && (count > 1 || opts.stressMonosyllables)) {
      Object.keys(onsetOf).forEach(function (key) {
        var vi = +key;
        if (stress[vi] !== '0' && !noMark[vi]) marks[onsetOf[vi]] = stress[vi] === '1' ? 'ˈ' : 'ˌ';
      });
    }
    var out = '';
    for (var j = 0; j < parts.length; j++) out += (marks[j] || '') + parts[j];
    return out;
  }

  function lastPhone(pron) { return pron.slice(pron.lastIndexOf(' ') + 1).replace(/[012]$/, ''); }

  // Regular endings applied to a dictionary stem, in ARPABET.
  function derive(word, d) {
    var tries = [];
    var add = function (stem, fn) { if (stem.length > 1) tries.push([stem, fn]); };
    var plural = function (p) {
      var l = lastPhone(p);
      return p + (/^(S|Z|SH|ZH|CH|JH)$/.test(l) ? ' IH0 Z' : /^(P|T|K|F|TH)$/.test(l) ? ' S' : ' Z');
    };
    var past = function (p) {
      var l = lastPhone(p);
      return p + (/^(T|D)$/.test(l) ? ' IH0 D' : /^(P|K|F|TH|S|SH|CH)$/.test(l) ? ' T' : ' D');
    };
    var suffix = function (s) { return function (p) { return p + ' ' + s; }; };
    var undouble = function (stem) { return /([b-df-hj-np-tv-z])\1$/.test(stem) ? stem.slice(0, -1) : null; };
    var m;
    if ((m = /^(.+)'s$/.exec(word)) || (m = /^(.+s)'$/.exec(word))) add(m[1], /s'$/.test(word) ? function (p) { return p; } : plural);
    if ((m = /^(.+)ies$/.exec(word))) add(m[1] + 'y', plural);
    if ((m = /^(.+)es$/.exec(word))) add(m[1], plural);
    if ((m = /^(.+)s$/.exec(word))) add(m[1], plural);
    if ((m = /^(.+)ied$/.exec(word))) add(m[1] + 'y', past);
    if ((m = /^(.+)ed$/.exec(word))) { add(m[1], past); add(m[1] + 'e', past); if (undouble(m[1])) add(undouble(m[1]), past); }
    if ((m = /^(.+)ing$/.exec(word))) { var ing = suffix('IH0 NG'); add(m[1], ing); add(m[1] + 'e', ing); if (undouble(m[1])) add(undouble(m[1]), ing); }
    if ((m = /^(.+)ly$/.exec(word))) add(m[1], suffix('L IY0'));
    if ((m = /^(.+)ness$/.exec(word))) add(m[1], suffix('N AH0 S'));
    if ((m = /^(.+)est$/.exec(word))) { add(m[1], suffix('AH0 S T')); add(m[1] + 'e', suffix('AH0 S T')); }
    if ((m = /^(.+)er$/.exec(word))) { add(m[1], suffix('ER0')); add(m[1] + 'e', suffix('ER0')); }
    for (var i = 0; i < tries.length; i++) {
      var hit = d.get(tries[i][0]);
      if (hit) return hit.map(tries[i][1]);
    }
    return null;
  }

  // Spelling-to-sound fallback for words the dictionary cannot resolve. Output is IPA, without stress.
  var DIGRAPHS = [
    ['tion', 'ʃən'], ['sion', 'ʒən'], ['ough', 'ow'], ['augh', 'ɑ'], ['eigh', 'ej'], ['igh', 'aj'], ['tch', 'tʃ'],
    ['dge', 'dʒ'], ['sch', 'sk'], ['ch', 'tʃ'], ['sh', 'ʃ'], ['th', 'θ'], ['ph', 'f'], ['wh', 'w'], ['ck', 'k'],
    ['ng', 'ŋ'], ['qu', 'kw'], ['gh', ''], ['ee', 'i'], ['ea', 'i'], ['oo', 'u'], ['ou', 'aw'], ['ow', 'ow'],
    ['oi', 'ɔj'], ['oy', 'ɔj'], ['ai', 'ej'], ['ay', 'ej'], ['au', 'ɑ'], ['aw', 'ɑ'], ['oa', 'ow'], ['ie', 'i'],
    ['ei', 'ej'], ['ey', 'i'], ['ew', 'u'], ['ue', 'u'], ['ui', 'u']
  ];
  var R_VOWELS = [['ar', 'ɑɹ'], ['er', 'ɚ'], ['ir', 'ɝ'], ['ur', 'ɝ'], ['or', 'ɔɹ']];
  var SHORT = { a: 'æ', e: 'ɛ', i: 'ɪ', o: 'ɑ', u: 'ʌ' };
  var LONG = { a: 'ej', e: 'i', i: 'aj', o: 'ow', u: 'u' };
  var PLAIN = { b: 'b', d: 'd', f: 'f', h: 'h', j: 'dʒ', k: 'k', l: 'l', m: 'm', n: 'n', p: 'p', q: 'k', r: 'ɹ', t: 't', v: 'v', w: 'w', z: 'z' };

  function guess(word) {
    var w = word.toLowerCase().replace(/[^a-z]/g, '');
    var isV = function (c) { return !!c && 'aeiou'.indexOf(c) >= 0; };
    var out = '', i = 0;
    if (/^kn/.test(w)) { out = 'n'; i = 2; } else if (/^wr/.test(w)) { out = 'ɹ'; i = 2; }
    outer: while (i < w.length) {
      var rest = w.slice(i), c = w[i], next = w[i + 1], prev = w[i - 1];
      for (var a = 0; a < DIGRAPHS.length; a++) {
        if (rest.indexOf(DIGRAPHS[a][0]) === 0) { out += DIGRAPHS[a][1]; i += DIGRAPHS[a][0].length; continue outer; }
      }
      for (var b = 0; b < R_VOWELS.length; b++) {
        if (rest.indexOf(R_VOWELS[b][0]) === 0 && !isV(w[i + 2])) { out += R_VOWELS[b][1]; i += 2; continue outer; }
      }
      if (c === next && !isV(c)) { i++; continue; }
      if (isV(c)) {
        var magicE = next && !isV(next) && w[i + 2] === 'e' && i + 3 === w.length;
        if (c === 'e' && i === w.length - 1 && /[aeiouy]/.test(w.slice(0, i))) { i++; continue; }
        out += magicE ? LONG[c] : SHORT[c];
      } else if (c === 'y') {
        out += i === 0 ? 'j' : i === w.length - 1 ? (w.length > 3 ? 'i' : 'aj') : 'ɪ';
      } else if (c === 'c') {
        out += /[eiy]/.test(next || '') ? 's' : 'k';
      } else if (c === 'g') {
        out += /[eiy]/.test(next || '') ? 'dʒ' : 'ɡ';
      } else if (c === 's') {
        out += isV(prev) && isV(next) ? 'z' : 's';
      } else if (c === 'x') {
        out += 'ks';
      } else {
        out += PLAIN[c] || '';
      }
      i++;
    }
    return out;
  }

  var ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  function numberToWords(str) {
    var parts = str.replace(/,/g, '').split('.');
    var n = parseInt(parts[0], 10);
    var under1000 = function (x) {
      var w = [];
      if (x >= 100) { w.push(ONES[Math.floor(x / 100)], 'hundred'); x %= 100; }
      if (x >= 20) { w.push(TENS[Math.floor(x / 10)]); x %= 10; if (x) w.push(ONES[x]); }
      else if (x || !w.length) w.push(ONES[x]);
      return w;
    };
    var words = [];
    if (!isFinite(n) || parts[0].length > 12) {
      words = parts[0].split('').map(function (d) { return ONES[+d]; });
    } else if (n === 0) {
      words = ['zero'];
    } else {
      [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']].forEach(function (u) {
        if (n >= u[0]) { words = words.concat(under1000(Math.floor(n / u[0])), [u[1]]); n %= u[0]; }
      });
      if (n) words = words.concat(under1000(n));
    }
    if (parts[1]) words = words.concat(['point'], parts[1].split('').map(function (d) { return ONES[+d]; }));
    return words;
  }

  function settings(opts) {
    opts = opts || {};
    return {
      phonetic: !!opts.phonetic,
      stress: opts.stress !== false,
      stressMonosyllables: !!opts.stressMonosyllables,
      slashes: opts.slashes !== false
    };
  }

  // One word -> { ipa, source, alternatives }.
  function wordToIPA(text, opts) {
    var o = settings(opts);
    var d = getDict() || new Map();
    var word = text.toLowerCase().replace(/[’‘]/g, "'");
    var prons = d.get(word), source = 'dictionary';
    if (!prons) { prons = derive(word, d); source = 'derived'; }
    if (prons) {
      var all = prons.map(function (p) { return arpabetToIPA(p, o); })
        .filter(function (x, i, arr) { return arr.indexOf(x) === i; });
      return { ipa: all[0], source: source, alternatives: all.slice(1) };
    }
    if (/^[A-Z]{2,6}$/.test(text)) {
      return { ipa: text.toLowerCase().split('').map(function (c) { return LETTERS[c]; }).join(' '), source: 'spelled', alternatives: [] };
    }
    return { ipa: guess(word), source: 'guess', alternatives: [] };
  }

  // Full text -> { ipa, tokens }. Punctuation and spacing are kept as written.
  function englishToIPA(text, opts) {
    var o = settings(opts);
    var re = /[A-Za-zÀ-ɏ]+(?:['’][A-Za-z]+)*|\d+(?:[.,]\d+)*|\s+|[^\sA-Za-z\d]/g;
    var tokens = [], m;
    while ((m = re.exec(String(text)))) {
      var t = m[0];
      if (/^\s+$/.test(t)) {
        tokens.push({ type: 'space', text: t, ipa: ' ' });
      } else if (/^\d/.test(t)) {
        var spoken = numberToWords(t).map(function (w) { return wordToIPA(w, o).ipa; }).join(' ');
        tokens.push({ type: 'word', text: t, ipa: spoken, source: 'number', alternatives: [] });
      } else if (/^[A-Za-zÀ-ɏ]/.test(t)) {
        var r = wordToIPA(t, o);
        tokens.push({ type: 'word', text: t, ipa: r.ipa, source: r.source, alternatives: r.alternatives });
      } else {
        // Dashes become a space; quotation marks and stray apostrophes are not phonetic, so they are dropped.
        var shown = /[-–—]/.test(t) ? ' ' : /['"‘’“”]/.test(t) ? '' : t;
        tokens.push({ type: 'punct', text: t, ipa: shown });
      }
    }
    var body = tokens.map(function (k) { return k.ipa; }).join('').replace(/\s+/g, ' ').trim();
    return { ipa: o.slashes && body ? '/' + body + '/' : body, tokens: tokens };
  }

  function transcribe(text, opts) { return englishToIPA(text, opts).ipa; }

  var api = {
    englishToIPA: englishToIPA, transcribe: transcribe, wordToIPA: wordToIPA,
    arpabetToIPA: function (pron, opts) { return arpabetToIPA(pron, settings(opts)); },
    loadDictionary: loadDictionary,
    dictionarySize: function () { var d = getDict(); return d ? d.size : 0; }
  };
  root.SmartIPA = Object.assign(root.SmartIPA || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
