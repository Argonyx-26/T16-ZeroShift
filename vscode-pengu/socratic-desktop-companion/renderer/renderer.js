const mascotImg = document.getElementById('mascot');
const bubble = document.getElementById('bubble');
const bubbleText = document.getElementById('bubble-text');
const bubbleTag = document.getElementById('bubble-tag');
const actions = document.getElementById('actions');
const helpBtn = document.getElementById('helpBtn');
const dismissBtn = document.getElementById('dismissBtn');

const IMAGES = {
  idle: '../media/mascot-idle.png',
  thinking: '../media/mascot-thinking.png',
  alert: '../media/mascot-alert.png',
};

function setMood(mood) {
  mascotImg.src = IMAGES[mood] || IMAGES.idle;
}

function showNudge({ question, misconception_tag }) {
  setMood('alert');
  bubbleText.textContent = question || '';
  bubbleTag.textContent = misconception_tag ? `noticed: ${misconception_tag}` : '';
  bubble.style.display = 'block';
  actions.style.display = 'flex';
}

function hideNudge() {
  bubble.style.display = 'none';
  actions.style.display = 'none';
  setMood('idle');
}

window.companion.onNudge((data) => showNudge(data));
window.companion.onMood((data) => setMood(data.mood));

helpBtn.addEventListener('click', () => {
  window.companion.respond('help');
  hideNudge();
});

dismissBtn.addEventListener('click', () => {
  window.companion.respond('dismiss');
  hideNudge();
});
