/* Credits: licences and attribution for recordings, dictionary and font. Route: #/credits */
(function (S) {
  'use strict';
  var esc = S.esc;

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
        '<section class="card prose"><h2>Recordings</h2><p>Every sound recording is streamed from <a href="https://commons.wikimedia.org/" target="_blank" rel="noopener">Wikimedia Commons</a> ' +
        'and is used under the licence shown. CC BY-SA recordings remain under CC BY-SA; follow the file link for full attribution and licence terms.</p>' +
        '<div class="scroll-x"><table class="table"><thead><tr><th>IPA</th><th>Sound</th><th>File</th><th>Licence</th><th>Author</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>' +
        '<section class="card prose"><h2>Pronunciation dictionary</h2><p>English transcription uses the <a href="https://github.com/cmusphinx/cmudict" target="_blank" rel="noopener">CMU Pronouncing Dictionary</a>, ' +
        'Copyright Carnegie Mellon University, under a BSD-style licence (<a href="data/cmudict/LICENSE">full text</a>).</p></section>' +
        '<section class="card prose"><h2>Vocal tract drawings</h2><p>The side-view drawings are adapted from ' +
        '<a href="https://commons.wikimedia.org/wiki/File:Places_of_articulation.svg" target="_blank" rel="noopener">Places of articulation.svg</a> ' +
        'by User:ish shwar (SVG by Rohieb), based on Minifie et al. (1973), licensed ' +
        '<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noopener">CC BY-SA 3.0</a>. ' +
        'Changes: redrawn as outlines, labels removed, jaw closed, and the tongue, lips, velum and vocal folds made to move for each sound. ' +
        'The adapted drawings are shared under the same licence. The idea of a sagittal section built from changing parts comes from ' +
        'Daniel Currie Hall’s <a href="https://incl.pl/sammy/" target="_blank" rel="noopener">Interactive Sagittal Section</a>.</p></section>' +
        '<section class="card prose"><h2>Font</h2><p>IPA symbols are set in <a href="https://software.sil.org/charis/" target="_blank" rel="noopener">Charis SIL</a> by SIL International, ' +
        'under the SIL Open Font License, served by Google Fonts.</p></section>' +
        '<section class="card prose"><h2>Synthesized and device audio</h2><p>Pitch and timing examples on the Prosody tab are synthesized in the browser. ' +
        'Example words and the Transcribe tab use your device’s own text-to-speech voice where one is available, so they sound different on each device.</p></section></div>';
    },
    update: function () { document.title = 'Credits · SmartIPA'; }
  };
})(window.SIPA = window.SIPA || {});
