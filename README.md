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

## Today's Lesson (Mr. Wordy)

The home screen's main button starts a guided daily lesson. Mr. Wordy (`js/wordy.js`), a talking index card, introduces each stop:

1. **Warm-up**: Find It with words the child has already seen (skipped on the very first lesson)
2. **New cards**: meet 3–5 new words one at a time (see it, hear it, say it)
3. **Practice**: Build It with the new words (Find It for letters)
4. **Wiggle break**: an off-screen movement prompt using a new word
5. **Game time**: one or two rounds mixing new words, words in progress, and review; the game rotates daily
6. **Paper time**: write the new words on paper
7. **All done**: new words, stars, level-ups, and stickers

Grown-ups set the length (about 10, 20, or 30 minutes; `LESSON_PLANS` in `js/app.js`). Shorter lessons skip the wiggle break and paper time and use smaller rounds. Lessons teach the "Up next" list at the child's level, so they rotate through that level's lists. Each finished lesson is logged per child (date, length, list, new words, stars) for future homeschool records.

## Games

- **Flash Cards**: the child reads the word and a grown-up taps *Got it!* or *Practice again*. Missed words come back at the end of the round. Tap the word to hear it.
- **Build It!**: the child taps letter tiles to build the word (phonics words use sound tiles like `sh`). Wrong letters wiggle back to the tray and correct ones stay. A grown-up setting hides the word for a spelling challenge, with a Peek button.
- **Find It!**: the app says a word and the child taps the matching card, so they can play alone. Sound-alike words (to/two) are never shown together.
- **Blend it** (phonics lists): letter tiles slide together to show blending.
- **Read it to me** (Chrome, Edge and Safari): the child reads into the microphone. The button is hidden where it isn't supported.

## Word lists

- Sight words: Dolch by grade (Pre-K 40, K 52, 1st 41, 2nd 46, 3rd 41), plus Fry 1–100 and 101–200.
- Phonics: ABCs, short-vowel CVC words, L-, R- and S-blends, 3-letter blends, ending blends, and digraphs (sh, ch, th, wh, ck, ph).
- My Words: added by grown-ups in the app.

In phonics lists, `[brackets]` mark the part to highlight, e.g. `"[bl]ue"`.

## Levels

Lists are grouped into 5 levels (`SITEWORDY_STAGES` in `js/words.js`, with each list's `stage`):

| Level | Ages | Lists |
| --- | --- | --- |
| 1 Little Readers | 3–4 | Pre-K, ABCs, Short Vowels |
| 2 Kindergarten | 5 | Kindergarten, Fry 1–100, Digraphs |
| 3 1st Grade | 6 | 1st Grade, L-, R-, S & W-Blends |
| 4 2nd Grade | 7 | 2nd Grade, 3-Letter Blends, Ending Blends |
| 5 3rd Grade | 8+ | 3rd Grade, Fry 101–200 |

A child's age sets their starting level. Learning 80% of a level's words unlocks the next one, with a "Level up!" celebration. Grown-ups can unlock everything in settings. Games get harder by level (`DIFFICULTY` in `js/app.js`):

| Level | Find It choices | Build It extra letters | Build It word hidden (spelling) | Default round |
| --- | --- | --- | --- | --- |
| 1 | 2 | 0 | no | 5 words |
| 2 | 3 | 1 | no | 10 |
| 3 | 4, look-alike words | 2 | no | 10 |
| 4 | 4, look-alike words | 2 | yes | 10 |
| 5 | 4, look-alike words | 3 | yes | 10 |

Within a list, words the child is working on come first, then new words from shortest to longest, then review. My Words plays at the child's current level.

## Readers (profiles)

Each child has their own age, buddy avatar, stars, sticker book, My Words list, progress, and settings. With more than one reader, the app opens on "Who's reading today?". Grown-ups add, rename, or remove readers in the Grown-ups Corner.

## Progress

Progress is saved in the browser (`localStorage`, key `sitewordy:v3`), so it stays on that device. Data from earlier versions moves into a reader named "Reader" automatically. A word counts as learned after 3 correct answers, and words not yet learned are picked first. Each correct answer earns a star, and every 20 stars unlocks a sticker.

## Running locally

Any static server works, e.g. `python3 -m http.server`, then open http://localhost:8000. The microphone feature needs `https://` or `localhost`.
