/* Diacritics and suprasegmentals (stress, length, boundaries, tones). */
(function (S) {
  'use strict';
  var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };

  // ---------- Diacritics ----------
  var bases = [
    ['p', 0, 'bilabial', 'plosive'], ['t', 0, 'alveolar', 'plosive'], ['k', 0, 'velar', 'plosive'],
    ['b', 1, 'bilabial', 'plosive'], ['d', 1, 'alveolar', 'plosive'], ['ɡ', 1, 'velar', 'plosive'],
    ['m', 1, 'bilabial', 'nasal'], ['n', 1, 'alveolar', 'nasal'], ['l', 1, 'alveolar', 'lateral approximant'],
    ['s', 0, 'alveolar', 'fricative'], ['z', 1, 'alveolar', 'fricative'], ['ɹ', 1, 'alveolar', 'approximant']
  ].map(function (b) { return { s: b[0], kind: 'consonant', voiced: !!b[1], place: b[2], manner: b[3] }; })
    .concat([['i', 0, 0, 0, 'close front'], ['e', 0.33, 0, 0, 'close-mid front'], ['a', 1, 0, 0, 'open front'],
      ['o', 0.33, 1, 1, 'close-mid back'], ['u', 0, 1, 1, 'close back'], ['ə', 0.5, 0.5, 0, 'mid central']]
      .map(function (v) { return { s: v[0], kind: 'vowel', h: v[1], b: v[2], r: !!v[3], pos: v[4] }; }));
  bases.forEach(function (b) {
    b.name = b.kind === 'vowel'
      ? cap(b.pos + (b.s === 'ə' ? '' : b.r ? ' rounded' : ' unrounded') + ' vowel')
      : cap((b.voiced ? 'voiced ' : 'voiceless ') + b.place + ' ' + b.manner);
  });

  // id|mark|name|group|applies to (C consonant, V vowel, B both)|effect|example language|word|IPA
  var RAW = 'vl|̥|Voiceless|A|B|The vocal folds stay apart on a sound that is normally voiced.|English|play|pl̥eɪ\n' +
    'vd|̬|Voiced|A|C|Adds vocal fold vibration to a sound that is normally voiceless.|Spanish|mismo|ˈmis̬mo\n' +
    'br|̤|Breathy voiced|A|B|The vocal folds vibrate while staying slightly apart, giving a murmured quality.|Gujarati|બાર bār|ba̤r\n' +
    'cr|̰|Creaky voiced|A|B|The vocal folds vibrate slowly and irregularly, giving a creaky quality.|Hausa|ƴaƴa|j̰aj̰a\n' +
    'asp|ʰ|Aspirated|A|C|A puff of breath follows the release before voicing starts.|English|pin|pʰɪn\n' +
    'den|̪|Dental|B|C|The tongue touches the upper teeth instead of the ridge behind them.|English|tenth|tɛn̪θ\n' +
    'api|̺|Apical|B|C|Made with the very tip of the tongue.|Basque|su|s̺u\n' +
    'lam|̻|Laminal|B|C|Made with the flat blade of the tongue, just behind the tip.|Basque|zu|s̻u\n' +
    'lin|̼|Linguolabial|B|C|The tongue tip touches the upper lip.|Tangoa|tete|t̼ɛt̼ɛ\n' +
    'adv|̟|Advanced|B|B|The tongue sits a little further forward than the base symbol implies.|English|key|k̟iː\n' +
    'ret|̠|Retracted|B|B|The tongue sits a little further back than the base symbol implies.|English|tree|t̠ɹiː\n' +
    'rai|̝|Raised|B|B|The tongue is closer to the roof of the mouth than the base symbol implies.|Czech|řeka|ˈr̝ɛka\n' +
    'low|̞|Lowered|B|B|The tongue is further from the roof of the mouth than the base symbol implies.|Spanish|lobo|ˈloβ̞o\n' +
    'cen|̈|Centralized|B|V|The vowel is pulled toward the centre of the mouth.|||\n' +
    'mcen|̽|Mid-centralized|B|V|The vowel is pulled toward the position of schwa.|||\n' +
    'atr|̘|Advanced tongue root|B|V|The tongue root moves forward, widening the throat.|||\n' +
    'rtr|̙|Retracted tongue root|B|V|The tongue root moves back, narrowing the throat.|||\n' +
    'lab|ʷ|Labialized|C|C|The lips round while the main articulation is made.|English|quick|kʷɪk\n' +
    'pal|ʲ|Palatalized|C|C|The front of the tongue rises toward the hard palate at the same time.|Russian|нет net|nʲet\n' +
    'vel|ˠ|Velarized|C|C|The back of the tongue rises toward the soft palate at the same time.|Irish|naoi|n̪ˠiː\n' +
    'pha|ˤ|Pharyngealized|C|C|The tongue root pulls back toward the throat wall at the same time.|Arabic|صيف ṣayf|sˤajf\n' +
    'vph|̴|Velarized or pharyngealized|C|C|A dark quality from raising the back of the tongue or retracting its root.|English|full|fʊɫ\n' +
    'nas|̃|Nasalized|C|B|The soft palate lowers, so air also flows through the nose.|French|bon|bɔ̃\n' +
    'rho|˞|Rhotic|C|V|The vowel takes on an r-like colour.|English (American)|bird|bɝd\n' +
    'mor|̹|More rounded|C|V|The lips are rounder than the base symbol implies.|||\n' +
    'les|̜|Less rounded|C|V|The lips are less round than the base symbol implies.|||\n' +
    'nrel|ⁿ|Nasal release|D|C|The stop is released through the nose instead of the mouth.|English|button|ˈbʌtⁿn̩\n' +
    'lrel|ˡ|Lateral release|D|C|The stop is released around the sides of the tongue.|English|bottle|ˈbɒtˡl̩\n' +
    'nar|̚|No audible release|D|C|The closure is made but not audibly released.|English|apt|æp̚t\n' +
    'syl|̩|Syllabic|D|C|The consonant forms the core of a syllable, as a vowel normally would.|English|button|ˈbʌtn̩\n' +
    'nsyl|̯|Non-syllabic|D|V|The vowel does not form its own syllable. It glides into its neighbour.|English|boy|bɔɪ̯';
  var dia = RAW.split('\n').map(function (ln) {
    var p = ln.split('|'), cp = p[1].codePointAt(0);
    return {
      id: p[0], m: p[1], name: p[2], grp: p[3], ap: p[4], effect: p[5], exLang: p[6], exWord: p[7],
      exIpa: p[8] ? '[' + p[8] + ']' : '', spacing: !(cp >= 0x300 && cp <= 0x36F), glyph: '◌' + p[1]
    };
  });

  S.diacritics = {
    bases: bases, list: dia,
    exclusive: [['vl', 'vd', 'br', 'cr'], ['adv', 'ret'], ['rai', 'low'], ['mor', 'les'], ['syl', 'nsyl'], ['api', 'lam'], ['pal', 'vel', 'pha', 'vph'], ['cen', 'mcen'], ['atr', 'rtr']],
    groups: [
      ['A', 'Voice', 'How the vocal folds behave'],
      ['B', 'Tongue position', 'Fine-tunes where the sound is made'],
      ['C', 'Added articulation', 'A second gesture on top of the main one'],
      ['D', 'Release and syllable role', 'How the sound ends, or its role in the syllable']
    ],
    fits: function (x, base) { return x.ap === 'B' || (x.ap === 'V') === (base.kind === 'vowel'); }
  };

  // ---------- Suprasegmentals and tones ----------
  // Each item: segs = syllables to draw and play: label, duration, pitch levels (1 low to 5 high), highlighted, pause after.
  var Sg = function (l, d, p, hl, gap) { return { l: l, d: d, p: p, hl: !!hl, gap: gap || 0 }; };
  S.prosody = {
    groups: [
      ['A', 'Stress and length', 'How strong and how long'],
      ['B', 'Boundaries and linking', 'Where speech breaks, and where it does not'],
      ['C', 'Level tones', 'Pitch held steady on a syllable'],
      ['D', 'Contour tones', 'Pitch that moves within a syllable'],
      ['E', 'Pitch steps and intonation', 'Pitch across words and phrases']
    ],
    cats: { A: 'Suprasegmental', B: 'Suprasegmental', C: 'Level tone', D: 'Contour tone', E: 'Tone and intonation' },
    items: [
      { id: 'ps', sym: 'ˈ', name: 'Primary stress', grp: 'A', desc: 'Goes before the syllable that carries the main stress of a word. That syllable is usually louder, longer and higher in pitch.',
        parts: [['ˌfoʊnə', 0], ['ˈ', 1], ['tɪʃən', 0]], ex: ['English', 'phonetician', ''],
        segs: [Sg('foʊ', 1, [3]), Sg('nə', 0.7, [2]), Sg('tɪ', 1.1, [4.6, 4], 1), Sg('ʃən', 0.9, [2, 1.5])] },
      { id: 'ss', sym: 'ˌ', name: 'Secondary stress', grp: 'A', desc: 'Goes before a syllable that is stressed, but less strongly than the main one. Long words often have both.',
        parts: [['ˌ', 1], ['foʊnəˈtɪʃən', 0]], ex: ['English', 'phonetician', ''],
        segs: [Sg('foʊ', 1, [3], 1), Sg('nə', 0.7, [2]), Sg('tɪ', 1.1, [4.6, 4]), Sg('ʃən', 0.9, [2, 1.5])] },
      { id: 'lg', sym: 'ː', name: 'Long', grp: 'A', desc: 'Follows a sound that is held for roughly twice its usual duration. In many languages length alone changes the word.',
        parts: [['oba', 0], ['ː', 1], ['saɴ', 0]], ex: ['Japanese', 'おばあさん obāsan', 'grandmother (short: obasan, aunt)'],
        segs: [Sg('a', 1, [3], 0, 0.5), Sg('aː', 2, [3], 1)] },
      { id: 'hf', sym: 'ˑ', name: 'Half-long', grp: 'A', desc: 'Marks a sound that is held longer than a short one, but not as long as a fully long one.',
        parts: [['bi', 0], ['ˑ', 1], ['t', 0]], ex: ['English', 'beat', 'compare bead [biːd]'],
        segs: [Sg('a', 1, [3], 0, 0.4), Sg('aˑ', 1.5, [3], 1, 0.4), Sg('aː', 2, [3])] },
      { id: 'xs', sym: '◌̆', name: 'Extra-short', grp: 'A', desc: 'Sits above a sound that is clipped very short, often in an unstressed syllable.',
        parts: [['p', 0], ['ə̆', 1], ['ˈliːs', 0]], ex: ['English', 'police', ''],
        segs: [Sg('ă', 0.45, [3], 1, 0.5), Sg('a', 1, [3])] },
      { id: 'sb', sym: '.', name: 'Syllable break', grp: 'B', desc: 'Separates two syllables wherever the division would otherwise be unclear.',
        parts: [['ɹi', 0], ['.', 1], ['ækt', 0]], ex: ['English', 'react', ''],
        segs: [Sg('ɹi', 1, [3], 0, 0.12), Sg('ækt', 1.2, [4, 2.5])] },
      { id: 'mn', sym: '|', name: 'Minor (foot) group', grp: 'B', desc: 'Marks a small rhythmic boundary inside an utterance, often heard as a brief pause.',
        parts: [['ɪn ði ɛnd ', 0], ['|', 1], [' wi steɪd', 0]], ex: ['English', 'In the end, we stayed', ''],
        segs: [Sg('ɪn ði ɛnd', 1.8, [3, 3.6], 0, 0.4), Sg('wi steɪd', 1.6, [3.6, 1.5])] },
      { id: 'mj', sym: '‖', name: 'Major (intonation) group', grp: 'B', desc: 'Marks the end of a complete intonation phrase, usually with a clear pause and a pitch reset.',
        parts: [['wi steɪd ', 0], ['‖', 1], [' ðeɪ lɛft', 0]], ex: ['English', 'We stayed. They left.', ''],
        segs: [Sg('wi steɪd', 1.6, [3.8, 1.5], 0, 0.9), Sg('ðeɪ lɛft', 1.6, [3.8, 1.5])] },
      { id: 'lk', sym: '‿', name: 'Linking', grp: 'B', desc: 'Shows that two words run together with no break between them.',
        parts: [['lez', 0], ['‿', 1], ['ami', 0]], ex: ['French', 'les amis', 'the friends'],
        segs: [Sg('le', 1, [3]), Sg('za', 1, [3], 1), Sg('mi', 1, [3, 2.2])] },
      { id: 't5', sym: '˥', name: 'Extra high', grp: 'C', alt: 'e̋', desc: 'A level tone at the very top of the speaker’s pitch range.',
        parts: [['ma', 0], ['˥', 1]], ex: ['Mandarin', '妈 mā', 'mother'], segs: [Sg('ma', 2.4, [5], 1)] },
      { id: 't4', sym: '˦', name: 'High', grp: 'C', alt: 'é', desc: 'A level tone in the upper part of the pitch range.',
        parts: [['bɛ', 0], ['˦', 1]], ex: ['Yoruba', 'bẹ́', 'to jump'], segs: [Sg('bɛ', 2.4, [4], 1)] },
      { id: 't3', sym: '˧', name: 'Mid', grp: 'C', alt: 'ē', desc: 'A level tone in the middle of the pitch range.',
        parts: [['bɛ', 0], ['˧', 1]], ex: ['Yoruba', 'bẹ', 'to be forward'], segs: [Sg('bɛ', 2.4, [3], 1)] },
      { id: 't2', sym: '˨', name: 'Low', grp: 'C', alt: 'è', desc: 'A level tone in the lower part of the pitch range.',
        parts: [['bɛ', 0], ['˨', 1]], ex: ['Yoruba', 'bẹ̀', 'to ask pardon'], segs: [Sg('bɛ', 2.4, [2], 1)] },
      { id: 't1', sym: '˩', name: 'Extra low', grp: 'C', alt: 'ȅ', desc: 'A level tone at the very bottom of the speaker’s pitch range.',
        parts: [['a', 0], ['˩', 1]], ex: null, segs: [Sg('a', 2.4, [1], 1)] },
      { id: 'tr', sym: '˩˥', name: 'Rising', grp: 'D', alt: 'ě', desc: 'Pitch climbs from low to high within one syllable.',
        parts: [['maː', 0], ['˩˥', 1]], ex: ['Thai', 'หมา mǎa', 'dog'], segs: [Sg('maː', 2.4, [1, 5], 1)] },
      { id: 'tf', sym: '˥˩', name: 'Falling', grp: 'D', alt: 'ê', desc: 'Pitch drops from high to low within one syllable.',
        parts: [['ma', 0], ['˥˩', 1]], ex: ['Mandarin', '骂 mà', 'to scold'], segs: [Sg('ma', 2.4, [5, 1], 1)] },
      { id: 'thr', sym: '˧˥', name: 'High rising', grp: 'D', alt: 'e᷄', desc: 'Pitch starts in the middle and climbs to the top of the range.',
        parts: [['ma', 0], ['˧˥', 1]], ex: ['Mandarin', '麻 má', 'hemp'], segs: [Sg('ma', 2.4, [3, 5], 1)] },
      { id: 'tlr', sym: '˩˧', name: 'Low rising', grp: 'D', alt: 'e᷅', desc: 'Pitch starts at the bottom and climbs only to the middle of the range.',
        parts: [['si', 0], ['˩˧', 1]], ex: ['Cantonese', '市 si5', 'market'], segs: [Sg('si', 2.4, [1, 3], 1)] },
      { id: 'trf', sym: '˧˦˧', name: 'Rising–falling', grp: 'D', alt: 'e᷈', desc: 'Pitch rises and then falls again within one syllable.',
        parts: [['a', 0], ['˧˦˧', 1]], ex: null, segs: [Sg('a', 2.4, [3, 4, 3], 1)] },
      { id: 'tfr', sym: '˨˩˦', name: 'Falling–rising', grp: 'D', desc: 'Pitch dips and then climbs again within one syllable. Any contour can be written by joining tone letters.',
        parts: [['ma', 0], ['˨˩˦', 1]], ex: ['Mandarin', '马 mǎ', 'horse'], segs: [Sg('ma', 2.4, [2, 1, 4], 1)] },
      { id: 'ds', sym: 'ꜜ', name: 'Downstep', grp: 'E', desc: 'Lowers the pitch level of the tones that follow. A high tone after a downstep is lower than the high tone before it.',
        parts: [['úlɔ́ ', 0], ['ꜜ', 1], ['áɲí', 0]], ex: ['Igbo', 'ụ́lọ́ ꜜányị́', 'our house'],
        segs: [Sg('ú', 1, [4]), Sg('lɔ́', 1, [4]), Sg('á', 1, [3.1], 1), Sg('ɲí', 1, [3.1], 1)] },
      { id: 'us', sym: 'ꜛ', name: 'Upstep', grp: 'E', desc: 'Raises the pitch level of the tones that follow.',
        parts: [['á á ', 0], ['ꜛ', 1], ['á á', 0]], ex: null,
        segs: [Sg('á', 1, [3.1]), Sg('á', 1, [3.1]), Sg('á', 1, [4], 1), Sg('á', 1, [4], 1)] },
      { id: 'gr', sym: '↗', name: 'Global rise', grp: 'E', desc: 'Pitch drifts upward across the whole phrase, as in many yes–no questions.',
        parts: [['↗', 1], ['jɔː ˈkʌmɪŋ', 0]], ex: ['English', 'You’re coming?', ''],
        segs: [Sg('jɔː', 1, [2, 2.4], 1), Sg('kʌ', 1, [2.8, 3.4], 1), Sg('mɪŋ', 1.1, [3.6, 5], 1)] },
      { id: 'gf', sym: '↘', name: 'Global fall', grp: 'E', desc: 'Pitch drifts downward across the whole phrase, as in most plain statements.',
        parts: [['↘', 1], ['jɔː ˈkʌmɪŋ', 0]], ex: ['English', 'You’re coming.', ''],
        segs: [Sg('jɔː', 1, [4.2, 3.8], 1), Sg('kʌ', 1, [3.6, 2.8], 1), Sg('mɪŋ', 1.1, [2.4, 1], 1)] }
    ]
  };
})(window.SIPA = window.SIPA || {});
