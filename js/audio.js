/* Sound playback: recorded clips from Wikimedia Commons, synthesized pitch for prosody, and the device's
   speech voice for example words. */
(function (S) {
  'use strict';
  var current = null, settle = null, ctx = null, seqSettle = null;
  // Playback settings for recordings: speed (pitch is preserved by the browser) and looping.
  var settings = { rate: 1, loop: false };

  // Stops whatever is playing and settles its promise, so buttons showing "Playing" reset.
  // keepSequence: used between the steps of playSequence, so the sequence itself carries on.
  function stop(keepSequence) {
    if (seqSettle && keepSequence !== true) { var q = seqSettle; seqSettle = null; q(); }
    if (current) { current.pause(); current = null; }
    if (settle) { var f = settle; settle = null; f(); }
    if (root.speechSynthesis) root.speechSynthesis.cancel();
  }
  var root = window;

  // Plays the recording for an IPA symbol. Resolves when playback ends; rejects if no clip could load.
  function playSound(sym) {
    var o = S.sounds.by[sym];
    if (!o || !o.audio) return Promise.reject(new Error('No recording for ' + sym));
    return playClip(o.audio);
  }

  // Plays a recording described by { mp3, original }: the MP3 version first, the original file as fallback.
  function playClip(audio, inSequence) {
    stop(inSequence === true);
    var urls = [audio.mp3, audio.original];
    return new Promise(function (resolve, reject) {
      settle = resolve;
      var tryUrl = function (i) {
        if (i >= urls.length) { settle = null; reject(new Error('Recording could not be loaded')); return; }
        var a = new Audio(urls[i]);
        current = a;
        a.playbackRate = settings.rate;
        a.preservesPitch = true;
        a.loop = settings.loop && inSequence !== true;
        a.onended = function () { if (current === a) { current = null; settle = null; } resolve(); };
        a.onerror = function () { if (current === a) tryUrl(i + 1); };
        var p = a.play();
        if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') reject(e); });
      };
      tryUrl(0);
    });
  }

  // Plays recordings one after another with a pause between them, e.g. A B A B for comparing two sounds.
  // onStep(i) is called as each one starts. Stopping cancels the rest.
  function playSequence(clips, gapMs, onStep) {
    stop();
    return new Promise(function (resolve, reject) {
      var i = 0, cancelled = false;
      var mine = function () { cancelled = true; resolve(); };
      seqSettle = mine;
      var next = function () {
        if (cancelled) return;
        if (i >= clips.length) { if (seqSettle === mine) seqSettle = null; if (onStep) onStep(-1); resolve(); return; }
        if (onStep) onStep(i);
        playClip(clips[i++], true).then(function () { if (!cancelled) setTimeout(next, gapMs); },
          function (e) { cancelled = true; if (seqSettle === mine) seqSettle = null; reject(e); });
      };
      next();
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
    return new Promise(function (resolve) { settle = resolve; setTimeout(function () { if (settle === resolve) settle = null; resolve(); }, total * 1000 + 100); });
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
      settle = resolve;
      u.onend = function () { settle = null; resolve(); }; u.onerror = u.onend;
      root.speechSynthesis.speak(u);
    });
  }
  if (root.speechSynthesis) {
    root.speechSynthesis.getVoices();
    root.speechSynthesis.addEventListener && root.speechSynthesis.addEventListener('voiceschanged', function () {
      document.dispatchEvent(new CustomEvent('sipa:voices'));
    });
  }

  // Microphone take for "Record yourself". It lives only in memory as a blob URL and is never uploaded.
  var rec = null;
  function canRecord() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && root.MediaRecorder); }
  function record(maxMs) {
    stop();
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } }).then(function (stream) {
      return new Promise(function (resolve, reject) {
        var chunks = [], mr = new MediaRecorder(stream), timer;
        var finish = function () { stream.getTracks().forEach(function (t) { t.stop(); }); rec = null; clearTimeout(timer); };
        mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        mr.onstop = function () {
          finish();
          if (!chunks.length) { reject(new Error('Nothing was recorded')); return; }
          var blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
          resolve({ url: URL.createObjectURL(blob), type: blob.type });
        };
        mr.onerror = function (e) { finish(); reject(e.error || e); };
        rec = mr;
        mr.start();
        timer = setTimeout(function () { if (mr.state === 'recording') mr.stop(); }, maxMs || 4000);
      });
    });
  }
  function stopRecording() { if (rec && rec.state === 'recording') rec.stop(); }

  S.audio = {
    canRecord: canRecord, record: record, stopRecording: stopRecording, isRecording: function () { return !!rec; },
    playSound: playSound, playClip: playClip, playSequence: playSequence, playSegments: playSegments, formants: formants, speak: speak,
    canSpeak: function (l) { return !!voiceFor(l); }, stop: stop, settings: settings,
    isPlaying: function () { return !!settle; }
  };
})(window.SIPA = window.SIPA || {});
