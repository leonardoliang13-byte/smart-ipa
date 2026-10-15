/* Sound playback: recorded clips from Wikimedia Commons, synthesized pitch for prosody, and the device's
   speech voice for example words. */
(function (S) {
  'use strict';
  var current = null, ctx = null;

  function stop() {
    if (current) { current.pause(); current = null; }
    if (root.speechSynthesis) root.speechSynthesis.cancel();
  }
  var root = window;

  // Plays the recording for an IPA symbol. Resolves when playback ends; rejects if no clip could load.
  function playSound(sym) {
    var o = S.sounds.by[sym];
    if (!o || !o.audio) return Promise.reject(new Error('No recording for ' + sym));
    stop();
    var urls = [o.audio.mp3, o.audio.original];
    return new Promise(function (resolve, reject) {
      var tryUrl = function (i) {
        if (i >= urls.length) { reject(new Error('Recording could not be loaded')); return; }
        var a = new Audio(urls[i]);
        current = a;
        a.onended = function () { if (current === a) current = null; resolve(); };
        a.onerror = function () { if (current === a) tryUrl(i + 1); };
        var p = a.play();
        if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') reject(e); });
      };
      tryUrl(0);
    });
  }

  // Formant frequencies [F1, F2, F3] for a vowel from height (0 close to 1 open), backness (0 front to 1 back) and rounding.
  function formants(h, b, r) {
    var f2 = (2300 - 600 * h) * (1 - b) + (800 + 350 * h) * b;
    if (r) f2 *= b < 0.5 ? 0.82 : 0.9;
    return [270 + 500 * h, f2, r ? 2300 : 2700 + 300 * (1 - h) * (1 - b)];
  }

  // Synthesizes a vowel-like buzz following each segment's pitch levels (1 = low, 5 = high).
  // vowel: optional [F1, F2, F3]; defaults to an [a]-like vowel.
  function playSegments(segs, vowel) {
    var F = vowel || [780, 1250, 2600];
    stop();
    var unit = 0.36, total = 0;
    segs.forEach(function (s) { total += (s.d + s.gap) * unit; });
    try {
      var AC = root.AudioContext || root.webkitAudioContext;
      ctx = ctx || new AC();
      if (ctx.state === 'suspended') ctx.resume();
      var hz = function (l) { return 105 * Math.pow(2, ((l - 1) / 4) * 0.95); };
      var t = ctx.currentTime + 0.03;
      segs.forEach(function (s) {
        var dur = s.d * unit, osc = ctx.createOscillator(), out = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(hz(s.p[0]), t);
        s.p.forEach(function (l, i) { if (i) osc.frequency.linearRampToValueAtTime(hz(l), t + dur * i / (s.p.length - 1)); });
        var peak = s.hl ? 0.55 : 0.38;
        out.gain.setValueAtTime(0, t);
        out.gain.linearRampToValueAtTime(peak, t + 0.03);
        out.gain.setValueAtTime(peak, t + Math.max(0.04, dur - 0.05));
        out.gain.linearRampToValueAtTime(0, t + dur);
        [[F[0], 90, 1], [F[1], 110, 0.5], [F[2], 170, 0.2]].forEach(function (f) {
          var bp = ctx.createBiquadFilter(), g = ctx.createGain();
          bp.type = 'bandpass'; bp.frequency.value = f[0]; bp.Q.value = f[0] / f[1]; g.gain.value = f[2];
          osc.connect(bp); bp.connect(g); g.connect(out);
        });
        out.connect(ctx.destination);
        osc.start(t); osc.stop(t + dur + 0.03);
        t += (s.d + s.gap) * unit;
      });
    } catch (e) { return Promise.reject(e); }
    return new Promise(function (resolve) { setTimeout(resolve, total * 1000 + 100); });
  }

  // Device text-to-speech, used only for example words and the Transcribe tab.
  var LANGS = {
    'English': 'en-US', 'English (American)': 'en-US', 'English (British)': 'en-GB', 'English (Australian)': 'en-AU',
    'English (New Zealand)': 'en-NZ', 'English (Scottish)': 'en-GB', 'Spanish': 'es-ES', 'French': 'fr-FR', 'German': 'de-DE',
    'Italian': 'it-IT', 'Japanese': 'ja-JP', 'Mandarin': 'zh-CN', 'Cantonese': 'zh-HK', 'Hindi': 'hi-IN', 'Russian': 'ru-RU',
    'Polish': 'pl-PL', 'Korean': 'ko-KR', 'Turkish': 'tr-TR', 'Swedish': 'sv-SE', 'Danish': 'da-DK', 'Hungarian': 'hu-HU',
    'Greek': 'el-GR', 'Arabic': 'ar-SA', 'Vietnamese': 'vi-VN', 'Czech': 'cs-CZ', 'Thai': 'th-TH', 'Persian': 'fa-IR',
    'Tamil': 'ta-IN', 'Welsh': 'cy-GB', 'Irish': 'ga-IE', 'Swahili': 'sw-KE', 'Georgian': 'ka-GE'
  };
  function voiceFor(language) {
    var code = LANGS[language];
    if (!code || !root.speechSynthesis) return null;
    var voices = root.speechSynthesis.getVoices();
    var norm = function (v) { return v.lang.replace('_', '-').toLowerCase(); };
    return voices.filter(function (v) { return norm(v) === code.toLowerCase(); })[0] ||
      voices.filter(function (v) { return norm(v).slice(0, 2) === code.slice(0, 2); })[0] || null;
  }
  function speak(text, language) {
    var v = voiceFor(language);
    if (!v) return Promise.reject(new Error('No voice for ' + language));
    stop();
    return new Promise(function (resolve) {
      var u = new SpeechSynthesisUtterance(text);
      u.voice = v; u.lang = v.lang; u.rate = 0.85;
      u.onend = resolve; u.onerror = resolve;
      root.speechSynthesis.speak(u);
    });
  }
  if (root.speechSynthesis) {
    root.speechSynthesis.getVoices();
    root.speechSynthesis.addEventListener && root.speechSynthesis.addEventListener('voiceschanged', function () {
      document.dispatchEvent(new CustomEvent('sipa:voices'));
    });
  }

  S.audio = { playSound: playSound, playSegments: playSegments, formants: formants, speak: speak, canSpeak: function (l) { return !!voiceFor(l); }, stop: stop };
})(window.SIPA = window.SIPA || {});
