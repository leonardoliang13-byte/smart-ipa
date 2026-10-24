# SmartIPA

A web app for learning the International Phonetic Alphabet.

SmartIPA is a neutral reference and practice tool. It has no accounts, keeps no scores or progress, and suggests no learning path.

- **Sounds**: the consonant and vowel charts on the left, the lesson for the chosen sound on the right. The lesson has the recording (played at 0.5×, 0.75× or 1×, optionally looping), the phonetic name, a vocal-tract diagram that can play the movement from rest into the sound and back, an example word and similar sounds. The URL records the whole combination, e.g. `#/sounds/a?d=nas&p=tf` is a nasalized [a] with a falling tone.
- **Modify tray**: inside the lesson, a Diacritics and a Prosody tab add marks to the chosen sound. The 31 diacritics are arranged in families (voicing, phonation, contact point, release and so on). A mark that cannot work, such as aspiration on [b], nasalization on [t] or Advanced together with Retracted, is listed under "Not available" with the reason. 227 combinations have their own recordings from Wikimedia Commons (for example [n̥], [pʰ], [ɔ̃], [kʷ], [sˤ]); they are marked with a dot and played instead of the plain sound.
- **Search** (Ctrl K or /): find a sound by symbol, X-SAMPA (`S`, `N`, `@`), English spelling (`sh`, `th`, `ng`), example word, or description (`voiced velar`). Phrases like `aspirated t` or `voiceless n` open the combination. Any text can be sent to Transcribe.
- **Practice**: four drills: hear a sound and pick its symbol, name a symbol, read the vocal-tract diagram, and transcribe English words in the class conventions with an on-screen IPA keyboard. Questions are random and nothing about the answers is saved.
- **Transcribe**: type English and get an IPA transcription (General American) in the class conventions of "IPA for English" (rev. 2025-01-08): /aj/ buy, /ɔj/ boy, /aw/ how, /ej/ date, /ow/ hope, /ɑ/ dog, /ɔ/ only before r, /ɹ/ for r, /ə ɚ/ unstressed and /ʌ ɝ/ stressed. An option adds aspiration (pʰ tʰ kʰ) and flaps (ɾ). Every symbol in the result links to its sound.

It is a plain static site: HTML, CSS and JavaScript with no build step and no server code.

## Run it locally

Browsers block some features on `file://` pages, so serve the folder over HTTP. This machine has no Node or Python, so a small PowerShell server is included:

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:8765/. Self-tests are at http://localhost:8765/tests.html.

## Host it

Upload the whole folder to any static host. `index.html` is the entry page and all links are relative, so it also works from a sub-path.

- **GitHub Pages**: put the folder in a repository, then Settings → Pages → Deploy from a branch → `main` / root.
- **Netlify**: drag the folder onto https://app.netlify.com/drop.
- **Cloudflare Pages, Vercel or any web server**: deploy the folder as static files with no build command.

`serve.ps1`, `tests.html`, `audio-sources.md`, `.claude/` and `data/cmudict/cmudict.dict` are not needed by the live site. Keep `data/cmudict/LICENSE`, which the Credits page links to.

## What it loads from the internet

- **Recordings** stream from Wikimedia Commons (MP3 versions, falling back to the original Ogg/WAV). All 121 were checked to load.
- **The Charis SIL font** comes from Google Fonts. Without it, IPA falls back to system fonts.
- **Example words and the Transcribe "speak" button** use the device's built-in text-to-speech voice, so they vary by device and only appear when a suitable voice exists.

Prosody playback is synthesized in the browser.

## Files

| Path | Purpose |
|---|---|
| `index.html`, `css/app.css` | Page shell and styles (light and dark) |
| `js/app.js`, `js/core.js` | Router (`#/sounds/p?d=asp&p=ps`, `#/transcribe`, `#/credits`) and shared helpers |
| `js/data/sounds.js` | Chart symbols, names, example words and recording sources |
| `js/data/marks.js` | Diacritics (with their compatibility rules) and suprasegmentals |
| `js/data/dia-audio.js` | Recordings of diacritic combinations (generated from Wikimedia data) |
| `js/tract.js` | Vocal-tract line drawing |
| `js/audio.js` | Recordings, synthesized pitch and device speech |
| `js/views/sounds.js` | The chart and the lesson panel, including the modify tray and playback controls |
| `js/views/practice.js` | Practice drills |
| `js/palette.js` | Search palette (Ctrl K): symbols, X-SAMPA, English spellings and diacritic phrases |
| `js/views/transcribe.js`, `js/views/credits.js` | Transcribe tab and Credits page |
| `src/english-to-ipa.js` | English to IPA function (`SmartIPA.transcribe(text)`) |
| `data/cmudict.js` | CMU Pronouncing Dictionary as a script (about 3.6 MB, loaded only when Transcribe opens) |

To regenerate `data/cmudict.js` after updating `data/cmudict/cmudict.dict`, run in PowerShell from this folder:

```
$raw = [IO.File]::ReadAllText((Resolve-Path "data\cmudict\cmudict.dict"), [Text.Encoding]::UTF8); [IO.File]::WriteAllText((Join-Path (Get-Location) "data\cmudict.js"), "(typeof window !== 'undefined' ? window : globalThis).SMARTIPA_CMUDICT_RAW = String.raw``" + $raw + "``;`n", (New-Object Text.UTF8Encoding($false)))
```

## Licences

See the Credits page in the app. In short: recordings are from Wikimedia Commons under their own licences (mostly CC BY-SA); the vocal-tract drawing in `js/tract.js` is adapted from Wikimedia Commons' "Places of articulation.svg" (CC BY-SA 3.0) and stays under that licence; the CMU Pronouncing Dictionary is under a BSD-style licence (`data/cmudict/LICENSE`); Charis SIL is under the SIL Open Font License.
