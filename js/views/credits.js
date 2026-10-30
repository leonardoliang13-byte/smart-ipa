/* Credits: licences and attribution for recordings, dictionary and font, and offline use.
   Route: #/credits, or #/credits/offline and #/credits/privacy to jump to those sections. */
(function (S) {
  'use strict';
  var esc = S.esc;

  function refresh() {
    var st = document.getElementById('offline-status'), save = document.querySelector('[data-offline-save]'), rm = document.querySelector('[data-offline-remove]');
    if (!st) return;
    if (!S.offline.supported) { st.textContent = 'This browser cannot keep an offline copy (it needs a web address starting with http or https).'; save.hidden = true; return; }
    S.offline.status().then(function (r) {
      st.textContent = r.saved ? r.saved + ' of ' + r.total + ' recordings are saved in this browser.' : 'No recordings are saved yet. There are ' + r.total + ', about 8 MB in all.';
      save.textContent = r.saved && r.saved < r.total ? 'Save the remaining recordings' : 'Save recordings for offline';
      save.hidden = r.saved === r.total;
      rm.hidden = !r.saved;
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-offline-save]');
    if (b) {
      var st = document.getElementById('offline-status');
      b.disabled = true;
      S.offline.save(function (done, total) { st.textContent = 'Saving ' + done + ' of ' + total + '…'; }).then(function (r) {
        b.disabled = false;
        refresh();
        if (r.failed) setTimeout(function () { st.textContent += ' ' + r.failed + ' could not be downloaded; try again later.'; }, 50);
      }, function () { b.disabled = false; st.textContent = 'Saving failed. The browser may be out of storage space.'; });
      return;
    }
    if (e.target.closest('[data-offline-remove]')) S.offline.remove().then(refresh);
  });

  S.views.credits = {
    title: 'Credits',
    mount: function (root) {
      var rows = S.sounds.all.filter(function (o) { return o.audio; }).map(function (o) {
        var a = o.audio;
        return '<tr><td class="ipa">' + esc(o.s) + '</td><td>' + esc(o.name) + '</td><td><a href="' + esc(a.page) + '" target="_blank" rel="noopener">' +
          esc(a.file) + '</a></td><td>' + esc(a.licence) + '</td><td>' + (a.author ? esc(a.author) : '<span class="hint">Named on the file page</span>') + '</td></tr>';
      }).join('');
      root.innerHTML = '<div class="narrow"><div class="page-head"><h1>Credits</h1>' +
        '<p class="hint">SmartIPA is built on freely licensed material. Thank you to everyone below.</p></div>' +
        '<section class="card prose" id="privacy" data-reveal="credits-privacy"><h2>Privacy</h2><p>SmartIPA has no accounts and no analytics, and it never sends your answers, text or recordings anywhere. ' +
        'This browser keeps only what makes the next visit easier: your last English text and transcription style, a copy of the site for offline use, ' +
        'and recordings if you chose to save them. Clear the site data in your browser to remove all of it.</p>' +
        '<p>Pages load fonts from Google Fonts and icons from unpkg, and recordings stream from Wikimedia Commons, so those services see an ordinary web request from your browser.</p></section>' +
        '<section class="card prose" id="offline" data-reveal="credits-offline"><h2>Use offline</h2><p>Once a page has been opened, SmartIPA keeps a copy of its own files, so the chart, lessons, ' +
        'drawings and Practice keep working without a connection. Transcribe also works offline after it has been opened once. ' +
        'Recordings come from Wikimedia Commons and are only saved if you ask.</p>' +
        '<div class="offline-row"><button type="button" class="btn-play" data-offline-save>Save recordings for offline</button>' +
        '<button type="button" class="btn-secondary" data-offline-remove hidden>Remove saved recordings</button></div>' +
        '<p class="hint" id="offline-status" role="status"></p></section>' +
        '<section class="card prose" data-reveal="credits-1"><h2>Recordings</h2><p>Every sound recording is streamed from <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener">Wikimedia Commons</a> ' +
        'and is used under the licence shown. CC BY-SA recordings remain under CC BY-SA; follow the file link for full attribution and licence terms.</p>' +
        '<div class="scroll-x"><table class="table"><thead><tr><th>IPA</th><th>Sound</th><th>File</th><th>Licence</th><th>Author</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' +
        '<section class="card prose" data-reveal="credits-2"><h2>Recordings of sounds with diacritics</h2><p>When a combination built on the chart has its own recording, ' +
        'SmartIPA plays it instead of the plain sound. These come from the files Wikipedia’s IPA articles use and from searching Wikimedia Commons. ' +
        'Some are filed on Commons under an equivalent symbol, shown in the last column.</p>' +
        '<div class="scroll-x"><table class="table"><thead><tr><th>Combination</th><th>File</th><th>Licence</th><th>Author</th><th>Filed as</th></tr></thead><tbody>' +
        S.diacriticAudioList().map(function (r) {
          var parts = r.key.split('|'), ids = parts[1].split(',');
          var sym = parts[0] + ids.map(function (id) { var d = S.diacritics.byId[id]; return d && !d.spacing ? d.m : ''; }).join('') +
            ids.map(function (id) { var d = S.diacritics.byId[id]; return d && d.spacing ? d.m : ''; }).join('');
          var a = r.audio;
          return '<tr><td class="ipa">' + esc(sym) + '</td><td><a href="' + esc(a.page) + '" target="_blank" rel="noopener">' + esc(a.file) + '</a></td><td>' +
            esc(a.licence) + '</td><td>' + (a.author ? esc(a.author) : '<span class="hint">Named on the file page</span>') + '</td><td class="ipa">' + esc(a.written) + '</td></tr>';
        }).join('') + '</tbody></table></div></section>' +
        '<section class="card prose" data-reveal="credits-3"><h2>Pronunciation dictionary</h2><p>English transcription uses the <a href="https://github.com/cmusphinx/cmudict" target="_blank" rel="noopener">CMU Pronouncing Dictionary</a>, ' +
        'Copyright Carnegie Mellon University, under a BSD-style licence (<a href="data/cmudict/LICENSE">full text</a>).</p></section>' +
        '<section class="card prose" data-reveal="credits-4"><h2>Vocal tract drawings</h2><p>The side view drawings are adapted from ' +
        '<a href="https://commons.wikimedia.org/wiki/File:Places_of_articulation.svg" target="_blank" rel="noopener">Places of articulation.svg</a> ' +
        'by User:ish shwar (SVG by Rohieb), based on Minifie et al. (1973), licensed ' +
        '<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a>. ' +
        'Changes: redrawn as outlines, labels removed, jaw closed, and the tongue, lips, velum and vocal folds made to move for each sound. ' +
        'The adapted drawings are shared under the same licence. The idea of a sagittal section built from changing parts comes from ' +
        'Daniel Currie Hall’s <a href="https://incl.pl/sammy/" target="_blank" rel="noopener">Interactive Sagittal Section</a>.</p></section>' +
        '<section class="card prose" data-reveal="credits-5"><h2>Font</h2><p>IPA symbols are set in <a href="https://software.sil.org/charis/" target="_blank" rel="noopener">Charis SIL</a> by SIL International, ' +
        'under the SIL Open Font License, served by Google Fonts.</p></section>' +
        '<section class="card prose" data-reveal="credits-6"><h2>Synthesized and device audio</h2><p>Pitch and timing examples on the Prosody tab are synthesized in the browser. ' +
        'Example words and the Transcribe tab use your device’s own speech voice where one is available, so they sound different on each device.</p></section></div>';
    },
    update: function (param) {
      document.title = 'Credits · SmartIPA';
      refresh();
      if (param === 'offline' || param === 'privacy') { var o = document.getElementById(param); if (o) o.scrollIntoView({ block: 'start' }); }
    }
  };
})(window.SIPA = window.SIPA || {});
