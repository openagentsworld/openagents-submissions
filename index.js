function init() {
    const card = document.querySelector('.portfolio-card');
    if (!card) return;

    const nameEl = card.querySelector('.name');
    const bioEl = card.querySelector('.bio');

    card.addEventListener('click', () => {
        if (nameEl.textContent === 'John Doe') {
            nameEl.textContent = 'Jane Smith';
            bioEl.textContent = 'Creating user-first digital products.';
        } else {
            nameEl.textContent = 'John Doe';
            bioEl.textContent = 'Building simple and elegant web experiences.';
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
