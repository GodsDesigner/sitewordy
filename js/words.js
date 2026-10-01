/*
 * Sitewordy word lists.
 *
 * Sight words follow the Dolch lists, organized by grade the way most
 * schools teach them today, plus the first 200 Fry instant words.
 *
 * Phonics lists use [brackets] to mark the sound pattern being practiced,
 * e.g. "[bl]ue" highlights the "bl" blend. The brackets are only for
 * display; the child sees "blue" with "bl" colored.
 */
/*
 * The learning path. Each stage unlocks when a child has learned most of the
 * stage before it, and the games get a little harder at every stage.
 * A child's age sets where they start.
 */
window.SITEWORDY_STAGES = [
    { stage: 1, title: 'Little Readers', ages: 'Ages 3–4', emoji: '🐣' },
    { stage: 2, title: 'Kindergarten', ages: 'Age 5', emoji: '🎒' },
    { stage: 3, title: '1st Grade', ages: 'Age 6', emoji: '✏️' },
    { stage: 4, title: '2nd Grade', ages: 'Age 7', emoji: '📚' },
    { stage: 5, title: '3rd Grade', ages: 'Ages 8+', emoji: '🚀' }
];

window.SITEWORDY_LISTS = [
    // ---------- Sight words (Dolch, by grade) ----------
    {
        id: 'dolch-prek', stage: 1, group: 'sight', emoji: '🐣', color: '#ff8a65',
        title: 'Pre-K', subtitle: 'First sight words',
        items: [
            'a', 'and', 'away', 'big', 'blue', 'can', 'come', 'down', 'find', 'for',
            'funny', 'go', 'help', 'here', 'I', 'in', 'is', 'it', 'jump', 'little',
            'look', 'make', 'me', 'my', 'not', 'one', 'play', 'red', 'run', 'said',
            'see', 'the', 'three', 'to', 'two', 'up', 'we', 'where', 'yellow', 'you'
        ]
    },
    {
        id: 'dolch-k', stage: 2, group: 'sight', emoji: '🎒', color: '#ffb300',
        title: 'Kindergarten', subtitle: 'Primer sight words',
        items: [
            'all', 'am', 'are', 'at', 'ate', 'be', 'black', 'brown', 'but', 'came',
            'did', 'do', 'eat', 'four', 'get', 'good', 'have', 'he', 'into', 'like',
            'must', 'new', 'no', 'now', 'on', 'our', 'out', 'please', 'pretty', 'ran',
            'ride', 'saw', 'say', 'she', 'so', 'soon', 'that', 'there', 'they', 'this',
            'too', 'under', 'want', 'was', 'well', 'went', 'what', 'white', 'who', 'will',
            'with', 'yes'
        ]
    },
    {
        id: 'dolch-1', stage: 3, group: 'sight', emoji: '✏️', color: '#66bb6a',
        title: '1st Grade', subtitle: 'Growing readers',
        items: [
            'after', 'again', 'an', 'any', 'as', 'ask', 'by', 'could', 'every', 'fly',
            'from', 'give', 'going', 'had', 'has', 'her', 'him', 'his', 'how', 'just',
            'know', 'let', 'live', 'may', 'of', 'old', 'once', 'open', 'over', 'put',
            'round', 'some', 'stop', 'take', 'thank', 'them', 'then', 'think', 'walk', 'were',
            'when'
        ]
    },
    {
        id: 'dolch-2', stage: 4, group: 'sight', emoji: '📚', color: '#42a5f5',
        title: '2nd Grade', subtitle: 'Confident readers',
        items: [
            'always', 'around', 'because', 'been', 'before', 'best', 'both', 'buy', 'call', 'cold',
            'does', "don't", 'fast', 'first', 'five', 'found', 'gave', 'goes', 'green', 'its',
            'made', 'many', 'off', 'or', 'pull', 'read', 'right', 'sing', 'sit', 'sleep',
            'tell', 'their', 'these', 'those', 'upon', 'us', 'use', 'very', 'wash', 'which',
            'why', 'wish', 'work', 'would', 'write', 'your'
        ]
    },
    {
        id: 'dolch-3', stage: 5, group: 'sight', emoji: '🚀', color: '#ab47bc',
        title: '3rd Grade', subtitle: 'Reading stars',
        items: [
            'about', 'better', 'bring', 'carry', 'clean', 'cut', 'done', 'draw', 'drink', 'eight',
            'fall', 'far', 'full', 'got', 'grow', 'hold', 'hot', 'hurt', 'if', 'keep',
            'kind', 'laugh', 'light', 'long', 'much', 'myself', 'never', 'only', 'own', 'pick',
            'seven', 'shall', 'show', 'six', 'small', 'start', 'ten', 'today', 'together', 'try',
            'warm'
        ]
    },
    {
        id: 'fry-1', stage: 2, group: 'sight', emoji: '💯', color: '#26a69a',
        title: 'Fry 1–100', subtitle: 'Most common words',
        items: [
            'the', 'of', 'and', 'a', 'to', 'in', 'is', 'you', 'that', 'it',
            'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'I',
            'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'words',
            'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said',
            'there', 'use', 'an', 'each', 'which', 'she', 'do', 'how', 'their', 'if',
            'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so',
            'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has', 'look',
            'two', 'more', 'write', 'go', 'see', 'number', 'no', 'way', 'could', 'people',
            'my', 'than', 'first', 'water', 'been', 'called', 'who', 'oil', 'sit', 'now',
            'find', 'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part'
        ]
    },
    {
        id: 'fry-2', stage: 5, group: 'sight', emoji: '🌟', color: '#5c6bc0',
        title: 'Fry 101–200', subtitle: 'Next 100 words',
        items: [
            'over', 'new', 'sound', 'take', 'only', 'little', 'work', 'know', 'place', 'years',
            'live', 'me', 'back', 'give', 'most', 'very', 'after', 'things', 'our', 'just',
            'name', 'good', 'sentence', 'man', 'think', 'say', 'great', 'where', 'help', 'through',
            'much', 'before', 'line', 'right', 'too', 'means', 'old', 'any', 'same', 'tell',
            'boy', 'follow', 'came', 'want', 'show', 'also', 'around', 'form', 'three', 'small',
            'set', 'put', 'end', 'does', 'another', 'well', 'large', 'must', 'big', 'even',
            'such', 'because', 'turned', 'here', 'why', 'asked', 'went', 'men', 'read', 'need',
            'land', 'different', 'home', 'us', 'move', 'try', 'kind', 'hand', 'picture', 'again',
            'change', 'off', 'play', 'spell', 'air', 'away', 'animals', 'house', 'point', 'page',
            'letters', 'mother', 'answer', 'found', 'study', 'still', 'learn', 'should', 'America', 'world'
        ]
    },

    // ---------- Phonics ----------
    {
        id: 'abc', stage: 1, group: 'phonics', emoji: '🔤', color: '#ef5350', letters: true,
        title: 'ABCs', subtitle: 'Letter names',
        items: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    },
    {
        id: 'cvc', stage: 1, group: 'phonics', emoji: '🐱', color: '#ffa726', blendable: true,
        title: 'Short Vowels', subtitle: 'CVC words like c-a-t',
        items: [
            'c[a]t', 'b[a]t', 'h[a]t', 'm[a]p', 'c[a]p', 'f[a]n', 'm[a]n', 'p[a]n', 'v[a]n', 'b[a]g',
            'b[e]d', 'r[e]d', 'p[e]n', 'h[e]n', 't[e]n', 'n[e]t', 'w[e]t', 'j[e]t', 'l[e]g', 'w[e]b',
            'p[i]g', 'b[i]g', 'd[i]g', 'w[i]g', 'p[i]n', 'w[i]n', 's[i]t', 'l[i]p', 'z[i]p', 's[i]x',
            'd[o]g', 'l[o]g', 'p[o]t', 'h[o]t', 'd[o]t', 't[o]p', 'm[o]p', 'h[o]p', 'b[o]x', 'f[o]x',
            'b[u]g', 'h[u]g', 'r[u]g', 'm[u]g', 's[u]n', 'b[u]n', 'r[u]n', 'c[u]p', 'p[u]p', 't[u]b'
        ]
    },
    {
        id: 'l-blends', stage: 3, group: 'phonics', emoji: '🦋', color: '#29b6f6', blendable: true,
        title: 'L-Blends', subtitle: 'bl, cl, fl, gl, pl, sl',
        items: [
            '[bl]ue', '[bl]ock', '[bl]ack', '[cl]ap', '[cl]ock', '[cl]ean', '[fl]ag', '[fl]ower',
            '[fl]ip', '[gl]ad', '[gl]ue', '[gl]ass', '[pl]an', '[pl]ant', '[pl]ay', '[sl]ide',
            '[sl]ed', '[sl]eep'
        ]
    },
    {
        id: 'r-blends', stage: 3, group: 'phonics', emoji: '🐸', color: '#66bb6a', blendable: true,
        title: 'R-Blends', subtitle: 'br, cr, dr, fr, gr, pr, tr',
        items: [
            '[br]own', '[br]ush', '[br]ead', '[cr]ab', '[cr]ash', '[dr]um', '[dr]ess', '[fr]og',
            '[fr]y', '[gr]ape', '[gr]een', '[gr]ass', '[pr]ize', '[pr]ess', '[tr]ee', '[tr]ain',
            '[tr]uck'
        ]
    },
    {
        id: 's-blends', stage: 3, group: 'phonics', emoji: '🐌', color: '#8d6e63', blendable: true,
        title: 'S & W Blends', subtitle: 'sc, sk, sm, sn, sp, st, sw, tw',
        items: [
            '[sc]arf', '[sk]ip', '[sk]ate', '[sk]y', '[sm]ile', '[sm]ell', '[sn]ail', '[sn]ow',
            '[sp]oon', '[sp]ace', '[st]ar', '[st]op', '[st]one', '[sw]im', '[sw]ing', '[sw]eet',
            '[tw]in', '[tw]ig'
        ]
    },
    {
        id: '3-blends', stage: 4, group: 'phonics', emoji: '🦐', color: '#ec407a', blendable: true,
        title: '3-Letter Blends', subtitle: 'scr, spl, spr, squ, str, thr, shr',
        items: [
            '[scr]ub', '[scr]eam', '[spl]ash', '[spl]it', '[spr]ing', '[spr]ay', '[squ]ash',
            '[str]eet', '[str]ing', '[str]ong', '[thr]ee', '[thr]ow', '[shr]imp'
        ]
    },
    {
        id: 'end-blends', stage: 4, group: 'phonics', emoji: '🏕️', color: '#7e57c2', blendable: true,
        title: 'Ending Blends', subtitle: 'nd, mp, st, lk, nt, sk, ft',
        items: [
            'ha[nd]', 'sa[nd]', 'ju[mp]', 'la[mp]', 'ca[mp]', 'ne[st]', 'fa[st]', 'mi[lk]',
            'be[lt]', 'te[nt]', 'de[sk]', 'ma[sk]', 'gi[ft]', 'le[ft]'
        ]
    },
    {
        id: 'digraphs', stage: 2, group: 'phonics', emoji: '🐳', color: '#0097a7', blendable: true,
        title: 'Digraphs', subtitle: 'sh, ch, th, wh, ck, ph',
        items: [
            '[sh]ip', '[sh]op', 'fi[sh]', 'di[sh]', '[ch]in', '[ch]ip', 'lun[ch]', '[th]in',
            '[th]ink', 'ba[th]', '[wh]en', '[wh]ale', 'du[ck]', 'so[ck]', 'ba[ck]', '[ph]one'
        ]
    }
];
