const CONDITIONS = [
    { icon: '☀️', label: 'Sunny' },
    { icon: '🌧️', label: 'Rainy' },
    { icon: '⛅', label: 'Partly Cloudy' },
    { icon: '❄️', label: 'Snowy' }
];

function init() {
    const badge = document.querySelector('.weather-badge');
    if (!badge) return;

    badge.addEventListener('click', () => {
        const iconEl = document.getElementById('weather-icon');
        const conditionEl = document.querySelector('.condition');
        const next = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];
        if (iconEl) iconEl.textContent = next.icon;
        if (conditionEl) conditionEl.textContent = next.label;
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
