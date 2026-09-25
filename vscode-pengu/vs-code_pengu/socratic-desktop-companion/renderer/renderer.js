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

  if (mood === 'thinking' || mood === 'thinking-explain') {
    bubbleText.textContent = mood === 'thinking-explain'
      ? 'Let me think about how to help...'
      : 'Analyzing your code...';
    bubbleTag.textContent = 'THINKING';
    mascotImg.src = IMAGES.thinking;
    bubble.style.display = 'block';
    actions.style.display = 'none';
  } else if (mood === 'alert') {
    bubbleTag.textContent = 'ALERT';
    bubble.style.display = 'block';
    actions.style.display = 'flex';
  }
  // NOTE: do NOT call hideNudge from here for 'idle' — it causes infinite recursion
}

function showNudge({ question, misconception_tag }) {
  mascotImg.src = IMAGES.alert;
  bubbleText.textContent = question || 'Could there be an edge case here?';
  bubbleTag.textContent = misconception_tag ? `noticed: ${misconception_tag}` : 'SOCRATIC NUDGE';
  bubble.style.display = 'block';
  actions.style.display = 'flex';
}

function showExplanation({ explanation }) {
  mascotImg.src = IMAGES.alert;
  bubbleText.textContent = explanation || 'Try tracing through your code with a small example.';
  bubbleTag.textContent = 'HERE\'S A HINT';
  bubble.style.display = 'block';
  // Show only dismiss after explanation — no further "help" loop
  actions.style.display = 'flex';
  helpBtn.style.display = 'none';
  dismissBtn.textContent = 'Got it, thanks!';
}

function hideNudge() {
  bubble.style.display = 'none';
  actions.style.display = 'none';
  mascotImg.src = IMAGES.idle;
  // Reset button states for next nudge
  helpBtn.style.display = '';
  dismissBtn.textContent = "I've got it";
}

window.companion.onNudge((data) => showNudge(data));
window.companion.onExplanation((data) => showExplanation(data));
window.companion.onMood((data) => {
  if (data.mood === 'idle') {
    hideNudge();
  } else {
    setMood(data.mood);
  }
});

helpBtn.addEventListener('click', () => {
  window.companion.respond('help');
  // Don't hideNudge — show thinking state instead. The main process will
  // send back a 'thinking-explain' mood followed by an 'explanation' event.
});

dismissBtn.addEventListener('click', () => {
  window.companion.respond('dismiss');
  hideNudge();
});
