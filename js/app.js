(() => {
    const STORE_KEY = 'sitewordy:v3';
    const MASTERED_AT = 3;          // correct answers before a word counts as learned
    const STARS_PER_STICKER = 20;
    const STICKERS = [
        '🐶', '🐱', '🦊', '🐼', '🦁', '🐸', '🐙', '🦄', '🐢', '🦖',
        '🐝', '🦋', '🐬', '🦉', '🐧', '🦒', '🐘', '🦜', '🐞', '🐳',
        '🌈', '🚀', '🎈', '🍦', '🍩', '⚽', '🎸', '👑', '💎', '🏆'
    ];
    const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Super reading!', 'Way to go!', 'Fantastic!', 'Nice work!'];
    const STAGES = window.SITEWORDY_STAGES;
    const UNLOCK_AT = 0.8;          // share of a level's words learned to unlock the next level
    // How the games play at each level: more choices, more extra letters,
    // look-alike words, and spelling from listening as kids grow.
    const DIFFICULTY = {
        1: { choices: 2, extras: 0, lookAlikes: false, spell: false, size: 5 },
        2: { choices: 3, extras: 1, lookAlikes: false, spell: false, size: 10 },
        3: { choices: 4, extras: 2, lookAlikes: true, spell: false, size: 10 },
        4: { choices: 4, extras: 2, lookAlikes: true, spell: true, size: 10 },
        5: { choices: 4, extras: 3, lookAlikes: true, spell: true, size: 10 }
    };

    const $ = (id) => document.getElementById(id);

    // ================= Saved state =================
    // Everything is saved per reader (child profile) on this device.
    const defaults = {
        settings: { sound: true, rate: 0.85, timer: 0, theme: 'sky', roundSize: null, buildHide: 'auto', unlockAll: false },
        progress: {},       // { listId: { word: { c: correctCount, m: missCount } } }
        stars: 0,
        customWords: []
    };
    const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🐙', '🦄', '🐢', '🦖', '🐧', '🐝', '🐬', '🦉'];
    const AVATAR_COLORS = ['#ff8a65', '#78909c', '#ffb300', '#66bb6a', '#ec407a', '#ab47bc',
        '#26a69a', '#7cb342', '#5c6bc0', '#fbc02d', '#29b6f6', '#8d6e63'];

    // Older saves stored the spelling challenge as on/off.
    function cleanSettings(settings = {}) {
        const merged = { ...defaults.settings, ...settings };
        if (merged.buildHide === true) merged.buildHide = 'always';
        if (merged.buildHide === false) merged.buildHide = 'auto';
        return merged;
    }

    function newProfile(name, avatar, data = {}) {
        return {
            ...defaults, ...data,
            settings: cleanSettings(data.settings),
            id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name, avatar
        };
    }

    function readJSON(key) {
        try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
    }

    function load() {
        const saved = readJSON(STORE_KEY);
        if (saved && Array.isArray(saved.profiles)) {
            saved.profiles = saved.profiles.map(p => ({
                ...defaults, ...p, settings: cleanSettings(p.settings)
            }));
            return saved;
        }
        // Bring over progress from the previous single-child version, and
        // custom words from the original version of the game.
        const v2 = readJSON('sitewordy:v2');
        const oldWords = readJSON('customWords');
        const store = { profiles: [], activeId: null };
        if (v2 || Array.isArray(oldWords)) {
            const data = v2 || {};
            if (!data.customWords && Array.isArray(oldWords)) {
                data.customWords = oldWords.filter(w => typeof w === 'string' && w.trim());
            }
            const first = newProfile('Reader', AVATARS[0], data);
            store.profiles.push(first);
            store.activeId = first.id;
        }
        return store;
    }

    function save() {
        try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch (e) { /* storage blocked */ }
    }

    const store = load();
    // The reader who is playing right now.
    let state = store.profiles.find(p => p.id === store.activeId) || store.profiles[0] || null;

    function avatarColor(avatar) {
        return AVATAR_COLORS[Math.max(0, AVATARS.indexOf(avatar))];
    }

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

    function wordStats(listId, key, reader = state) {
        return reader.progress[listId]?.[key] || { c: 0, m: 0 };
    }

    function isLearned(listId, key, reader = state) {
        return wordStats(listId, key, reader).c >= MASTERED_AT;
    }

    function learnedCount(list, reader = state) {
        return list.items.filter(k => isLearned(list.id, k, reader)).length;
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

    // ================= Levels =================
    function stageForAge(age) {
        if (!age || age <= 4) return 1;
        return Math.min(STAGES.length, age - 3);
    }

    function stageLists(stage) {
        return window.SITEWORDY_LISTS.filter(l => l.stage === stage);
    }

    function stageProgress(stage, reader = state) {
        let total = 0;
        let learned = 0;
        for (const list of stageLists(stage)) {
            total += list.items.length;
            learned += learnedCount(list, reader);
        }
        return total ? learned / total : 0;
    }

    // The highest level this child has reached: their age sets the start,
    // and each level they mostly learn opens the next one.
    function currentStage(reader = state) {
        let stage = stageForAge(reader.age);
        while (stage < STAGES.length && stageProgress(stage, reader) >= UNLOCK_AT) stage++;
        return stage;
    }

    function isUnlocked(list) {
        return state.settings.unlockAll || !list.stage || list.stage <= currentStage();
    }

    // My Words plays at the child's current level.
    function difficultyFor(list) {
        return DIFFICULTY[list.stage || currentStage()];
    }

    function stageInfo(stage) {
        return STAGES.find(s => s.stage === stage);
    }

    // ================= Screens =================
    function show(screenId) {
        for (const s of document.querySelectorAll('.screen')) s.hidden = s.id !== screenId;
        window.scrollTo(0, 0);
    }

    function listTile(list, { locked = false, nextUp = false } = {}) {
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'list-tile' + (locked ? ' locked' : '') + (nextUp ? ' next-up' : '');
        tile.style.setProperty('--tile', list.color);

        const total = list.items.length;
        const learned = learnedCount(list);
        const pct = total ? Math.round((learned / total) * 100) : 0;
        let countLabel = `${learned} of ${total} learned`;
        if (list.id === 'custom' && !total) countLabel = 'Add words in Grown-ups';
        else if (locked) countLabel = '🔒 Locked';
        else if (pct === 100) countLabel = '🏆 All learned!';

        tile.innerHTML = `
            <span class="tile-emoji" aria-hidden="true"></span>
            <span class="tile-title"></span>
            <span class="tile-sub"></span>
            <span class="tile-meter" aria-hidden="true"><span style="width:${pct}%"></span></span>
            <span class="tile-count"></span>`;
        tile.querySelector('.tile-emoji').textContent = locked ? '🔒' : list.emoji;
        tile.querySelector('.tile-title').textContent = list.title;
        tile.querySelector('.tile-sub').textContent = list.subtitle;
        tile.querySelector('.tile-count').textContent = countLabel;
        if (nextUp) {
            const badge = document.createElement('span');
            badge.className = 'next-badge';
            badge.textContent = 'Up next';
            tile.append(badge);
        }
        tile.addEventListener('click', () => {
            if (locked) {
                const need = stageInfo(list.stage - 1);
                toast(`🔒 Keep practicing ${need.title} to unlock this!`);
                Speech.say('Keep practicing to unlock this one!');
                return;
            }
            chooseList(list.id);
        });
        return tile;
    }

    // The list a child should play next: the least-learned one at their level.
    function nextUpList() {
        const stage = currentStage();
        const candidates = stageLists(stage).filter(l => learnedCount(l) < l.items.length);
        if (!candidates.length) return null;
        return candidates.reduce((best, l) =>
            learnedCount(l) / l.items.length < learnedCount(best) / best.items.length ? l : best);
    }

    function renderHome() {
        if (!state) return;
        $('star-total').textContent = state.stars;
        $('reader-avatar').textContent = state.avatar;
        $('reader-name').textContent = state.name;

        const current = currentStage();
        const next = nextUpList();
        const path = $('learning-path');
        path.textContent = '';

        for (const info of STAGES) {
            const open = state.settings.unlockAll || info.stage <= current;
            const isNextLocked = !open && info.stage === current + 1;
            const section = document.createElement('section');
            section.className = 'stage' + (open ? '' : ' locked') + (info.stage === current ? ' current' : '');
            const pct = Math.round(stageProgress(info.stage) * 100);
            section.innerHTML = `
                <div class="stage-head">
                    <span class="stage-badge" aria-hidden="true"></span>
                    <div class="stage-text">
                        <h2 class="stage-title"></h2>
                        <p class="stage-sub"></p>
                    </div>
                </div>`;
            section.querySelector('.stage-badge').textContent = open ? info.emoji : '🔒';
            section.querySelector('.stage-title').textContent = `Level ${info.stage} · ${info.title}`;
            section.querySelector('.stage-sub').textContent = open
                ? `${info.ages} · ${pct}% learned`
                : `${info.ages} · Locked`;
            if (info.stage === current) {
                const here = document.createElement('span');
                here.className = 'stage-here';
                here.textContent = `${state.avatar} You are here`;
                section.querySelector('.stage-head').append(here);
            }
            if (isNextLocked) {
                const prev = stageInfo(current);
                const need = Math.round(UNLOCK_AT * 100);
                const note = document.createElement('p');
                note.className = 'stage-lock';
                note.textContent = `Learn ${need}% of ${prev.title} to unlock (${Math.round(stageProgress(current) * 100)}% so far)`;
                section.append(note);
            }
            // Show tiles for open levels and the very next one; later levels stay a surprise.
            if (open || isNextLocked) {
                const grid = document.createElement('div');
                grid.className = 'list-grid';
                for (const list of stageLists(info.stage)) {
                    grid.append(listTile(list, { locked: !open, nextUp: next === list }));
                }
                section.append(grid);
            }
            path.append(section);
        }

        const mine = $('my-lists');
        mine.textContent = '';
        mine.append(listTile(findList('custom')));
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
        const size = String(state.settings.roundSize ?? difficultyFor(list).size);
        for (const radio of document.querySelectorAll('input[name="round-size"]')) radio.checked = radio.value === size;
        const dialog = $('mode-dialog');
        $('mode-build').hidden = !!list.letters;
        dialog.returnValue = '';
        dialog.showModal();
    }

    $('mode-dialog').addEventListener('close', () => {
        const mode = $('mode-dialog').returnValue;
        if (!['flash', 'find', 'build'].includes(mode)) return;
        const size = Number(document.querySelector('input[name="round-size"]:checked').value);
        state.settings.roundSize = size;
        save();
        startRound(pending, mode, size);
    });

    // ================= A round of practice =================
    let round = null;

    function pickWords(list, size) {
        // Words the child is working on come first, then brand-new words from
        // shortest to longest, then a little review of words already learned.
        const seen = k => { const s = wordStats(list.id, k); return s.c + s.m > 0; };
        const learning = shuffle(list.items.filter(k => seen(k) && !isLearned(list.id, k)));
        const fresh = list.items
            .filter(k => !seen(k))
            .map((k, i) => ({ k, i, len: parseItem(k, list).text.length }))
            .sort((a, b) => a.len - b.len || a.i - b.i)
            .map(x => x.k);
        const learned = shuffle(list.items.filter(k => isLearned(list.id, k)));
        const picked = [...learning, ...fresh, ...learned].slice(0, size || list.items.length);
        return shuffle(picked);
    }

    function startRound(listId, mode, size, onlyKeys) {
        const list = findList(listId);
        const keys = onlyKeys ? shuffle(onlyKeys) : pickWords(list, size);
        round = {
            list, mode, size,
            level: difficultyFor(list),
            stageBefore: currentStage(),
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
        $('build-view').hidden = mode !== 'build';
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
        if (round.mode === 'flash') showFlash();
        else if (round.mode === 'build') showBuild();
        else showFind();
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
    // How alike two words look: same start, similar length, shared letters.
    function lookAlikeScore(a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        let score = 0;
        if (a[0] === b[0]) score += 3;
        if (a.slice(-1) === b.slice(-1)) score += 1;
        if (Math.abs(a.length - b.length) <= 1) score += 2;
        score += [...new Set(a)].filter(ch => b.includes(ch)).length * 0.5;
        return score;
    }

    function pickChoices(item) {
        const list = round.list;
        const { choices, lookAlikes } = round.level;
        let pool = list.items.map(k => parseItem(k, list));
        if (pool.length < choices + 2) {
            const starter = findList('dolch-prek');
            pool = pool.concat(starter.items.map(k => parseItem(k, starter)));
        }
        const others = shuffle(pool).filter((other, i, arr) =>
            other.text.toLowerCase() !== item.text.toLowerCase() &&
            !Speech.soundsAlike(other.text, item.text) &&
            arr.findIndex(o => o.text.toLowerCase() === other.text.toLowerCase()) === i
        );
        // Higher levels mix in words that look alike, like "was" and "saw".
        if (lookAlikes) others.sort((a, b) => lookAlikeScore(b.text, item.text) - lookAlikeScore(a.text, item.text));
        return shuffle([item, ...others.slice(0, choices - 1)]);
    }

    function findPrompt(item) {
        return item.letter ? `Find the letter ${item.text}` : `Find the word: ${item.text}`;
    }

    function showFind() {
        const item = current();
        const box = $('find-choices');
        box.textContent = '';
        box.classList.toggle('four', round.level.choices === 4);
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

    // ---------- Build it ----------
    const DISTRACTORS = 'abcdefghilmnoprstuw';
    let build = null;

    // Phonics words build from sound units (sh, ee...), sight words letter by letter.
    function buildUnits(item) {
        return item.blendable ? item.text.match(UNITS) : Array.from(item.text);
    }

    function setBuildWordVisible(visible) {
        $('build-word').hidden = !visible;
        $('build-hidden').hidden = visible;
    }

    function showBuild() {
        const item = current();
        const units = buildUnits(item);
        build = { item, units, slots: units.map(() => null), locked: units.map(() => false) };

        const spelling = state.settings.buildHide;
        const hide = spelling === 'always' || (spelling === 'auto' && round.level.spell);
        renderWord($('build-word'), item);
        setBuildWordVisible(!hide);
        $('build-peek').hidden = !hide;
        $('build-feedback').textContent = '';

        const slotsEl = $('build-slots');
        slotsEl.textContent = '';
        slotsEl.classList.remove('joined');
        units.forEach((unit, i) => {
            const slot = document.createElement('button');
            slot.type = 'button';
            slot.className = 'slot';
            slot.setAttribute('aria-label', `Space ${i + 1}`);
            slot.addEventListener('click', () => clearSlot(i));
            slotsEl.append(slot);
        });

        // Extra letters make it trickier as levels go up (but never more than 9 tiles).
        const extraCount = Math.min(round.level.extras, Math.max(0, 9 - units.length));
        const extras = shuffle(DISTRACTORS.split('').filter(l => !item.text.toLowerCase().includes(l)))
            .slice(0, extraCount);
        let order = shuffle([...units, ...extras]);
        if (order.length > 1 && order.slice(0, units.length).join('') === units.join('')) {
            order = [...order.slice(1), order[0]];
        }
        const tray = $('build-tray');
        tray.textContent = '';
        for (const unit of order) {
            const tile = document.createElement('button');
            tile.type = 'button';
            tile.className = 'tile build-tile';
            tile.textContent = unit;
            tile.dataset.unit = unit;
            tile.addEventListener('click', () => placeTile(tile));
            tray.append(tile);
        }
        setTimeout(() => Speech.say(spoken(item)), 300);
    }

    function placeTile(tile) {
        if (!build || tile.classList.contains('used')) return;
        const i = build.slots.indexOf(null);
        if (i < 0) return;
        build.slots[i] = tile;
        tile.classList.add('used');
        tile.disabled = true;
        const slot = $('build-slots').children[i];
        slot.textContent = tile.dataset.unit;
        slot.classList.add('filled');
        if (!build.slots.includes(null)) setTimeout(checkBuild, 250);
    }

    function clearSlot(i) {
        if (!build || build.locked[i] || !build.slots[i]) return;
        const tile = build.slots[i];
        build.slots[i] = null;
        tile.classList.remove('used');
        tile.disabled = false;
        const slot = $('build-slots').children[i];
        slot.textContent = '';
        slot.classList.remove('filled', 'wrong');
    }

    function checkBuild() {
        if (!build || build.slots.includes(null)) return;
        const { item } = build;
        const slotEls = $('build-slots').children;
        const wrong = build.units.map((unit, i) => build.slots[i].dataset.unit !== unit);

        if (!wrong.includes(true)) {
            build = null;
            for (const el of slotEls) el.classList.add('right');
            $('build-slots').classList.add('joined');
            setBuildWordVisible(true);
            $('build-peek').hidden = true;
            markRight(item);
            $('build-feedback').textContent = randomPraise();
            setTimeout(() => Speech.say(spoken(item)), 300);
            if (round.firstTryRight.has(item.key)) burstConfetti(18);
            next(1500);
            return;
        }

        // Keep the right letters in place; wiggle the wrong ones back to the tray.
        markMissed(item);
        playSound('incorrect-sound');
        $('build-feedback').textContent = 'So close! Fix the wiggly letters.';
        wrong.forEach((isWrong, i) => {
            if (isWrong) {
                slotEls[i].classList.add('wrong');
            } else {
                build.locked[i] = true;
                slotEls[i].classList.add('right');
            }
        });
        const attempt = build;
        setTimeout(() => {
            if (build !== attempt) return;
            wrong.forEach((isWrong, i) => { if (isWrong) clearSlot(i); });
        }, 650);
    }

    $('build-speak').addEventListener('click', () => Speech.say(spoken(current())));
    $('build-peek').addEventListener('click', () => {
        setBuildWordVisible(true);
        const peeked = build;
        setTimeout(() => { if (build && build === peeked) setBuildWordVisible(false); }, 2000);
    });

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

        // Level up?
        const stageNow = currentStage();
        const levelUp = $('level-up');
        levelUp.hidden = stageNow <= round.stageBefore;
        if (!levelUp.hidden) {
            const info = stageInfo(stageNow);
            levelUp.innerHTML = '<span class="level-up-emoji" aria-hidden="true"></span><span><strong>Level up!</strong><span class="level-up-text"></span></span>';
            levelUp.querySelector('.level-up-emoji').textContent = info.emoji;
            levelUp.querySelector('.level-up-text').textContent = `You unlocked Level ${info.stage}: ${info.title}!`;
            $('done-title').textContent = 'You leveled up!';
            setTimeout(() => Speech.say(`Level up! You unlocked ${info.title}!`), 700);
        }

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
        build = null;
        renderHome();
        show('screen-home');
    }

    // Keyboard shortcuts for grown-ups at a computer: → got it, ← practice again, space to hear.
    document.addEventListener('keydown', (event) => {
        if (!round || $('screen-play').hidden || document.querySelector('dialog[open]')) return;
        if (round.mode === 'build' && build) {
            if (event.key === 'Backspace') {
                event.preventDefault();
                const filled = build.slots.map((t, i) => (t && !build.locked[i] ? i : -1)).filter(i => i >= 0);
                if (filled.length) clearSlot(filled[filled.length - 1]);
            } else if (event.key.length === 1) {
                const key = event.key.toLowerCase();
                const free = [...$('build-tray').children].filter(t => !t.classList.contains('used'));
                const tile = free.find(t => t.dataset.unit.toLowerCase() === key)
                    || free.find(t => t.dataset.unit.toLowerCase().startsWith(key));
                if (tile) placeTile(tile);
            }
            return;
        }
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
        if (!state) return;
        document.documentElement.dataset.theme = state.settings.theme;
        Speech.setRate(Number(state.settings.rate));
    }

    function openGrownups() {
        fillGrownups();
        $('grownups-dialog').showModal();
    }

    function fillGrownups() {
        renderReaderList();
        $('settings-title').textContent = `Settings for ${state.avatar} ${state.name}`;
        $('set-build-hide').value = state.settings.buildHide;
        $('set-unlock-all').checked = state.settings.unlockAll;
        $('set-sound').checked = state.settings.sound;
        $('set-rate').value = String(state.settings.rate);
        $('set-timer').value = String(state.settings.timer);
        $('set-theme').value = state.settings.theme;
        renderCustomWords();
        renderProgressTable();
    }

    $('open-grownups').addEventListener('click', openGrownups);
    $('grownups-dialog').addEventListener('close', renderHome);

    $('set-sound').addEventListener('change', (e) => { state.settings.sound = e.target.checked; save(); });
    $('set-rate').addEventListener('change', (e) => {
        state.settings.rate = Number(e.target.value); save(); applySettings();
        Speech.say('Hello! Let’s read.');
    });
    $('set-build-hide').addEventListener('change', (e) => { state.settings.buildHide = e.target.value; save(); });
    $('set-unlock-all').addEventListener('change', (e) => { state.settings.unlockAll = e.target.checked; save(); });
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
        if (!confirm(`Reset ${state.name}’s progress and stars? This can’t be undone. (My Words are kept.)`)) return;
        state.progress = {};
        state.stars = 0;
        save();
        renderProgressTable();
        toast('Progress reset');
    });

    // ================= Readers (child profiles) =================
    function showProfiles() {
        const grid = $('profile-grid');
        grid.textContent = '';
        for (const profile of store.profiles) {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'profile-card';
            card.style.setProperty('--tile', avatarColor(profile.avatar));
            card.innerHTML = '<span class="profile-avatar" aria-hidden="true"></span><span class="profile-name"></span><span class="profile-stars"></span>';
            card.querySelector('.profile-avatar').textContent = profile.avatar;
            card.querySelector('.profile-name').textContent = profile.name;
            card.querySelector('.profile-stars').textContent = `⭐ ${profile.stars} · Level ${currentStage(profile)}`;
            card.addEventListener('click', () => enterAs(profile.id));
            grid.append(card);
        }
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'profile-card add';
        add.innerHTML = '<span class="profile-avatar" aria-hidden="true">+</span><span class="profile-name">Add a reader</span>';
        add.addEventListener('click', () => openProfileDialog());
        grid.append(add);
        show('screen-profiles');
    }

    function enterAs(id) {
        state = store.profiles.find(p => p.id === id);
        store.activeId = id;
        save();
        applySettings();
        renderHome();
        show('screen-home');
        // Older kids land on their own level instead of scrolling past the early ones.
        const here = document.querySelector('.stage.current');
        if (here && currentStage() > 1) here.scrollIntoView({ block: 'start' });
    }

    $('switch-reader').addEventListener('click', showProfiles);

    let editingId = null;

    function openProfileDialog(profileId = null) {
        editingId = profileId;
        const profile = store.profiles.find(p => p.id === profileId);
        $('profile-dialog-title').textContent = profile
            ? `Edit ${profile.name}`
            : store.profiles.length ? 'Add a reader' : 'Welcome! Who’s reading?';
        $('profile-name').value = profile ? profile.name : '';
        $('profile-age').value = String(profile?.age || 4);
        const chosen = profile ? profile.avatar
            : AVATARS.find(a => !store.profiles.some(p => p.avatar === a)) || AVATARS[0];
        const grid = $('avatar-grid');
        grid.textContent = '';
        for (const avatar of AVATARS) {
            const label = document.createElement('label');
            label.className = 'avatar-option';
            label.style.setProperty('--tile', avatarColor(avatar));
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'avatar';
            input.value = avatar;
            input.checked = avatar === chosen;
            const face = document.createElement('span');
            face.textContent = avatar;
            label.append(input, face);
            grid.append(label);
        }
        $('profile-save').textContent = profile ? 'Save' : 'Let’s read!';
        $('profile-delete').hidden = !profile;
        $('profile-cancel').hidden = !store.profiles.length;
        $('profile-dialog').showModal();
        $('profile-name').focus();
    }

    // The very first reader has to be added before playing.
    $('profile-dialog').addEventListener('cancel', (event) => {
        if (!store.profiles.length) event.preventDefault();
    });
    $('profile-cancel').addEventListener('click', () => $('profile-dialog').close());

    $('profile-form').addEventListener('submit', (event) => {
        event.preventDefault();
        const name = $('profile-name').value.trim();
        if (!name) return;
        const avatar = document.querySelector('input[name="avatar"]:checked')?.value || AVATARS[0];
        const age = Number($('profile-age').value);
        let enterId = null;
        if (editingId) {
            const profile = store.profiles.find(p => p.id === editingId);
            profile.name = name;
            profile.avatar = avatar;
            profile.age = age;
        } else {
            const profile = newProfile(name, avatar, { age });
            store.profiles.push(profile);
            enterId = profile.id;
        }
        save();
        $('profile-dialog').close();
        if ($('grownups-dialog').open) fillGrownups();
        else if (enterId) enterAs(enterId);
        else showProfiles();
    });

    $('profile-delete').addEventListener('click', () => {
        const profile = store.profiles.find(p => p.id === editingId);
        if (!profile) return;
        if (!confirm(`Remove ${profile.name}? Their stars, stickers, and progress will be deleted.`)) return;
        store.profiles = store.profiles.filter(p => p.id !== profile.id);
        if (store.activeId === profile.id) {
            state = store.profiles[0] || null;
            store.activeId = state ? state.id : null;
        }
        save();
        $('profile-dialog').close();
        if (!state) {
            $('grownups-dialog').close();
            showProfiles();
            openProfileDialog();
            return;
        }
        applySettings();
        if ($('grownups-dialog').open) fillGrownups();
        else showProfiles();
    });

    function renderReaderList() {
        const box = $('reader-list');
        box.textContent = '';
        for (const profile of store.profiles) {
            const row = document.createElement('div');
            row.className = 'reader-row';
            row.innerHTML = '<span class="reader-avatar" aria-hidden="true"></span><span class="reader-row-name"></span><span class="muted reader-row-stars"></span>';
            row.querySelector('.reader-avatar').textContent = profile.avatar;
            row.querySelector('.reader-avatar').style.background = avatarColor(profile.avatar);
            row.querySelector('.reader-row-name').textContent = profile.name + (profile.id === state.id ? ' (playing now)' : '');
            row.querySelector('.reader-row-stars').textContent = `Level ${currentStage(profile)} · ⭐ ${profile.stars}`;
            const edit = document.createElement('button');
            edit.type = 'button';
            edit.className = 'small-btn ghost';
            edit.textContent = 'Edit';
            edit.setAttribute('aria-label', `Edit ${profile.name}`);
            edit.addEventListener('click', () => openProfileDialog(profile.id));
            row.append(edit);
            box.append(row);
        }
    }

    $('add-reader-btn').addEventListener('click', () => openProfileDialog());

    // ================= Start =================
    if (!state) {
        showProfiles();
        openProfileDialog();
    } else if (store.profiles.length > 1) {
        applySettings();
        showProfiles();
    } else {
        enterAs(state.id);
    }
})();
