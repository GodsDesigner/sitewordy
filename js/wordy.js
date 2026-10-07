/*
 * Mr. Wordy: a friendly index card who guides kids through their lessons.
 * Moods: 'happy' (default), 'wave' (one pencil arm up), 'cheer' (both arms up).
 */
window.MrWordy = (() => {
    // A pencil drawn pointing right from the shoulder, then rotated into place.
    function pencil(x, y, angle) {
        return `
        <g transform="translate(${x} ${y}) rotate(${angle})">
            <rect x="0" y="-4.5" width="8" height="9" rx="2.5" fill="#ff9eb1"/>
            <rect x="7" y="-4.5" width="4" height="9" fill="#b9c2d0"/>
            <rect x="11" y="-4.5" width="25" height="9" fill="#ffc83d"/>
            <rect x="11" y="-4.5" width="25" height="3" fill="#ffd96e"/>
            <polygon points="36,-4.5 47,0 36,4.5" fill="#f3cfa4"/>
            <polygon points="43.5,-1.5 47,0 43.5,1.5" fill="#3b3b4f"/>
        </g>`;
    }

    const ARMS = {
        happy: [155, 25],
        wave: [155, -40],
        cheer: [215, -35]
    };

    function svg(mood = 'happy') {
        const [left, right] = ARMS[mood] || ARMS.happy;
        const mouth = mood === 'cheer'
            ? '<path d="M66 97 Q80 118 94 97 Z" fill="#1f2a44"/><path d="M73 106 Q80 113 87 106 Q80 103 73 106 Z" fill="#ff7a7a"/>'
            : '<path d="M68 98 Q80 110 92 98" fill="none" stroke="#1f2a44" stroke-width="4" stroke-linecap="round"/>';
        return `
        <svg viewBox="-34 0 228 175" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mr. Wordy">
            <ellipse cx="80" cy="168" rx="46" ry="5" fill="rgba(31,42,68,0.12)"/>
            ${pencil(22, 92, left)}
            ${pencil(138, 92, right)}
            <line x1="64" y1="128" x2="64" y2="152" stroke="#1f2a44" stroke-width="4" stroke-linecap="round"/>
            <line x1="96" y1="128" x2="96" y2="152" stroke="#1f2a44" stroke-width="4" stroke-linecap="round"/>
            <ellipse cx="60" cy="156" rx="10" ry="5.5" fill="#ff6f61"/>
            <ellipse cx="100" cy="156" rx="10" ry="5.5" fill="#ff6f61"/>
            <rect x="20" y="30" width="120" height="100" rx="10" fill="#fffdf5" stroke="#d9d2bd" stroke-width="2.5"/>
            <line x1="22" y1="50" x2="138" y2="50" stroke="#ff8a80" stroke-width="2"/>
            <g stroke="#a9cbff" stroke-width="1.6">
                <line x1="22" y1="68" x2="138" y2="68"/>
                <line x1="22" y1="86" x2="138" y2="86"/>
                <line x1="22" y1="104" x2="138" y2="104"/>
                <line x1="22" y1="122" x2="138" y2="122"/>
            </g>
            <path d="M44 40 V16 a7 7 0 0 1 14 0 V42 a4.5 4.5 0 0 1 -9 0 V20" fill="none" stroke="#8d99ae" stroke-width="3" stroke-linecap="round"/>
            <ellipse cx="62" cy="78" rx="7" ry="9" fill="#1f2a44"/>
            <ellipse cx="98" cy="78" rx="7" ry="9" fill="#1f2a44"/>
            <circle cx="64.5" cy="74.5" r="2.6" fill="#fff"/>
            <circle cx="100.5" cy="74.5" r="2.6" fill="#fff"/>
            <circle cx="48" cy="94" r="6.5" fill="#ff9e9e" opacity="0.55"/>
            <circle cx="112" cy="94" r="6.5" fill="#ff9e9e" opacity="0.55"/>
            ${mouth}
            <g transform="translate(80 120)">
                <polygon points="-16,-7 -2,0 -16,7" fill="#4f8fe6"/>
                <polygon points="16,-7 2,0 16,7" fill="#4f8fe6"/>
                <circle r="4" fill="#3a74c4"/>
            </g>
        </svg>`;
    }

    // Put Mr. Wordy into an element with the given mood.
    function draw(el, mood = 'happy') {
        el.innerHTML = svg(mood);
        el.dataset.mood = mood;
    }

    return { svg, draw };
})();
