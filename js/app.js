(() => {
    const STORE_KEY = 'sitewordy:v2';
    const MASTERED_AT = 3;          // correct answers before a word counts as learned
    const STARS_PER_STICKER = 20;
    const STICKERS = [
        '🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🐙', '🦄', '🐢', '🦖',
        '🐝', '🦋', '🐬', '🦉', '🐧', '🦒', '🐘', '🦜', '🐞', '🐳',
        '🌈', '🚀', '🎈', '🍦', '🍩', '⚽', '🎸', '👑', '💎', '🏆'
    ];
    const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Super reading!', 'Way to go!', 'Fantastic!', 'Nice work!'];
    const CHOICES_PER_QUESTION = 3;

    const $ = (id) => document.getElementById(id);

    // ================= Saved state =================
    const defaults = {
        settings: { sound: true, rate: 0.85, timer: 0, theme: 'sky', roundSize: 10 },
        progress: {},       // { listId: { word: { c: correctCount, m: missCount } } }
        stars: 0,
        customWords: []
    };

    function load() {
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (e) { /* storage blocked */ }
        const state = { ...defaults, ...saved, settings: { ...defaults.settings, ...(saved.settings || {}) } };
        // Bring over custom words from the original version of the game.
        if (!saved.customWords) {
            try {
                const old = JSON.parse(localStorage.getItem('customWords'));
                if (Array.isArray(old)) state.customWords = old.filter(w => typeof w === 'string' && w.trim());
            } catch (e) { /* nothing to migrate */ }
        }
        return state;
    }

    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
    }

    const state = load();

    // ================= Word lists =================
    function allLists() {
        const custom = {
            id: 'custom', group: 'sight', emoji: '💖', color: '#f06292',
            title: 'My Words', subtitle: 'Words you added',
            items: state.customWords
        };
        return [...window.SITEWORDY_LISTS, custom];
    }

    function findList(id) {
        return allLists().find(l => l.id === id);
    }

    // "[bl]ue" -> { key: "[bl]ue", text: "blue", focus: [0, 2] }
    function parseItem(raw, list) {
        const open = raw.indexOf('[');
        const close = raw.indexOf(']');
        const text = raw.replace(/[[\]]/g, '');
        const focus = open >= 0 && close > open ? [open, close - 1] : null;
        return { key: raw, text, focus, letter: !!list.letters, blendable: !!list.blendable };
    }

    // Sound units for the "Blend it" animation: digraphs and vowel teams stay together.
    const UNITS = /(tch|igh|ch|sh|th|wh|ck|ph|ng|nk|qu|ss|ll|ff|zz|ee|ea|ai|ay|oa|oo|ou|ow|ue|ar|er|ir|or|ur|.)/g;

    function renderWord(el, item) {
        el.textContent = '';
        if (item.letter) {
            el.append(item.text);
            const lower = document.createElement('span');
            lower.className = 'lower';
            lower.textContent = item.text.toLowerCase();
            el.append(lower);
            return;
        }
        if (!item.focus) { el.textContent = item.text; return; }
        const [start, end] = item.focus;
        const mark = document.createElement('mark');
        mark.textContent = item.text.slice(start, end);
        el.append(item.text.slice(0, start), mark, item.text.slice(end));
    }

    function renderTiles(el, item) {
        el.textContent = '';
        let pos = 0;
        for (const unit of item.text.match(UNITS)) {
            const tile = document.createElement('span');
            tile.className = 'tile';
            if (item.focus && pos >= item.focus[0] && pos < item.focus[1]) tile.classList.add('focus');
            tile.textContent = unit;
            el.append(tile);
            pos += unit.length;
        }
    }

    function spoken(item) {
        return item.text;
    }

    function wordStats(listId, key) {
        return state.progress[listId]?.[key] || { c: 0, m: 0 };
    }

    function isLearned(listId, key) {
        return wordStats(listId, key).c >= MASTERED_AT;
    }

    function learnedCount(list) {
        return list.items.filter(k => isLearned(list.id, k)).length;
    }

    function record(listId, key, correct) {
        const listProgress = state.progress[listId] || (state.progress[listId] = {});
        const stats = listProgress[key] || (listProgress[key] = { c: 0, m: 0 });
        if (correct) stats.c++; else stats.m++;
        save();
    }

    function shuffle(array) {
        const a = array.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ================= Screens =================
    function show(screenId) {
        for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== screenId;
        window.scrollTo(0, 0);
    }

    function renderHome() {
        $('star-total').textContent = state.stars;
        const grids = { sight: $('sight-lists'), phonics: $('phonics-lists') };
        grids.sight.textContent = '';
        grids.phonics.textContent = '';

        for (const list of allLists()) {
            const tile = document.createElement('button');
            tile.type = 'button';
            tile.className = 'list-tile';
            tile.style.setProperty('--tile', list.color);

            const total = list.items.length;
            const learned = learnedCount(list);
            const pct = total ? Math.round((learned / total) * 100) : 0;
            const countLabel = list.id === 'custom' && !total
                ? 'Add words in Grown-ups'
                : `${learned} of ${total} learned`;

            tile.innerHTML = `
                <span class="tile-emoji" aria-hidden="true"></span>
                <span class="tile-title"></span>
                <span class="tile-sub"></span>
                <span class="tile-meter" aria-hidden="true"><span style="width:${pct}%"></span></span>
                <span class="tile-count"></span>`;
            tile.querySelector('.tile-emoji').textContent = list.emoji;
            tile.querySelector('.tile-title').textContent = list.title;
            tile.querySelector('.tile-sub').textContent = list.subtitle;
            tile.querySelector('.tile-count').textContent = pct === 100 ? '🏆 All learned!' : countLabel;
            tile.addEventListener('click', () => chooseList(list.id));
            grids[list.group].append(tile);
        }
    }

    // ================= Choosing a game =================
    let pending = null;

    function chooseList(listId) {
        const list = findList(listId);
        if (!list.items.length) {
            openGrownups();
            $('custom-word').focus();
            return;
        }
        pending = listId;
        $('mode-eyebrow').textContent = `${list.emoji} ${list.title}`;
        const size = String(state.settings.roundSize);
        for (const radio of document.querySelectorAll('input[name="round-size"]')) radio.checked = radio.value === size;
        const dialog = $('mode-dialog');
        dialog.returnValue = '';
        dialog.showModal();
    }

    $('mode-dialog').addEventListener('close', () => {
        const mode = $('mode-dialog').returnValue;
        if (mode !== 'flash' && mode !== 'find') return;
        const size = Number(document.querySelector('input[name="round-size"]:checked').value);
        state.settings.roundSize = size;
        save();
        startRound(pending, mode, size);
    });

    // ================= A round of practice =================
    let round = null;

    function pickWords(list, size) {
        // Words not yet learned come first so practice time goes where it's needed.
        const learning = shuffle(list.items.filter(k => !isLearned(list.id, k)));
        const learned = shuffle(list.items.filter(k => isLearned(list.id, k)));
        const picked = [...learning, ...learned].slice(0, size || list.items.length);
        return shuffle(picked);
    }

    function startRound(listId, mode, size, onlyKeys) {
        const list = findList(listId);
        const keys = onlyKeys ? shuffle(onlyKeys) : pickWords(list, size);
        round = {
            list, mode, size,
            queue: keys.map(k => parseItem(k, list)),
            index: 0,
            starsBefore: state.stars,
            stars: 0,
            firstTryRight: new Set(),
            missed: new Set(),
            retried: new Set()
        };
        $('round-stars').textContent = '0';
        $('flash-view').hidden = mode !== 'flash';
        $('find-view').hidden = mode !== 'find';
        show('screen-play');
        showCurrent();
    }

    function current() {
        return round.queue[round.index];
    }

    function updateProgressBar() {
        const pct = (round.index / round.queue.length) * 100;
        $('round-progress').style.width = `${pct}%`;
    }

    function showCurrent() {
        updateProgressBar();
        if (round.index >= round.queue.length) { finishRound(); return; }
        if (round.mode === 'flash') showFlash(); else showFind();
    }

    function markRight(item) {
        if (!round.missed.has(item.key)) round.firstTryRight.add(item.key);
        round.stars++;
        state.stars++;
        record(round.list.id, item.key, true);
        $('round-stars').textContent = round.stars;
        playSound('correct-sound');
    }

    function markMissed(item) {
        if (round.missed.has(item.key)) return;
        round.missed.add(item.key);
        record(round.list.id, item.key, false);
    }

    // Missed words come back once at the end of the round for another try.
    function requeue(item) {
        if (round.retried.has(item.key)) return;
        round.retried.add(item.key);
        round.queue.push(item);
    }

    function next(delay = 0) {
        clearTimer();
        stopListening();
        setTimeout(() => {
            if (!round) return;
            round.index++;
            showCurrent();
        }, delay);
    }

    // ---------- Flash cards ----------
    function showFlash() {
        const item = current();
        const card = $('flash-word');
        renderWord($('flash-text'), item);
        $('flash-text').hidden = false;
        $('flash-tiles').hidden = true;
        $('flash-feedback').textContent = '';
        card.classList.toggle('is-letter', item.letter);
        card.classList.remove('pop', 'nudge', 'enter');
        void card.offsetWidth; // restart the entrance animation
        card.classList.add('enter');
        $('blend-btn').hidden = !item.blendable;
        $('mic-btn').hidden = !Speech.canListen || item.letter;
        setAnswerButtons(true);
        startTimer();
    }

    function setAnswerButtons(enabled) {
        $('gotit-btn').disabled = !enabled;
        $('again-btn').disabled = !enabled;
    }

    function flashGotIt() {
        if (!round || round.mode !== 'flash' || $('gotit-btn').disabled) return;
        const item = current();
        setAnswerButtons(false);
        markRight(item);
        $('flash-feedback').textContent = randomPraise();
        $('flash-word').classList.add('pop');
        next(700);
    }

    function flashAgain() {
        if (!round || round.mode !== 'flash' || $('again-btn').disabled) return;
        const item = current();
        setAnswerButtons(false);
        markMissed(item);
        requeue(item);
        Speech.say(spoken(item));
        $('flash-feedback').textContent = `That word is “${item.text}”. We'll see it again soon!`;
        next(1600);
    }

    function blendIt() {
        const item = current();
        const tiles = $('flash-tiles');
        renderTiles(tiles, item);
        $('flash-text').hidden = true;
        tiles.hidden = false;
        tiles.classList.remove('joined');
        setTimeout(() => tiles.classList.add('joined'), 900);
        setTimeout(() => Speech.say(spoken(item), { slow: true }), 1300);
    }

    $('flash-word').addEventListener('click', () => Speech.say(spoken(current())));
    $('hear-btn').addEventListener('click', () => Speech.say(spoken(current())));
    $('blend-btn').addEventListener('click', blendIt);
    $('gotit-btn').addEventListener('click', flashGotIt);
    $('again-btn').addEventListener('click', flashAgain);

    // ---------- Reading out loud (microphone) ----------
    let stopRecognition = null;

    function stopListening() {
        if (stopRecognition) stopRecognition();
        stopRecognition = null;
        $('mic-btn').classList.remove('listening');
        $('mic-btn').querySelector('.mic-label').textContent = 'Read it to me';
    }

    $('mic-btn').addEventListener('click', () => {
        if (stopRecognition) { stopListening(); return; }
        const item = current();
        clearTimer();
        const mic = $('mic-btn');
        mic.classList.add('listening');
        mic.querySelector('.mic-label').textContent = 'Listening…';
        $('flash-feedback').textContent = 'I’m listening. Read the word!';
        stopRecognition = Speech.listenFor(item.text, (result) => {
            stopRecognition = null;
            stopListening();
            if (!round || current() !== item) return;
            if (result === 'match') {
                flashGotIt();
            } else if (result === 'nomatch') {
                $('flash-feedback').textContent = 'Almost! Listen, then try again.';
                $('flash-word').classList.remove('nudge');
                void $('flash-word').offsetWidth;
                $('flash-word').classList.add('nudge');
                Speech.say(spoken(item));
            } else {
                $('flash-feedback').textContent = 'The microphone isn’t working. A grown-up can tap Got it! instead.';
            }
        });
    });

    // ---------- Timer (optional) ----------
    let timerId = null;

    function startTimer() {
        clearTimer();
        const seconds = Number(state.settings.timer);
        const track = $('timer-track');
        track.hidden = !seconds;
        if (!seconds) return;
        const fill = $('timer-fill');
        fill.style.transition = 'none';
        fill.style.width = '100%';
        void fill.offsetWidth;
        fill.style.transition = `width ${seconds}s linear`;
        fill.style.width = '0%';
        timerId = setTimeout(() => {
            timerId = null;
            flashAgain();
        }, seconds * 1000);
    }

    function clearTimer() {
        if (timerId) clearTimeout(timerId);
        timerId = null;
        const fill = $('timer-fill');
        fill.style.transition = 'none';
        fill.style.width = getComputedStyle(fill).width;
    }

    // ---------- Find it ----------
    function pickChoices(item) {
        const list = round.list;
        let pool = list.items.map(k => parseItem(k, list));
        if (pool.length < CHOICES_PER_QUESTION + 2) {
            const starter = findList('dolch-prek');
            pool = pool.concat(starter.items.map(k => parseItem(k, starter)));
        }
        const others = shuffle(pool).filter((other, i, arr) =>
            other.text.toLowerCase() !== item.text.toLowerCase() &&
            !Speech.soundsAlike(other.text, item.text) &&
            arr.findIndex(o => o.text.toLowerCase() === other.text.toLowerCase()) === i
        );
        return shuffle([item, ...others.slice(0, CHOICES_PER_QUESTION - 1)]);
    }

    function findPrompt(item) {
        return item.letter ? `Find the letter ${item.text}` : `Find the word: ${item.text}`;
    }

    function showFind() {
        const item = current();
        const box = $('find-choices');
        box.textContent = '';
        $('find-feedback').textContent = '';
        $('find-label').textContent = item.letter ? 'Find the letter you hear!' : 'Find the word you hear!';

        for (const choice of pickChoices(item)) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'choice';
            if (choice.letter) btn.classList.add('is-letter');
            const text = document.createElement('span');
            renderWord(text, choice);
            btn.append(text);
            btn.addEventListener('click', () => answerFind(btn, choice, item));
            box.append(btn);
        }
        setTimeout(() => Speech.say(findPrompt(item)), 300);
    }

    function answerFind(btn, choice, item) {
        if (!round || current() !== item || btn.disabled) return;
        if (choice === item) {
            for (const b of $('find-choices').children) b.disabled = true;
            btn.classList.add('right');
            markRight(item);
            $('find-feedback').textContent = randomPraise();
            if (round.firstTryRight.has(item.key)) burstConfetti(18);
            next(1100);
        } else {
            btn.disabled = true;
            btn.classList.add('wrong');
            markMissed(item);
            playSound('incorrect-sound');
            $('find-feedback').textContent = `That says “${choice.text}”. Try again!`;
            setTimeout(() => Speech.say(item.letter ? `Find ${item.text}` : item.text), 600);
        }
    }

    $('find-speak').addEventListener('click', () => Speech.say(findPrompt(current())));

    // ---------- End of round ----------
    function finishRound() {
        clearTimer();
        const unique = new Set(round.queue.map(i => i.key));
        const right = round.firstTryRight.size;
        const ratio = right / unique.size;
        const earned = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;

        $('done-stars').innerHTML = [1, 2, 3]
            .map(n => `<span class="${n <= earned ? 'on' : ''}" style="--i:${n}">★</span>`).join('');
        $('done-title').textContent = earned === 3 ? 'Amazing reading!' : earned === 2 ? 'Great job!' : 'Good practice!';
        const noun = round.list.letters ? 'letters' : 'words';
        $('done-summary').textContent = `You got ${right} of ${unique.size} ${noun} on the first try and earned ${round.stars} ⭐`;

        // New sticker?
        const before = Math.floor(round.starsBefore / STARS_PER_STICKER);
        const after = Math.floor(state.stars / STARS_PER_STICKER);
        const sticker = $('new-sticker');
        sticker.hidden = after <= before || before >= STICKERS.length;
        if (!sticker.hidden) {
            sticker.innerHTML = `<span class="sticker-big"></span><span>New sticker for your sticker book!</span>`;
            sticker.querySelector('.sticker-big').textContent = STICKERS[Math.min(after, STICKERS.length) - 1];
        }

        const missed = [...round.missed];
        $('practice-wrap').hidden = !missed.length;
        $('practice-missed-btn').hidden = !missed.length;
        const chips = $('practice-words');
        chips.textContent = '';
        for (const key of missed) {
            const item = parseItem(key, round.list);
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'word-chip';
            renderWord(chip, item);
            chip.setAttribute('aria-label', `Hear ${item.text}`);
            chip.addEventListener('click', () => Speech.say(spoken(item)));
            chips.append(chip);
        }

        show('screen-done');
        playSound('correct-sound');
        burstConfetti(70);
    }

    $('play-again-btn').addEventListener('click', () => startRound(round.list.id, round.mode, round.size));
    $('practice-missed-btn').addEventListener('click', () => startRound(round.list.id, round.mode, 0, [...round.missed]));
    $('new-list-btn').addEventListener('click', goHome);
    $('exit-play').addEventListener('click', goHome);

    function goHome() {
        clearTimer();
        stopListening();
        window.speechSynthesis?.cancel();
        round = null;
        renderHome();
        show('screen-home');
    }

    // Keyboard shortcuts for grown-ups at a computer: → got it, ← practice again, space to hear.
    document.addEventListener('keydown', (event) => {
        if (!round || $('screen-play').hidden || document.querySelector('dialog[open]')) return;
        if (round.mode !== 'flash') return;
        if (event.key === 'ArrowRight') flashGotIt();
        else if (event.key === 'ArrowLeft') flashAgain();
    });

    // ================= Feedback helpers =================
    function randomPraise() {
        return PRAISE[Math.floor(Math.random() * PRAISE.length)] + ' 🎉';
    }

    function playSound(id) {
        if (!state.settings.sound) return;
        const audio = $(id);
        audio.currentTime = 0;
        audio.play().catch(() => { /* autoplay blocked, ignore */ });
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const CONFETTI_COLORS = ['#ff6f61', '#ffca28', '#42a5f5', '#66bb6a', '#ab47bc', '#ff8a65'];

    function burstConfetti(count) {
        if (reducedMotion.matches) return;
        const layer = $('confetti');
        for (let i = 0; i < count; i++) {
            const piece = document.createElement('span');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
            piece.style.animationDelay = `${Math.random() * 0.4}s`;
            piece.style.animationDuration = `${1.6 + Math.random() * 1.2}s`;
            piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 200}px`);
            piece.style.setProperty('--spin', `${Math.random() * 720 - 360}deg`);
            layer.append(piece);
            setTimeout(() => piece.remove(), 3200);
        }
    }

    function toast(message) {
        const el = $('toast');
        el.textContent = message;
        el.classList.add('show');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => el.classList.remove('show'), 2200);
    }

    // ================= Sticker book =================
    $('open-stickers').addEventListener('click', () => {
        const unlocked = Math.min(Math.floor(state.stars / STARS_PER_STICKER), STICKERS.length);
        const grid = $('sticker-grid');
        grid.textContent = '';
        STICKERS.forEach((emoji, i) => {
            const cell = document.createElement('span');
            cell.className = 'sticker' + (i < unlocked ? '' : ' locked');
            cell.textContent = i < unlocked ? emoji : '?';
            grid.append(cell);
        });
        const toNext = STARS_PER_STICKER - (state.stars % STARS_PER_STICKER);
        $('sticker-next').textContent = unlocked >= STICKERS.length
            ? 'You collected every sticker! 🏆'
            : `${toNext} more ⭐ until your next sticker!`;
        $('sticker-dialog').showModal();
    });

    // ================= Grown-ups corner =================
    function applySettings() {
        document.documentElement.dataset.theme = state.settings.theme;
        Speech.setRate(Number(state.settings.rate));
    }

    function openGrownups() {
        $('set-sound').checked = state.settings.sound;
        $('set-rate').value = String(state.settings.rate);
        $('set-timer').value = String(state.settings.timer);
        $('set-theme').value = state.settings.theme;
        renderCustomWords();
        renderProgressTable();
        $('grownups-dialog').showModal();
    }

    $('open-grownups').addEventListener('click', openGrownups);
    $('grownups-dialog').addEventListener('close', renderHome);

    $('set-sound').addEventListener('change', (e) => { state.settings.sound = e.target.checked; save(); });
    $('set-rate').addEventListener('change', (e) => {
        state.settings.rate = Number(e.target.value); save(); applySettings();
        Speech.say('Hello! Let’s read.');
    });
    $('set-timer').addEventListener('change', (e) => { state.settings.timer = Number(e.target.value); save(); });
    $('set-theme').addEventListener('change', (e) => { state.settings.theme = e.target.value; save(); applySettings(); });

    $('add-word-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const input = $('custom-word');
        const word = input.value.replace(/[[\]<>]/g, '').trim();
        if (!word) return;
        if (state.customWords.some(w => w.toLowerCase() === word.toLowerCase())) {
            toast(`“${word}” is already in My Words`);
        } else {
            state.customWords.push(word);
            save();
            renderCustomWords();
            renderProgressTable();
        }
        input.value = '';
        input.focus();
    });

    function renderCustomWords() {
        const box = $('custom-words');
        box.textContent = '';
        if (!state.customWords.length) {
            box.innerHTML = '<p class="muted">No words yet.</p>';
            return;
        }
        state.customWords.forEach((word) => {
            const chip = document.createElement('span');
            chip.className = 'word-chip';
            chip.textContent = word;
            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'chip-remove';
            remove.setAttribute('aria-label', `Remove ${word}`);
            remove.textContent = '✕';
            remove.addEventListener('click', () => {
                state.customWords = state.customWords.filter(w => w !== word);
                if (state.progress.custom) delete state.progress.custom[word];
                save();
                renderCustomWords();
                renderProgressTable();
            });
            chip.append(remove);
            box.append(chip);
        });
    }

    function renderProgressTable() {
        const table = $('progress-table');
        table.textContent = '';
        for (const list of allLists()) {
            if (!list.items.length) continue;
            const learned = learnedCount(list);
            const row = document.createElement('div');
            row.className = 'progress-row';
            row.innerHTML = `
                <span class="pr-name"></span>
                <span class="tile-meter" aria-hidden="true"><span style="width:${(learned / list.items.length) * 100}%; background:${list.color}"></span></span>
                <span class="pr-count">${learned}/${list.items.length}</span>`;
            row.querySelector('.pr-name').textContent = `${list.emoji} ${list.title}`;

            // Tricky words: missed more often than gotten right.
            const tricky = list.items
                .filter(k => { const s = wordStats(list.id, k); return s.m > 0 && s.c < MASTERED_AT; })
                .map(k => parseItem(k, list).text);
            if (tricky.length) {
                const note = document.createElement('span');
                note.className = 'pr-tricky';
                note.textContent = `Working on: ${tricky.slice(0, 8).join(', ')}${tricky.length > 8 ? '…' : ''}`;
                row.append(note);
            }
            table.append(row);
        }
    }

    $('reset-progress').addEventListener('click', () => {
        if (!confirm('Reset all progress and stars? This can’t be undone. (Your custom words are kept.)')) return;
        state.progress = {};
        state.stars = 0;
        save();
        renderProgressTable();
        toast('Progress reset');
    });

    // ================= Start =================
    applySettings();
    renderHome();
    show('screen-home');
})();
