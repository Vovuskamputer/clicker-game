let score = 0;
const scoreEl = document.getElementById('score');
const messageEl = document.getElementById('message');
const clickBtn = document.getElementById('clickBtn');

clickBtn.addEventListener('click', () => {
  score++;
  scoreEl.textContent = score;

  // Показываем краткое сообщение
  showMessage('+1');
});

function showMessage(text) {
  messageEl.textContent = text;
  messageEl.style.opacity = '1';
  setTimeout(() => {
    messageEl.style.opacity = '0';
  }, 800);
}