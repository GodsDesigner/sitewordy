# Sitewordy

Sight word and phonics practice for kids ages 3–8. Plain HTML, CSS, and JavaScript: no build step and no server code. Open `index.html` or host the folder anywhere (GitHub Pages, Netlify, etc.).

## What's inside

| File | What it does |
| --- | --- |
| `index.html` | Landing page (for parents and teachers) |
| `game.html` | The app: pick a list, play, finish screen, and the dialogs |
| `js/words.js` | **All word lists.** Edit this file to change words |
| `js/speech.js` | Read-aloud voice and microphone listening |
| `js/app.js` | Game logic, progress, stars and stickers, settings |
| `styles.css` | Styles for both pages, including the Sky, Sunny and Night themes |

## Games

- **Flash Cards**: the child reads the word and a grown-up taps *Got it!* or *Practice again*. Missed words come back at the end of the round. Tap the word to hear it.
- **Find It!**: the app says a word and the child taps the matching card, so they can play alone. Sound-alike words (to/two) are never shown together.
- **Blend it** (phonics lists): letter tiles slide together to show blending.
- **Read it to me** (Chrome, Edge and Safari): the child reads into the microphone. The button is hidden where it isn't supported.

## Word lists

- Sight words: Dolch by grade (Pre-K 40, K 52, 1st 41, 2nd 46, 3rd 41), plus Fry 1–100 and 101–200.
- Phonics: ABCs, short-vowel CVC words, L-, R- and S-blends, 3-letter blends, ending blends, and digraphs (sh, ch, th, wh, ck, ph).
- My Words: added by grown-ups in the app.

In phonics lists, `[brackets]` mark the part to highlight, e.g. `"[bl]ue"`.

## Progress

Progress is saved in the browser (`localStorage`). A word counts as learned after 3 correct answers, and words not yet learned are picked first. Each correct answer earns a star, and every 20 stars unlocks a sticker.

## Running locally

Any static server works, e.g. `python3 -m http.server`, then open http://localhost:8000. The microphone feature needs `https://` or `localhost`.
