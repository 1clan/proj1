const pages = [...document.querySelectorAll('.page')];
const progressFill = document.querySelector('#progress-fill');
const restart = document.querySelector('#restart');
const readAgain = document.querySelector('.read-again');
function goToStart() { document.querySelector('#start').scrollIntoView({ behavior: 'smooth' }); }
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressFill.style.width = Math.min(100, (window.scrollY / max) * 100) + '%';
}
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.target.classList.toggle('is-active', entry.isIntersecting));
}, { threshold: 0.58 });
pages.forEach((page) => observer.observe(page));
window.addEventListener('scroll', updateProgress, { passive: true });
restart.addEventListener('click', goToStart);
readAgain.addEventListener('click', goToStart);
document.addEventListener('keydown', (event) => {
  if (!['ArrowDown', 'ArrowUp', ' '].includes(event.key)) return;
  event.preventDefault();
  const current = pages.findIndex((page) => page.getBoundingClientRect().top >= -window.innerHeight * .25);
  const step = event.key === 'ArrowUp' ? -1 : 1;
  pages[Math.max(0, Math.min(pages.length - 1, current + step))].scrollIntoView({ behavior: 'smooth' });
});
updateProgress();
