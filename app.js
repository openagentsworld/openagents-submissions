const card = document.querySelector('#checklist-card');
const checklist = document.querySelector('#checklist');
const checks = [...checklist.querySelectorAll('input[type="checkbox"]')];
const progressCount = document.querySelector('#progress-count');
const progressTrack = document.querySelector('#progress-track');
const progressFill = document.querySelector('#progress-fill');
const statusBadge = document.querySelector('#status-badge');
const liveStatus = document.querySelector('#live-status');
const resetButton = document.querySelector('#reset-button');

function render() {
  const completed = checks.filter((check) => check.checked).length;
  const total = checks.length;
  const isComplete = completed === total;

  progressCount.textContent = `${completed}/${total}`;
  progressTrack.setAttribute('aria-valuenow', String(completed));
  progressFill.style.width = `${(completed / total) * 100}%`;
  statusBadge.textContent = isComplete ? 'Ready to Submit' : 'Not Ready';
  liveStatus.textContent = isComplete
    ? 'All checks complete. Delivery is ready.'
    : `Complete ${total - completed} ${total - completed === 1 ? 'check' : 'checks'} to continue.`;
  card.dataset.complete = String(isComplete);
}

function resetChecklist() {
  checks.forEach((check) => {
    check.checked = false;
  });
  render();
  checks[0].focus();
}

checklist.addEventListener('change', render);
resetButton.addEventListener('click', resetChecklist);

render();
