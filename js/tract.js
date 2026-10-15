/* Vocal tract: a midsagittal (side-view) line drawing of the head, facing left, whose jaw, lips,
   tongue, velum and vocal folds move to match the sound. The place of articulation is circled in red.

   The head outline is derived from "Places of articulation.svg" on Wikimedia Commons
   (created by User:ish shwar, SVG by Rohieb; based on Minifie et al. 1973), licensed CC BY-SA 3.0:
   https://commons.wikimedia.org/wiki/File:Places_of_articulation.svg
   This derived drawing is therefore also CC BY-SA 3.0. Changes: restyled as outlines, place labels
   removed, jaw closed, and the tongue, lips, velum and vocal folds made movable. */
(function (S) {
  'use strict';

  // Outline pieces in the source drawing's 800 x 1000 coordinate space. Each entry: [command, x1, y1, ...].
  var BASE = {
    head: [['M', 20.1, 245], ['C', 9.6, 242.3, 8.4, 221, 33.6, 188.6], ['C', 83.2, 124.9, 133.3, 19.8, 212.6, -7.3], ['L', 814.3, -7.3], ['C', 815.8, 16, 812.1, 690.5, 811.9, 915.5], ['C', 783.8, 874.4, 768.4, 856.9, 742.6, 784.8], ['C', 706.3, 683.5, 671.1, 577.2, 666.9, 469.1], ['C', 664.5, 406.3, 674, 392.9, 674, 343.4], ['C', 674, 279.7, 639.9, 260.6, 605.5, 249.1], ['C', 570.6, 237.5, 528.6, 204.5, 526.4, 180], ['C', 523.4, 146.3, 553.1, 114.6, 535.5, 66.2], ['C', 522, 38.1, 474.6, 50.5, 438.3, 44.8], ['C', 403.8, 39.4, 383.1, 23.8, 364, 19.1], ['C', 315.2, 7.1, 303.2, 18.9, 258.3, 27.7], ['C', 231.8, 32.8, 191.1, 44.7, 171.2, 62], ['C', 152.1, 78.5, 139.2, 96, 115.7, 116.3], ['C', 93, 136, 75.4, 171.2, 71.2, 182], ['C', 64.6, 198.7, 54.2, 205.7, 51.4, 230], ['C', 49.9, 242.4, 29.1, 247.3, 20.1, 245]],
    larynx: [['M', 811.2, 937.6], ['C', 811.2, 937.6, 776.3, 881.8, 772.6, 879.3], ['C', 760.1, 871.1, 756.2, 878, 751.4, 891], ['C', 747.5, 901.5, 746.1, 920.5, 752.8, 930.6], ['C', 762.8, 945.4, 774.4, 943.4, 786.9, 955.5], ['C', 802.2, 970.3, 811.2, 1003.3, 811.2, 1003.3], ['L', 811.2, 937.6]],
    // Jaw, lower lip and tongue as one outline; entries 13 to 20 are the tongue surface, replaced per sound.
    lower: [['M', 605.1, 1016.1], ['C', 594.6, 998.3, 565.4, 983.3, 555.5, 968.7], ['C', 500, 886.4, 391.1, 874, 298.6, 896.9], ['C', 251.8, 908.6, 182.2, 928, 149.5, 911.1], ['C', 131, 901.5, 97.6, 856.6, 97.6, 821.2], ['C', 97.6, 807.5, 101.3, 793.3, 97.6, 771.7], ['C', 92.8, 743.1, 65.2, 748.4, 59.1, 732.8], ['C', 53.8, 719, 60.4, 686.4, 73.2, 682.3], ['C', 83.3, 679.1, 95.5, 682.4, 100, 686.5], ['C', 116.7, 701.6, 120.8, 746.6, 139.6, 744.9], ['C', 150.3, 744, 128.6, 729.2, 135, 719.7], ['C', 140.7, 711.1, 146.1, 707.8, 155.1, 708.5], ['C', 161.6, 709.1, 163.6, 726.8, 176.6, 724.5], ['C', 199.6, 720.6, 218.2, 698.9, 215.9, 676.5], ['C', 212.8, 646.7, 188.5, 628.5, 159.5, 626.2], ['C', 143.5, 625, 125, 623.6, 124.7, 610.1], ['C', 124.2, 583.2, 177, 575.1, 201.3, 575.1], ['C', 238, 575.1, 301.2, 574.6, 363.7, 579.5], ['C', 406.5, 582.9, 452.8, 590.1, 480.9, 616.1], ['C', 521.3, 653.6, 524.8, 693.9, 531.5, 744.4], ['C', 532.9, 755.2, 537.4, 779.1, 539.5, 793.4], ['C', 540.9, 803.6, 555.6, 807.5, 558.1, 793.9], ['C', 560.7, 780.3, 558.3, 763.7, 554.1, 749.5], ['C', 551.5, 740.5, 546, 733.5, 550.2, 731.8], ['C', 555.1, 729.8, 557.6, 733.5, 561.7, 743.4], ['C', 573.8, 772.3, 566.2, 809.9, 568.8, 828.3], ['C', 571.4, 847.3, 580.2, 860.7, 583.8, 879.1], ['C', 587.2, 896.7, 596.3, 911.1, 603.6, 926.7], ['C', 616.2, 953.5, 630.6, 967, 641, 984.3], ['C', 648.9, 997.5, 666.2, 1016.1, 666.2, 1016.1], ['L', 605.1, 1016.1]],
    // Upper lip, alveolar ridge, hard palate and velum; entries 7 to 14 are the velum and uvula.
    palate: [['M', 92.1, 279.8], ['C', 89.2, 273.9, 108.1, 252.6, 122, 253.6], ['C', 142.7, 255.2, 156.1, 271.6, 172.7, 272.8], ['C', 181.6, 273.5, 201.9, 271.5, 216.8, 275], ['C', 236.6, 279.7, 256.8, 286.8, 277.3, 293], ['C', 334.9, 310.3, 370.2, 315.6, 430, 319.1], ['C', 488.9, 322.6, 521.8, 335.3, 565.5, 337], ['C', 588.8, 338, 605.1, 339.1, 622.8, 353.5], ['C', 641.1, 368.5, 646.5, 390.4, 644.6, 423.7], ['C', 643.1, 450.2, 638.8, 460.8, 631.7, 481.2], ['C', 628.1, 491.6, 624.2, 502.1, 623.7, 511.2], ['C', 622.9, 523.8, 622.4, 536.1, 614.2, 535.9], ['C', 606.5, 535.7, 601.8, 532.8, 602, 521.7], ['C', 602.2, 510.4, 606.9, 502, 605.5, 487], ['C', 601.6, 444.9, 587, 411.6, 574.4, 393.4], ['C', 562.2, 375.6, 545.5, 366, 526.2, 361.3], ['C', 499.4, 354.7, 483.7, 353.3, 456.1, 351.2], ['C', 434.2, 349.6, 431.5, 351.8, 409.4, 349.8], ['C', 387.3, 347.8, 391.9, 346.1, 366.5, 343.4], ['C', 341.2, 340.7, 331.7, 339.3, 308, 339.1], ['C', 295.3, 339, 278.9, 341.4, 271.5, 347], ['C', 258.1, 357.1, 253, 369.9, 243.7, 375.5], ['C', 223.7, 387.6, 210.2, 387.4, 188.3, 388.4], ['C', 172.4, 389.1, 162.6, 391.4, 160, 387], ['C', 158.9, 382, 170.3, 361.2, 159.4, 362.3], ['C', 150.9, 363.2, 148.5, 393.8, 134.7, 413], ['C', 123.9, 428, 109, 427.4, 100.8, 419.8], ['C', 89.5, 409.3, 86.3, 397.5, 95.1, 382.7], ['C', 102.1, 371, 107.4, 353.3, 118.7, 338.4], ['C', 131.6, 321.3, 138.8, 301.3, 123.7, 287.7], ['C', 114.8, 279.6, 97.2, 289.9, 92.1, 279.8]],
    teethU: [['M', 152.6, 426.2], ['C', 142.1, 420.6, 177, 357.2, 188.3, 361.2], ['C', 199.4, 365.2, 166, 433.5, 152.6, 426.2]],
    teethL: [['M', 158.3, 739.1], ['C', 169.4, 728.6, 128.6, 663.6, 116.9, 672.7], ['C', 107.6, 679.9, 149.9, 747, 158.3, 739.1]]
  };

  // Jaw hinge and the default (relaxed, nearly closed) jaw position.
  var HINGE = [560, 470];
  var JAW = { rot: 6, up: 140, fwd: 40 };

  // Where each place of articulation sits on the drawing (centre of the red circle).
  var TARGET = {
    bilabial: [92, 432], labiodental: [140, 432], dental: [158, 424], alveolar: [238, 380], postalveolar: [282, 352],
    retroflex: [306, 344], alveolopalatal: [340, 346], palatal: [410, 352], velar: [548, 374], uvular: [640, 505],
    pharyngeal: [668, 610], epiglottal: [650, 730], glottal: [700, 930]
  };

  function f(v) { return Math.round(v * 10) / 10; }

  function pathD(segs, tf) {
    return segs.map(function (s) {
      var out = [s[0]];
      for (var i = 1; i < s.length; i += 2) {
        var p = tf ? tf(s[i], s[i + 1]) : [s[i], s[i + 1]];
        out.push(f(p[0]), f(p[1]));
      }
      return out.join(' ');
    }).join(' ') + ' Z';
  }

  // Open Catmull-Rom spline through points, as cubic Bezier segments (without the initial M).
  function splineSegs(p) {
    var n = p.length, segs = [];
    for (var i = 0; i < n - 1; i++) {
      var a = p[Math.max(i - 1, 0)], b = p[i], c = p[i + 1], e = p[Math.min(i + 2, n - 1)];
      segs.push(['C', b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6, c[0], c[1]]);
    }
    return segs;
  }

  function rotateAbout(x, y, c, deg, k) {
    var th = deg * k * Math.PI / 180, dx = x - c[0], dy = y - c[1];
    return [c[0] + dx * Math.cos(th) - dy * Math.sin(th), c[1] + dx * Math.sin(th) + dy * Math.cos(th)];
  }
  var smooth = function (t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  S.tractSVG = function (P) {
    P = P || {};
    var kind = P.kind || 'consonant', place = P.place || 'alveolar', manner = P.manner || 'plosive';
    var voiced = !!P.voiced, sec = P.secondary || 'none', isV = kind === 'vowel';
    var h = Math.max(0, Math.min(1, Number(P.vheight || 0)));
    var b = Math.max(0, Math.min(1, Number(P.vback || 0)));
    var round = sec === 'labialized' || (isV && !!P.rounded);
    var jaw = { rot: JAW.rot, up: JAW.up, fwd: JAW.fwd };
    var lipUp = 0, lipFwd = 0, hl, h2 = null, T;

    // ----- Tongue shape (points in the final drawing's coordinates) -----
    var s = { tu: [205, 530], tip: [178, 492], blade: [250, 462], front: [360, 448], back: [470, 462], root: [528, 565], root2: [536, 690] };
    if (isV) {
      jaw.up = JAW.up - 55 * h;
      var px = 360 + 190 * b;
      var py = (px <= 460 ? 345 : 345 + (px - 460) * 0.32) + 28 + 130 * h;
      s = { tu: [205, 540 + 50 * h], tip: [178, 500 + 45 * h] };
      [['blade', 240], ['front', 330], ['mid', 420], ['back', 500], ['root', 548]].forEach(function (st) {
        s[st[0]] = [st[1], Math.min(560, py + Math.pow((st[1] - px) / 120, 2) * 34)];
      });
      s.root = [Math.max(s.root[0], 530 + 60 * b * h), Math.max(s.root[1], 560)];
      s.root2 = [536 + 40 * b * h, 690];
      hl = [px, py - 14];
    } else {
      var g = manner === 'fricative' ? 9 : manner === 'approximant' ? 24 : manner === 'trill' ? 3 : 0;
      var shapes = {
        dental: function () { s.tip = [160, 432 + g]; s.blade = [215, 452]; s.tu = [192, 520]; },
        alveolar: function () { s.tip = [236, 384 + g]; s.blade = [278, 412 + g / 2]; s.tu = [214, 470]; },
        postalveolar: function () { s.tip = [246, 402]; s.blade = [288, 356 + g]; s.front = [360, 384 + g / 2]; s.tu = [222, 480]; },
        retroflex: function () { s.tu = [244, 432]; s.tip = [304, 349 + g]; s.blade = [322, 404]; s.front = [384, 432]; },
        alveolopalatal: function () { s.tip = [232, 440]; s.tu = [212, 500]; s.blade = [300, 356 + g]; s.front = [360, 351 + g]; },
        palatal: function () { s.blade = [290, 412]; s.front = [410, 356 + g]; s.back = [492, 410]; },
        velar: function () { s.blade = [262, 470]; s.front = [400, 432]; s.back = [540, 378 + g]; s.root = [566, 500]; },
        uvular: function () { s.blade = [262, 474]; s.front = [420, 452]; s.back = [560, 470]; s.root = [634, 510 + g]; s.root2 = [590, 640]; },
        pharyngeal: function () { s.front = [380, 462]; s.back = [520, 484]; s.root = [656 - g, 612]; s.root2 = [610, 700]; },
        epiglottal: function () { s.back = [520, 492]; s.root = [600, 600]; s.root2 = [640 - g, 712]; }
      };
      if (place === 'bilabial') { lipUp = 62 - g * 1.5; T = TARGET.bilabial; }
      else if (place === 'labiodental') { lipUp = 50 - g; lipFwd = 46; T = TARGET.labiodental; }
      else if (place === 'glottal') { T = TARGET.glottal; }
      else if (place === 'labialvelar') {
        shapes.velar(); T = TARGET.velar;
        if (manner === 'plosive') { lipUp = 62; h2 = TARGET.bilabial; } else { round = true; h2 = [80, 432]; }
      }
      else if (place === 'labialpalatal') { shapes.palatal(); T = TARGET.palatal; round = true; h2 = [80, 432]; }
      else { (shapes[place] || shapes.alveolar)(); T = TARGET[place] || TARGET.alveolar; }
      if (manner === 'click') {
        s.back = [540, 378]; s.root = [566, 500];
        if (place !== 'palatal') s.front = [400, 452];
        h2 = TARGET.velar;
      }
      if (sec === 'palatalized') { s.front = [410, Math.min(s.front[1], 362)]; h2 = TARGET.palatal; }
      if (sec === 'velarized') { s.back = [540, Math.min(s.back[1], 386)]; s.root = [566, 500]; h2 = TARGET.velar; }
      if (sec === 'pharyngealized') { s.root = [648, 612]; s.root2 = [610, 700]; h2 = TARGET.pharyngeal; }
      hl = T;
    }
    if (round) { lipFwd -= 18; lipUp += isV ? 18 : 24; }

    // ----- Jaw: lower lip, teeth, chin and neck front; the effect fades out toward the throat -----
    var jawAt = function (x, y, k) {
      var p = rotateAbout(x, y, HINGE, jaw.rot, k);
      return [p[0] + jaw.fwd * k, p[1] - jaw.up * k];
    };
    var jawWeight = function (x, y) { return y > 950 ? 0 : 1 - smooth((x - 330) / 270); };
    var lowerLip = function (x, y) { return x < 120 && y > 660 && y < 760; };
    var jawTf = function (x, y) {
      var p = jawAt(x, y, jawWeight(x, y));
      if (lowerLip(x, y)) { p[0] += lipFwd; p[1] -= lipUp; }
      return p;
    };

    var start = jawTf(176.6, 724.5), end = jawTf(539.5, 793.4);
    var tonguePts = [start, s.tu, s.tip, s.blade, s.front].concat(s.mid ? [s.mid] : []).concat([s.back, s.root, s.root2, end]);
    var lowerSegs = BASE.lower.slice(0, 13).map(function (seg) {
      var out = [seg[0]];
      for (var i = 1; i < seg.length; i += 2) { var p = jawTf(seg[i], seg[i + 1]); out.push(p[0], p[1]); }
      return out;
    }).concat(splineSegs(tonguePts)).concat(BASE.lower.slice(21).map(function (seg) {
      var out = [seg[0]];
      for (var i = 1; i < seg.length; i += 2) { var p = jawTf(seg[i], seg[i + 1]); out.push(p[0], p[1]); }
      return out;
    }));

    // ----- Velum: raised against the back wall for oral sounds, lowered for nasal ones -----
    var nasal = !isV && manner === 'nasal';
    var lowered = nasal || !!P.nasalized;
    var velumTf = function (x, y) {
      var p = lowered ? [x, y] : rotateAbout(x, y, [566, 345], -15, smooth((x - 560) / 50));
      if (round && x < 140 && y > 360) p[0] -= 18 * smooth((y - 360) / 40);
      return p;
    };
    if (!lowered && place === 'uvular' && !isV) hl = [650, 512];

    var stopped = !isV && ['plosive', 'affricate', 'click', 'implosive', 'ejective'].indexOf(manner) >= 0;
    var closedGlottis = !isV && (manner === 'ejective' || (place === 'glottal' && manner === 'plosive'));
    var buzz = (isV || voiced) && !closedGlottis;
    var folds = closedGlottis ? 'M 640 930 L 760 930'
      : buzz ? 'M 640 930 l 12 -12 l 12 24 l 12 -24 l 12 24 l 12 -24 l 12 24 l 12 -24 l 12 24 l 12 -24 l 12 12'
      : 'M 640 930 L 672 930 M 728 930 L 760 930';

    var alt = isV ? 'Side view of the head showing the tongue position for this vowel'
      : 'Side view of the head with the ' + place + ' place of articulation circled';
    var ln = function (d, cls) { return '<path class="' + (cls || 'ln') + '" d="' + d + '"></path>'; };
    var svg = '<svg class="tract" viewBox="0 0 800 1000" role="img" aria-label="' + alt + '">' +
      ln(pathD(BASE.head)) +
      ln(pathD(lowerSegs)) +
      ln(pathD(BASE.palate, velumTf)) +
      ln(pathD(BASE.larynx)) +
      '<path class="ln fill" d="' + pathD(BASE.teethU) + '"></path>' +
      '<path class="ln fill" d="' + pathD(BASE.teethL, function (x, y) { return jawAt(x, y, 1); }) + '"></path>' +
      ln(folds, 'ln thin');
    if (manner === 'ejective' && !isV) svg += ln('M 780 860 L 780 790 M 766 806 L 780 790 L 794 806', 'ln thin');
    if (manner === 'implosive' && !isV) svg += ln('M 780 790 L 780 860 M 766 844 L 780 860 L 794 844', 'ln thin');
    if (!nasal && !stopped) svg += ln('M 70 470 L 14 470 M 32 454 L 14 470 L 32 486', 'ln thin');
    if (lowered) svg += ln('M 22 262 L 4 296 M 4 274 L 4 296 L 22 288', 'ln thin');
    if (h2) svg += '<ellipse class="focus" cx="' + h2[0] + '" cy="' + h2[1] + '" rx="38" ry="30"></ellipse>';
    svg += '<ellipse class="focus" cx="' + Math.round(hl[0]) + '" cy="' + Math.round(hl[1]) + '" rx="38" ry="30"></ellipse>';
    return svg + '</svg>';
  };
})(window.SIPA = window.SIPA || {});
