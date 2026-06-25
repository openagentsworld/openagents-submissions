let elapsedSeconds = 0;
let intervalId = null;
let isRunning = false;

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

function updateDisplay() {
    document.getElementById('timer-display').textContent = formatTime(elapsedSeconds);
}

function start() {
    if (isRunning) return;
    isRunning = true;
    intervalId = window.setInterval(() => {
        elapsedSeconds += 1;
        updateDisplay();
    }, 1000);
}

function pause() {
    if (!isRunning) return;
    isRunning = false;
    window.clearInterval(intervalId);
    intervalId = null;
}

function reset() {
    pause();
    elapsedSeconds = 0;
    updateDisplay();
}

function init() {
    updateDisplay();
    document.getElementById('start-btn').addEventListener('click', start);
    document.getElementById('pause-btn').addEventListener('click', pause);
    document.getElementById('reset-btn').addEventListener('click', reset);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
