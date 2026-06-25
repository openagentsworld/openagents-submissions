function init() {
    const badge = document.querySelector('.status-badge');
    if (!badge) return;

    badge.addEventListener('click', () => {
        const indicator = badge.querySelector('.indicator');
        const label = badge.querySelector('.label');
        const sublabel = badge.querySelector('.sublabel');
        const isOnline = label.textContent === 'System Online';

        if (isOnline) {
            indicator.style.background = '#ef4444';
            indicator.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.2)';
            label.textContent = 'System Offline';
            sublabel.textContent = 'Service disruption detected';
        } else {
            indicator.style.background = '#22c55e';
            indicator.style.boxShadow = '0 0 0 4px rgba(34, 197, 94, 0.2)';
            label.textContent = 'System Online';
            sublabel.textContent = 'All services running';
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
