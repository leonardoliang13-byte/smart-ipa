/* Sound inventory: IPA chart symbols with names, features, example words and audio sources. */
(function (S) {
  'use strict';
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
  var PL = ['bilabial', 'labiodental', 'dental', 'alveolar', 'postalveolar', 'retroflex', 'palatal', 'velar', 'uvular', 'pharyngeal', 'glottal'];
  var PLN = { alveolopalatal: 'Alveolo-palatal', labialvelar: 'Labial-velar', labialpalatal: 'Labial-palatal' };

  // '.' = empty cell, '#' = articulation judged impossible.
  var ROWS = [
    ['plosive', 'p b . . . . t d . . ʈ ɖ c ɟ k ɡ q ɢ . # ʔ #'],
    ['nasal', '. m . ɱ . . . n . . . ɳ . ɲ . ŋ . ɴ # # # #'],
    ['trill', '. ʙ . . . . . r . . . . . . # # . ʀ . . # #'],
    ['tap or flap', '. . . ⱱ . . . ɾ . . . ɽ . . # # . . . . # #'],
    ['fricative', 'ɸ β f v θ ð s z ʃ ʒ ʂ ʐ ç ʝ x ɣ χ ʁ ħ ʕ h ɦ'],
    ['lateral fricative', '# # # # . . ɬ ɮ . . . . . . . . . . # # # #'],
    ['approximant', '. . . ʋ . . . ɹ . . . ɻ . j . ɰ . . . . . .'],
    ['lateral approximant', '# # # # . . . l . . . ɭ . ʎ . ʟ . . # # # #']
  ];
  var NAME = { 'ⱱ': 'Voiced labiodental flap', 'ɾ': 'Voiced alveolar tap', 'ɽ': 'Voiced retroflex flap', 'ʔ': 'Glottal stop' };
  var by = {}, all = [];
  var add = function (o) { by[o.s] = o; all.push(o); return o; };

  var rows = ROWS.map(function (r) {
    var manner = r[0];
    var cells = r[1].split(' ').map(function (s, i) {
      if (s === '.' || s === '#') return { s: null, shade: s === '#' };
      var place = PL[i >> 1], voiced = i % 2 === 1, m = manner === 'tap or flap' ? 'tap' : manner;
      add({
        s: s, kind: 'consonant', cat: 'Pulmonic consonant', place: place, manner: m, voiced: voiced,
        name: NAME[s] || cap((voiced ? 'voiced ' : 'voiceless ') + place + ' ' + m),
        features: [['Voicing', voiced ? 'Voiced' : 'Voiceless'], ['Place', cap(place)], ['Manner', cap(manner)]],
        row: manner, col: i
      });
      return { s: s };
    });
    return { label: cap(manner), manner: manner, cells: cells };
  });

  var extra = function (cat, list) {
    return list.map(function (e) {
      return add({
        s: e[0], kind: 'consonant', cat: cat, name: e[1], place: e[2], manner: e[3], voiced: !!e[4], short: e[5] || '',
        features: [['Voicing', e[4] ? 'Voiced' : 'Voiceless'], ['Place', PLN[e[2]] || cap(e[2])], ['Manner', cap(e[3])]]
      }).s;
    });
  };
  var clicks = extra('Click', [
    ['ʘ', 'Bilabial click', 'bilabial', 'click', 0, 'Bilabial'],
    ['ǀ', 'Dental click', 'dental', 'click', 0, 'Dental'],
    ['ǃ', '(Post)alveolar click', 'postalveolar', 'click', 0, '(Post)alveolar'],
    ['ǂ', 'Palatoalveolar click', 'palatal', 'click', 0, 'Palatoalveolar'],
    ['ǁ', 'Alveolar lateral click', 'alveolar', 'click', 0, 'Alveolar lateral']
  ]);
  var implosives = extra('Voiced implosive', [
    ['ɓ', 'Voiced bilabial implosive', 'bilabial', 'implosive', 1, 'Bilabial'],
    ['ɗ', 'Voiced dental or alveolar implosive', 'alveolar', 'implosive', 1, 'Dental/alveolar'],
    ['ʄ', 'Voiced palatal implosive', 'palatal', 'implosive', 1, 'Palatal'],
    ['ɠ', 'Voiced velar implosive', 'velar', 'implosive', 1, 'Velar'],
    ['ʛ', 'Voiced uvular implosive', 'uvular', 'implosive', 1, 'Uvular']
  ]);
  var ejectives = extra('Ejective', [
    ['pʼ', 'Bilabial ejective', 'bilabial', 'ejective', 0, 'Bilabial'],
    ['tʼ', 'Dental or alveolar ejective', 'alveolar', 'ejective', 0, 'Dental/alveolar'],
    ['kʼ', 'Velar ejective', 'velar', 'ejective', 0, 'Velar'],
    ['sʼ', 'Alveolar ejective fricative', 'alveolar', 'ejective', 0, 'Alveolar fricative']
  ]);
  var others = extra('Other symbol', [
    ['ʍ', 'Voiceless labial-velar fricative', 'labialvelar', 'fricative', 0],
    ['w', 'Voiced labial-velar approximant', 'labialvelar', 'approximant', 1],
    ['ɥ', 'Voiced labial-palatal approximant', 'labialpalatal', 'approximant', 1],
    ['ʜ', 'Voiceless epiglottal fricative', 'epiglottal', 'fricative', 0],
    ['ʢ', 'Voiced epiglottal fricative', 'epiglottal', 'fricative', 1],
    ['ʡ', 'Epiglottal plosive', 'epiglottal', 'plosive', 0],
    ['ɕ', 'Voiceless alveolo-palatal fricative', 'alveolopalatal', 'fricative', 0],
    ['ʑ', 'Voiced alveolo-palatal fricative', 'alveolopalatal', 'fricative', 1],
    ['ɺ', 'Voiced alveolar lateral flap', 'alveolar', 'tap', 1],
    ['ɧ', 'Simultaneous ʃ and x', 'postalveolar', 'fricative', 0]
  ]);
  var affricates = extra('Affricate', [
    ['t͡s', 'Voiceless alveolar affricate', 'alveolar', 'affricate', 0],
    ['d͡z', 'Voiced alveolar affricate', 'alveolar', 'affricate', 1],
    ['t͡ʃ', 'Voiceless postalveolar affricate', 'postalveolar', 'affricate', 0],
    ['d͡ʒ', 'Voiced postalveolar affricate', 'postalveolar', 'affricate', 1],
    ['t͡ɕ', 'Voiceless alveolo-palatal affricate', 'alveolopalatal', 'affricate', 0],
    ['d͡ʑ', 'Voiced alveolo-palatal affricate', 'alveolopalatal', 'affricate', 1],
    ['ʈ͡ʂ', 'Voiceless retroflex affricate', 'retroflex', 'affricate', 0],
    ['ɖ͡ʐ', 'Voiced retroflex affricate', 'retroflex', 'affricate', 1]
  ]).concat(extra('Double articulation', [
    ['k͡p', 'Voiceless labial-velar plosive', 'labialvelar', 'plosive', 0],
    ['ɡ͡b', 'Voiced labial-velar plosive', 'labialvelar', 'plosive', 1]
  ]));

  var HN = ['Close', 'Near-close', 'Close-mid', 'Mid', 'Open-mid', 'Near-open', 'Open'];
  var BN = { 0: 'Front', 0.2: 'Near-front', 0.5: 'Central', 0.8: 'Near-back', 1: 'Back' };
  var VOW = 'i,0,0,0 y,0,0,1 ɨ,0,.5,0 ʉ,0,.5,1 ɯ,0,1,0 u,0,1,1 ɪ,1,.2,0 ʏ,1,.2,1 ʊ,1,.8,1 e,2,0,0 ø,2,0,1 ɘ,2,.5,0 ɵ,2,.5,1 ɤ,2,1,0 o,2,1,1 ə,3,.5,0 ɛ,4,0,0 œ,4,0,1 ɜ,4,.5,0 ɞ,4,.5,1 ʌ,4,1,0 ɔ,4,1,1 æ,5,0,0 ɐ,5,.5,0 a,6,0,0 ɶ,6,0,1 ɑ,6,1,0 ɒ,6,1,1';
  var nodes = {}, vnodes = [];
  VOW.split(' ').forEach(function (v) {
    var p = v.split(','), hi = +p[1], b = +p[2], r = p[3] === '1', h = hi / 6;
    var lone = p[0] === 'ə' || p[0] === 'ɐ';
    add({
      s: p[0], kind: 'vowel', cat: 'Vowel', h: h, hi: hi, b: b, r: r,
      name: HN[hi] + ' ' + BN[b].toLowerCase() + (lone ? '' : r ? ' rounded' : ' unrounded') + ' vowel',
      features: [['Height', HN[hi]], ['Backness', BN[b]], ['Lips', lone ? 'Neutral' : r ? 'Rounded' : 'Unrounded']]
    });
    var k = hi + '|' + b;
    if (!nodes[k]) { nodes[k] = { left: (50 * h + b * (100 - 50 * h)).toFixed(1) + '%', top: (h * 100).toFixed(1) + '%', syms: [] }; vnodes.push(nodes[k]); }
    nodes[k].syms.push(p[0]);
  });

  // symbol|language|word|IPA|gloss (gloss empty for English words)
  var EX = 'p|English|spin|spɪn|\nb|English|bat|bæt|\nt|English|stop|stɑp|\nd|English|dog|dɑɡ|\nʈ|Hindi|टमाटर ṭamāṭar|ʈəmaːʈər|tomato\nɖ|Hindi|डाल ḍāl|ɖaːl|branch\nc|Hungarian|tyúk|cuːk|hen\nɟ|Hungarian|gyár|ɟaːr|factory\nk|English|sky|skaj|\nɡ|English|go|ɡow|\nq|Arabic|قلب qalb|qalb|heart\nɢ|Persian|غذا ghazā|ɢæzɒː|food\nʔ|English|uh-oh|ˈʌʔow|\nm|English|man|mæn|\nɱ|English|symphony|ˈsɪɱfəni|\nn|English|no|now|\nɳ|Hindi|ठण्डा ṭhaṇḍā|ʈʰəɳɖaː|cold\nɲ|Spanish|año|ˈaɲo|year\nŋ|English|sing|sɪŋ|\nɴ|Japanese|日本 nihon|ɲihoɴ|Japan\nʙ|Nias|simbi|siʙi|lower jaw\nr|Spanish|perro|ˈpero|dog\nʀ|German|rot|ʀoːt|red\nⱱ|Mono|vwa|ⱱa|send\nɾ|English (American)|better|ˈbɛɾɚ|\nɽ|Hindi|लड़का laṛkā|ləɽkaː|boy\nɸ|Japanese|富士 fuji|ɸɯʑi|Mount Fuji\nβ|Spanish|lobo|ˈloβo|wolf\nf|English|fan|fæn|\nv|English|van|væn|\nθ|English|thin|θɪn|\nð|English|this|ðɪs|\ns|English|see|siː|\nz|English|zoo|zuː|\nʃ|English|she|ʃiː|\nʒ|English|vision|ˈvɪʒən|\nʂ|Mandarin|书 shū|ʂu˥|book\nʐ|Polish|żona|ˈʐɔna|wife\nç|German|ich|ɪç|I\nʝ|Greek|γη gi|ʝi|earth\nx|Spanish|jamón|xaˈmon|ham\nɣ|Greek|γάλα gála|ˈɣala|milk\nχ|German|Dach|daχ|roof\nʁ|French|rouge|ʁuʒ|red\nħ|Arabic|حال ḥāl|ħaːl|condition\nʕ|Arabic|عين ʿayn|ʕajn|eye\nh|English|hat|hæt|\nɦ|English|behind|bɪˈɦajnd|\nɬ|Welsh|llan|ɬan|parish\nɮ|Zulu|dlala|ɮala|play\nʋ|Hindi|वन van|ʋən|forest\nɹ|English|red|ɹɛd|\nɻ|Mandarin|肉 ròu|ɻoʊ˥˩|meat\nj|English|yes|jɛs|\nɰ|Korean|의사 uisa|ɰisa|doctor\nl|English|let|lɛt|\nɭ|Tamil|வாள் vāḷ|ʋaːɭ|sword\nʎ|Italian|figlio|ˈfiʎʎo|son\nʟ|Mid-Wahgi|aglagle|aʟaʟe|dizzy\nʘ|ǂHoan|ʘoa|ʘoa|two\nǀ|Zulu|icici|iːǀiːǀi|earring\nǃ|Zulu|iqaqa|iːǃaːǃa|polecat\nǂ|Khoekhoe|ǂKhoesaob|ǂkʰoesaob|July\nǁ|Xhosa|isiXhosa|isiǁʰoːsa|the Xhosa language\nɓ|Vietnamese|ba|ɓaː˧|three\nɗ|Vietnamese|đi|ɗi˧|go\nʄ|Swahili|jambo|ʄambo|hello\nɠ|Swahili|Uganda|uɠanda|Uganda\nʛ|Mam|q\'a|ʛa|fire\npʼ|Quechua|p\'acha|pʼatʃa|clothes\ntʼ|Quechua|t\'anta|tʼanta|bread\nkʼ|Georgian|კაბა kaba|kʼaba|dress\nsʼ|Tlingit|s\'eek|sʼiːk|black bear\nʍ|English (Scottish)|which|ʍɪtʃ|\nw|English|we|wiː|\nɥ|French|huit|ɥit|eight\nʜ|Agul|мехӀ|mɛʜ|whey\nʢ|Arabic (Iraqi)|تعال taʿāl|tɑʢɑːl|come!\nʡ|Archi|гӀарз|ʡarz|complaint\nɕ|Mandarin|西 xī|ɕi˥|west\nʑ|Polish|zima|ˈʑima|winter\nɺ|Japanese|六 roku|ɺokɯ|six\nɧ|Swedish|sjal|ɧɑːl|scarf\nt͡s|English|cats|kæt͡s|\nd͡z|Italian|zero|ˈd͡zɛːro|zero\nt͡ʃ|English|chip|t͡ʃɪp|\nd͡ʒ|English|jam|d͡ʒæm|\nt͡ɕ|Mandarin|鸡 jī|t͡ɕi˥|chicken\nd͡ʑ|Japanese|時間 jikan|d͡ʑikaɴ|time\nʈ͡ʂ|Mandarin|中 zhōng|ʈ͡ʂʊŋ˥|middle\nɖ͡ʐ|Polish|dżem|ɖ͡ʐɛm|jam\nk͡p|Yoruba|pápá|k͡pák͡pá|field\nɡ͡b|Yoruba|gbogbo|ɡ͡boɡ͡bo|all\ni|English|see|siː|\ny|French|tu|ty|you\nɨ|Russian|ты ty|tɨ|you\nʉ|English (Australian)|goose|ɡʉːs|\nɯ|Turkish|kız|kɯz|girl\nu|English|boot|buːt|\nɪ|English|sit|sɪt|\nʏ|German|hübsch|hʏpʃ|pretty\nʊ|English|book|bʊk|\ne|Spanish|mesa|ˈmesa|table\nø|French|peu|pø|few\nɘ|English (New Zealand)|bit|bɘt|\nɵ|Swedish|full|fɵlː|full\nɤ|Mandarin|喝 hē|xɤ˥|drink\no|Spanish|no|no|no\nə|English|about|əˈbawt|\nɛ|English|bed|bɛd|\nœ|French|neuf|nœf|nine\nɜ|English (British)|bird|bɜːd|\nɞ|Irish|tomhail|tɞːlʲ|consume\nʌ|English|cup|kʌp|\nɔ|English (British)|thought|θɔːt|\næ|English|cat|kæt|\nɐ|German|Wasser|ˈvasɐ|water\na|Spanish|casa|ˈkasa|house\nɶ|Danish|grøn|ˈkʁɶnˀ|green\nɑ|English (American)|father|ˈfɑðɚ|\nɒ|English (British)|lot|lɒt|';
  EX.split('\n').forEach(function (ln) {
    var p = ln.split('|');
    if (by[p[0]]) by[p[0]].ex = { lang: p[1], word: p[2], ipa: '[' + p[3] + ']', gloss: p[4] };
  });

  // symbol|Wikimedia Commons path|licence|author ('' = see the file page)
  var AUDIO = 'p|5/51/Voiceless_bilabial_plosive.ogg|CC BY-SA 3.0|\nb|2/2c/Voiced_bilabial_plosive.ogg|CC BY-SA 3.0|\nt|0/02/Voiceless_alveolar_plosive.ogg|CC BY-SA 3.0|\nd|0/01/Voiced_alveolar_plosive.ogg|CC BY-SA 3.0|\nʈ|b/b0/Voiceless_retroflex_stop.oga|CC BY-SA 3.0|Peter Isotalo\nɖ|2/27/Voiced_retroflex_stop.oga|CC BY-SA 3.0|\nc|5/5d/Voiceless_palatal_plosive.ogg|CC BY-SA 3.0|Peter Isotalo\nɟ|1/1d/Voiced_palatal_plosive.ogg|CC BY-SA 3.0|\nk|e/e3/Voiceless_velar_plosive.ogg|CC BY-SA 3.0|\nɡ|1/12/Voiced_velar_plosive_02.ogg|CC BY-SA 3.0|\nq|1/19/Voiceless_uvular_plosive.ogg|CC BY-SA 3.0|\nɢ|b/b6/Voiced_uvular_stop.oga|CC BY-SA 3.0|\nʔ|4/4d/Glottal_stop.ogg|CC BY-SA 3.0|Peter Isotalo (assumed by Commons)\nm|a/a9/Bilabial_nasal.ogg|CC BY-SA 3.0|\nɱ|1/18/Labiodental_nasal.ogg|CC BY-SA 3.0|\nn|2/29/Alveolar_nasal.ogg|CC BY-SA 3.0|\nɳ|a/af/Retroflex_nasal.ogg|CC BY-SA 3.0|\nɲ|4/46/Palatal_nasal.ogg|CC BY-SA 3.0|\nŋ|3/39/Velar_nasal.ogg|CC BY-SA 3.0|\nɴ|3/3e/Uvular_nasal.ogg|CC BY-SA 3.0|\nʙ|e/e7/Bilabial_trill.ogg|CC BY-SA 3.0|\nr|c/ce/Alveolar_trill.ogg|CC BY-SA 3.0|\nʀ|c/cb/Uvular_trill.ogg|CC BY-SA 3.0|\nⱱ|2/2c/Labiodental_flap.ogg|CC BY-SA 3.0|\nɾ|a/a0/Alveolar_tap.ogg|CC BY-SA 3.0|\nɽ|8/87/Retroflex_flap.ogg|CC BY-SA 3.0|\nɸ|4/41/Voiceless_bilabial_fricative.ogg|CC BY-SA 3.0|\nβ|3/37/Voiced_bilabial_fricative.ogg|CC BY-SA 3.0|\nf|c/c7/Voiceless_labio-dental_fricative.ogg|CC0|Nixinova\nv|4/42/Voiced_labio-dental_fricative.ogg|CC0|Nixinova\nθ|8/80/Voiceless_dental_fricative.ogg|CC BY-SA 3.0|\nð|6/6a/Voiced_dental_fricative.ogg|CC BY-SA 3.0|\ns|a/ac/Voiceless_alveolar_sibilant.ogg|CC BY-SA 3.0|Peter Isotalo\nz|c/c0/Voiced_alveolar_sibilant.ogg|CC BY-SA 3.0|\nʃ|c/cc/Voiceless_palato-alveolar_sibilant.ogg|CC BY-SA 3.0|Peter Isotalo\nʒ|3/30/Voiced_palato-alveolar_sibilant.ogg|CC BY-SA 3.0|Peter Isotalo\nʂ|b/b1/Voiceless_retroflex_sibilant.ogg|CC BY-SA 3.0|Peter Isotalo\nʐ|7/7f/Voiced_retroflex_sibilant.ogg|CC BY-SA 3.0|Peter Isotalo\nç|a/ab/Voiceless_palatal_fricative.ogg|CC BY-SA 3.0|\nʝ|a/ac/Voiced_palatal_fricative.ogg|CC BY-SA 3.0|\nx|0/0f/Voiceless_velar_fricative.ogg|CC BY-SA 3.0|\nɣ|4/47/Voiced_velar_fricative.ogg|CC BY-SA 3.0|\nχ|c/c8/Voiceless_uvular_fricative.ogg|CC BY-SA 3.0|\nʁ|a/af/Voiced_uvular_fricative.ogg|CC BY-SA 3.0|\nħ|b/b2/Voiceless_pharyngeal_fricative.ogg|CC BY-SA 3.0|\nʕ|c/cd/Voiced_pharyngeal_fricative.ogg|CC BY-SA 3.0|Peter Isotalo\nh|d/da/Voiceless_glottal_fricative.ogg|CC BY-SA 3.0|\nɦ|e/e2/Voiced_glottal_fricative.ogg|CC BY-SA 3.0|Karmosin\nɬ|e/ea/Voiceless_alveolar_lateral_fricative.ogg|CC BY-SA 3.0|tFighterPilot\nɮ|6/6f/Voiced_alveolar_lateral_fricative.ogg|CC BY-SA 3.0|Adamsa123\nʋ|e/ee/Labiodental_approximant.ogg|CC BY-SA 3.0|\nɹ|1/1f/Alveolar_approximant.ogg|CC BY-SA 3.0|Erutuon\nɻ|b/bf/Retroflex_Approximant2.oga|CC BY-SA 4.0|Pranav Jayachand\nj|e/e8/Palatal_approximant.ogg|CC BY-SA 3.0|\nɰ|5/5c/Voiced_velar_approximant.ogg|CC BY-SA 3.0|\nl|b/bc/Alveolar_lateral_approximant.ogg|CC BY-SA 3.0|\nɭ|d/d1/Retroflex_lateral_approximant.ogg|CC BY-SA 3.0|\nʎ|d/d9/Palatal_lateral_approximant.ogg|CC BY-SA 3.0|\nʟ|d/d3/Velar_lateral_approximant.ogg|CC BY-SA 3.0|\nʘ|2/2b/Clic_bilabial_sourd.ogg|CC BY-SA 3.0|Vincent Ramos\nǀ|1/1f/Dental_click.ogg|CC BY-SA 3.0|\nǃ|3/3c/Postalveolar_click.ogg|CC BY-SA 3.0|\nǂ|8/89/Palatoalveolar_click.ogg|CC BY-SA 3.0|\nǁ|f/f4/Alveolar_lateral_click.ogg|CC BY-SA 3.0|\nɓ|3/31/Voiced_bilabial_implosive.ogg|CC BY-SA 3.0|Peter Isotalo\nɗ|c/c3/Voiced_alveolar_implosive.ogg|CC BY-SA 3.0|Peter Isotalo\nʄ|2/2c/Voiced_palatal_implosive.ogg|CC BY-SA 3.0|\nɠ|a/a8/Voiced_velar_implosive.ogg|CC BY-SA 3.0|\nʛ|0/00/Voiced_uvular_implosive.ogg|CC BY-SA 3.0|\npʼ|6/64/Bilabial_ejective_plosive.ogg|CC BY-SA 3.0|\ntʼ|d/d7/Alveolar_ejective_plosive.ogg|CC BY-SA 3.0|\nkʼ|a/a0/Velar_ejective_plosive.ogg|CC BY-SA 3.0|\nsʼ|7/7c/Alveolar_ejective_fricative.ogg|CC BY-SA 3.0|\nʍ|a/a7/Voiceless_labio-velar_fricative.ogg|CC BY-SA 3.0|\nw|f/f2/Voiced_labio-velar_approximant.ogg|CC BY-SA 3.0|\nɥ|3/32/LL-Q150_%28fra%29-WikiLucas00-IPA_%C9%A5.wav|CC BY-SA 4.0|WikiLucas00\nʜ|7/7b/Voiceless_epiglottal_trill.ogg|CC BY-SA 4.0|Adamsa123\nʢ|1/18/Voiced_epiglottal_trill_2.ogg|CC BY-SA 4.0|Adamsa123\nʡ|b/b2/Epiglottal_stop.ogg|CC BY-SA 3.0|Adamsa123\nɕ|0/0b/Voiceless_alveolo-palatal_sibilant.ogg|CC BY-SA 3.0|\nʑ|1/15/Voiced_alveolo-palatal_sibilant.ogg|CC BY-SA 3.0|Peter Isotalo\nɺ|c/c9/Voiced_alveolar_lateral_flap.wav|CC0|Eshaan011\nɧ|4/42/Voiceless_dorso-palatal_velar_fricative.ogg|CC BY-SA 3.0|Peter Isotalo\nt͡s|9/9d/Voiceless_alveolar_sibilant_affricate.oga|CC BY-SA 3.0|\nd͡z|d/d8/Voiced_alveolar_sibilant_affricate.oga|CC BY-SA 3.0|\nt͡ʃ|9/97/Voiceless_palato-alveolar_affricate.ogg|CC BY-SA 3.0|Peter Isotalo\nd͡ʒ|e/e6/Voiced_palato-alveolar_affricate.ogg|Public domain|Octane\nt͡ɕ|c/c4/Voiceless_alveolo-palatal_affricate.ogg|CC BY-SA 3.0|Halibutt\nd͡ʑ|c/c1/Voiced_alveolo-palatal_affricate.ogg|CC BY-SA 3.0|Halibutt\nʈ͡ʂ|e/e9/Voiceless_retroflex_affricate.ogg|CC BY-SA 3.0|Halibutt\nɖ͡ʐ|5/58/Voiced_retroflex_affricate.ogg|CC BY-SA 3.0|Halibutt\nk͡p|5/5f/Voiceless_labial-velar_plosive.ogg|Public domain|Anak 1\nɡ͡b|1/1f/Voiced_labial-velar_plosive.ogg|CC BY 2.5|Moyogo (assumed by Commons)\ni|9/91/Close_front_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\ny|e/ea/Close_front_rounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nɨ|5/53/Close_central_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nʉ|6/66/Close_central_rounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nɯ|e/e8/Close_back_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nu|5/5d/Close_back_rounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nɪ|4/4c/Near-close_near-front_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nʏ|e/e3/Near-close_near-front_rounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nʊ|d/d5/Near-close_near-back_rounded_vowel.ogg|CC BY-SA 3.0|Denelson83\ne|6/6c/Close-mid_front_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nø|5/53/Close-mid_front_rounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nɘ|6/60/Close-mid_central_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nɵ|b/b5/Close-mid_central_rounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nɤ|2/26/Close-mid_back_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\no|8/84/Close-mid_back_rounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nə|d/d9/Mid-central_vowel.ogg|CC BY-SA 3.0|Denelson83\nɛ|7/71/Open-mid_front_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nœ|9/9f/Open-mid_front_rounded_vowel_%282%29.ogg|CC BY-SA 3.0|Denelson83\nɜ|0/01/Open-mid_central_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nɞ|d/d9/Open-mid_central_rounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nʌ|8/80/PR-open-mid_back_unrounded_vowel2.ogg|CC BY-SA 4.0|RoachPeter\nɔ|d/d0/PR-open-mid_back_rounded_vowel.ogg|CC BY-SA 4.0|RoachPeter\næ|c/c9/Near-open_front_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nɐ|2/22/Near-open_central_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\na|0/0e/PR-open_front_unrounded_vowel.ogg|CC BY-SA 4.0|RoachPeter\nɶ|c/c1/Open_front_rounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nɑ|e/e5/Open_back_unrounded_vowel.ogg|CC BY-SA 3.0|Denelson83\nɒ|3/31/PR-open_back_rounded_vowel.ogg|CC BY-SA 4.0|RoachPeter';
  var BASE = 'https://upload.wikimedia.org/wikipedia/commons/';
  AUDIO.split('\n').forEach(function (ln) {
    var p = ln.split('|');
    if (!by[p[0]]) return;
    var file = p[1].slice(p[1].lastIndexOf('/') + 1);
    by[p[0]].audio = {
      mp3: BASE + 'transcoded/' + p[1] + '/' + file + '.mp3',
      original: BASE + p[1],
      page: 'https://commons.wikimedia.org/wiki/File:' + file,
      file: decodeURIComponent(file).replace(/_/g, ' '),
      licence: p[2], author: p[3]
    };
  });

  S.sounds = {
    by: by, all: all, rows: rows, vnodes: vnodes,
    clicks: clicks, implosives: implosives, ejectives: ejectives, others: others, affricates: affricates,
    places: ['Bilabial', 'Labio­dental', 'Dental', 'Alveolar', 'Post­alveolar', 'Retroflex', 'Palatal', 'Velar', 'Uvular', 'Pharyn­geal', 'Glottal']
  };

  // Plain-language explanation and legend for the detail panel.
  S.describe = function (o) {
    if (o.kind === 'vowel') {
      var part = o.b <= 0.2 ? 'front' : o.b >= 0.8 ? 'back' : 'centre';
      var hgt = o.hi <= 1 ? 'high, close to the roof of the mouth' : o.hi >= 5 ? 'low, with the jaw open' : 'at mid height';
      var lipsV = o.features[2][1];
      var lips = lipsV === 'Rounded' ? 'Round the lips.' : lipsV === 'Neutral' ? 'Keep the lips relaxed.' : 'Keep the lips spread.';
      return {
        how: 'Hold the ' + part + ' of the tongue ' + hgt + '. ' + lips + ' Air flows freely with no obstruction.',
        legend: [['Highest point of tongue', o.features[1][1]], ['Tongue height', o.features[0][1]], ['Lips', lipsV], ['Vocal folds', 'Vibrating']]
      };
    }
    var W = {
      bilabial: ['both lips', 'Lower lip', 'Upper lip'],
      labiodental: ['your lower lip against your upper teeth', 'Lower lip', 'Upper teeth'],
      dental: ['the tongue tip against the upper teeth', 'Tongue tip', 'Upper teeth'],
      alveolar: ['the tongue tip against the ridge behind the upper teeth', 'Tongue tip or blade', 'Alveolar ridge'],
      postalveolar: ['the tongue blade just behind the alveolar ridge', 'Tongue blade', 'Behind the alveolar ridge'],
      retroflex: ['the tongue tip curled back toward the hard palate', 'Tongue tip, curled back', 'Hard palate'],
      alveolopalatal: ['the tongue blade and front against the front of the hard palate', 'Tongue blade and front', 'Front of the hard palate'],
      palatal: ['the body of the tongue against the hard palate', 'Front of the tongue', 'Hard palate'],
      velar: ['the back of the tongue against the soft palate', 'Back of the tongue', 'Soft palate (velum)'],
      uvular: ['the back of the tongue against the uvula', 'Back of the tongue', 'Uvula'],
      pharyngeal: ['the root of the tongue toward the back wall of the throat', 'Tongue root', 'Back wall of the pharynx'],
      epiglottal: ['the epiglottis toward the back wall of the throat', 'Epiglottis', 'Back wall of the pharynx'],
      glottal: ['the vocal folds', 'Vocal folds', 'None'],
      labialvelar: ['the lips and, at the same time, the back of the tongue against the soft palate', 'Lips and back of the tongue', 'Soft palate (velum)'],
      labialpalatal: ['rounded lips and, at the same time, the front of the tongue near the hard palate', 'Lips and front of the tongue', 'Hard palate']
    }[o.place];
    var p = W[0];
    var M = {
      plosive: 'Make a complete closure with ' + p + ', let air pressure build, then release it in a burst.',
      nasal: 'Make a complete closure with ' + p + ' and lower the soft palate so the air escapes through the nose.',
      trill: 'Set a loose contact with ' + p + ' so the airstream makes it flutter several times.',
      tap: 'Flick one very brief contact with ' + p + '.',
      fricative: 'Form a narrow gap with ' + p + ' so the air hisses through with audible friction.',
      'lateral fricative': 'Block the centre of the mouth with ' + p + ' and force air noisily around the sides of the tongue.',
      approximant: 'Narrow the mouth with ' + p + ', but not enough to cause friction.',
      'lateral approximant': 'Touch the centre of the mouth with ' + p + ' and let air flow smoothly around the sides of the tongue.',
      affricate: 'Start with a complete closure with ' + p + ', then release it slowly into friction.',
      click: 'Seal the mouth with ' + p + ' and with the back of the tongue, lower the tongue body to create suction, then release the front.',
      implosive: 'Make a closure with ' + p + ', lower the larynx while voicing, then release so air moves inward.',
      ejective: 'Make a closure with ' + p + ', close the glottis and raise the larynx to push the air out sharply.'
    }[o.manner];
    var closed = o.manner === 'ejective' || (o.place === 'glottal' && o.manner === 'plosive');
    var air = {
      nasal: 'Through the nose', 'lateral fricative': 'Mouth, around the sides of the tongue', 'lateral approximant': 'Mouth, around the sides of the tongue',
      click: 'Inward, powered by the tongue', implosive: 'Inward, powered by the larynx', ejective: 'Outward, powered by the larynx',
      plosive: 'Mouth, released after a full stop', affricate: 'Mouth, released after a full stop'
    }[o.manner] || 'Mouth, along the centre of the tongue';
    return {
      how: M + (closed ? '' : o.voiced ? ' The vocal folds vibrate.' : ' The vocal folds stay apart.'),
      legend: [['Active articulator', W[1]], ['Passive articulator', W[2]], ['Airflow', air], ['Vocal folds', closed ? 'Closed' : o.voiced ? 'Vibrating' : 'Apart']]
    };
  };

  // Up to three nearby sounds worth comparing.
  S.related = function (o) {
    var out = [];
    if (o.kind === 'vowel') {
      all.forEach(function (v) {
        if (v.kind !== 'vowel' || v.s === o.s) return;
        if (v.hi === o.hi && v.b === o.b) out.unshift([v.s, v.r ? 'Rounded counterpart' : 'Unrounded counterpart']);
        else if (v.b === o.b && v.r === o.r && Math.abs(v.hi - o.hi) <= 2 && out.length < 3) out.push([v.s, v.features[0][1] + ' (' + (v.hi < o.hi ? 'higher' : 'lower') + ')']);
      });
    } else if (o.row) {
      var cells = rows.filter(function (r) { return r.manner === o.row; })[0].cells;
      var pair = cells[o.col ^ 1];
      if (pair && pair.s) out.push([pair.s, o.voiced ? 'Voiceless counterpart' : 'Voiced counterpart']);
      for (var i = o.col - 2; i >= 0; i -= 2) { if (cells[i].s) { out.push([cells[i].s, by[cells[i].s].features[1][1] + ' (further forward)']); break; } }
      for (var j = o.col + 2; j < cells.length; j += 2) { if (cells[j].s) { out.push([cells[j].s, by[cells[j].s].features[1][1] + ' (further back)']); break; } }
    } else {
      all.forEach(function (v) {
        if (v.s !== o.s && v.kind === 'consonant' && v.place === o.place && out.length < 3 && (v.cat === o.cat || v.manner === 'plosive' || v.manner === 'fricative')) {
          out.push([v.s, v.cat === o.cat ? v.name : 'Pulmonic: ' + v.name.toLowerCase()]);
        }
      });
    }
    return out.slice(0, 3);
  };

  // Vocal-tract drawing parameters for a sound.
  S.tractParams = function (o) {
    return {
      kind: o.kind, place: o.place || 'alveolar', manner: o.manner || 'plosive', voiced: !!o.voiced,
      vheight: o.h || 0, vback: o.b || 0, rounded: !!o.r, nasalized: false, secondary: 'none'
    };
  };
})(window.SIPA = window.SIPA || {});
