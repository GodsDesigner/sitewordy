/*
 * Talking and listening.
 *
 * Speaking uses the browser's built-in voices (works in every modern browser).
 * Listening uses speech recognition, which only some browsers support
 * (Chrome, Edge, Safari). Everything still works without it.
 */
window.Speech = (() => {
    const synth = window.speechSynthesis;
    let voice = null;
    let rate = 0.85;

    // Friendlier, more natural voices first when the device has them.
    const PREFERRED = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Natural', 'Karen', 'Moira'];

    function pickVoice() {
        if (!synth) return;
        const english = synth.getVoices().filter(v => /^en[-_]/i.test(v.lang));
        if (!english.length) return;
        for (const name of PREFERRED) {
            const match = english.find(v => v.name.includes(name));
            if (match) { voice = match; return; }
        }
        voice = english.find(v => /en[-_]US/i.test(v.lang)) || english[0];
    }

    if (synth) {
        pickVoice();
        synth.addEventListener?.('voiceschanged', pickVoice);
    }

    function say(text, { slow = false } = {}) {
        if (!synth || !text) return;
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || 'en-US';
        utterance.rate = slow ? Math.max(0.5, rate - 0.2) : rate;
        utterance.pitch = 1.05;
        synth.speak(utterance);
    }

    // ---------- Listening ----------
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Words the recognizer often hears as a sound-alike.
    const SOUND_ALIKES = [
        ['to', 'two', 'too', '2'], ['for', 'four', '4'], ['one', 'won', '1'], ['be', 'bee', 'b'],
        ['see', 'sea', 'c'], ['i', 'eye', 'aye'], ['no', 'know'], ['new', 'knew'],
        ['there', 'their', "they're", 'theyre'], ['right', 'write', 'rite'], ['eight', 'ate', '8'],
        ['by', 'buy', 'bye'], ['red', 'read'], ['blue', 'blew'], ['sun', 'son'], ['our', 'hour'],
        ['would', 'wood'], ['its', "it's"], ['wear', 'where'], ['which', 'witch'], ['were', 'whirr'],
        ['three', '3'], ['five', '5'], ['six', '6'], ['seven', '7'], ['ten', '10'], ['so', 'sew'],
        ['some', 'sum'], ['made', 'maid'], ['flower', 'flour'], ['whale', 'wail'], ['in', 'inn'],
        ['a', 'uh', 'ah'], ['an', 'and'], ['dont', "don't"]
    ];

    function normalize(text) {
        return text.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9 ]/g, ' ').trim();
    }

    function matches(heard, target) {
        const want = normalize(target);
        const accepted = new Set([want]);
        for (const group of SOUND_ALIKES) {
            if (group.map(normalize).includes(want)) group.forEach(w => accepted.add(normalize(w)));
        }
        const said = normalize(heard);
        if (accepted.has(said)) return true;
        // Kids often say a little extra ("um, cat") so accept the word anywhere.
        return said.split(/\s+/).some(w => accepted.has(w));
    }

    /**
     * Listen once and report whether the child said the target word.
     * onDone(result) where result is 'match', 'nomatch', or 'error'.
     */
    function listenFor(target, onDone) {
        if (!Recognition) { onDone('error'); return () => {}; }
        const rec = new Recognition();
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.maxAlternatives = 5;
        let finished = false;
        const finish = (result, heard = '') => {
            if (finished) return;
            finished = true;
            onDone(result, heard);
        };
        rec.onresult = (event) => {
            const alternatives = Array.from(event.results[0] || []).map(a => a.transcript);
            const hit = alternatives.some(t => matches(t, target));
            finish(hit ? 'match' : 'nomatch', alternatives[0] || '');
        };
        rec.onerror = (event) => finish(event.error === 'no-speech' ? 'nomatch' : 'error');
        rec.onend = () => finish('nomatch');
        try {
            synth?.cancel();
            rec.start();
        } catch (e) {
            finish('error');
        }
        return () => { try { rec.abort(); } catch (e) { /* already stopped */ } };
    }

    // True when two words would be confusing to tell apart by ear ("to" / "two").
    function soundsAlike(a, b) {
        return matches(normalize(a), b) || matches(normalize(b), a);
    }

    return {
        say,
        soundsAlike,
        setRate(value) { rate = value; },
        canSpeak: !!synth,
        canListen: !!Recognition,
        listenFor
    };
})();
