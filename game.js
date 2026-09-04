const reader = document.querySelector('#reader');
const progressFill = document.querySelector('#progress-fill');
const library = document.querySelector('#library');
const fileInput = document.querySelector('#file-input');
const status = document.querySelector('#import-status');
const title = document.querySelector('#book-title');
let pages = [];
let observer;
function closeLibrary() {
  if (typeof library.close === 'function') library.close();
  else library.removeAttribute('open');
}

function sentenceUnits(text) {
  return text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+(?:["')\]]+)?|[^.!?]+$/g)?.map((s) => s.trim()).filter((s) => s.length > 2) || [];
}
function pageMarkup(sentence, index) {
  return '<section class="page reading-page"><div class="reading-content"><p class="number">' +
    String(index + 1).padStart(2, '0') + '</p><p class="sentence">' + escapeHtml(sentence) + '</p></div></section>';
}
function escapeHtml(value) {
  const node = document.createElement('div'); node.textContent = value; return node.innerHTML;
}
function setBook(name, text) {
  const sentences = sentenceUnits(text);
  if (!sentences.length) throw new Error('No readable sentences were found in this file.');
  title.textContent = name;
  reader.innerHTML = '<section class="page title-page" id="start"><div class="title-content"><p class="kicker">Now reading</p><h1>' +
    escapeHtml(name) + '</h1><p class="byline">' + sentences.length + ' moments of attention</p><p class="start-prompt">Scroll to begin <span>↓</span></p></div></section>' +
    sentences.map(pageMarkup).join('') +
    '<section class="page ending-page"><div class="title-content"><p class="kicker">End of this reading</p><h2>Keep the<br>quiet.</h2><button class="read-again" type="button">Read again ↑</button></div></section>';
  setupReader();
  closeLibrary();
  document.querySelector('#start').scrollIntoView();
}
function setupReader() {
  if (observer) observer.disconnect();
  pages = [...document.querySelectorAll('.page')];
  observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle('is-active', entry.isIntersecting)), { threshold: 0.58 });
  pages.forEach((page) => observer.observe(page));
  document.querySelector('.read-again')?.addEventListener('click', goToStart);
  updateProgress();
}
function goToStart() { document.querySelector('#start').scrollIntoView({ behavior: 'smooth' }); }
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressFill.style.width = Math.min(100, (window.scrollY / max) * 100) + '%';
}
async function readPdf(file) {
  status.textContent = 'Loading PDF reader…';
  const pdfjsLib = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
  const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
  const chunks = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    status.textContent = 'Reading page ' + n + ' of ' + pdf.numPages + '…';
    const page = await pdf.getPage(n);
    chunks.push((await page.getTextContent()).items.map((item) => item.str).join(' '));
  }
  return chunks.join('\n');
}
async function readEpub(file) {
  status.textContent = 'Loading EPUB reader…';
  const epubModule = await import('https://cdn.jsdelivr.net/npm/epubjs@0.3.93/+esm');
  const ePub = epubModule.default;
  status.textContent = 'Opening EPUB…';
  const book = ePub(await file.arrayBuffer());
  await book.ready;
  const chapters = await Promise.all(book.spine.spineItems.map(async (section) => {
    const doc = await section.load(book.load.bind(book));
    const text = doc.documentElement.textContent;
    section.unload();
    return text;
  }));
  return chapters.join('\n');
}
async function importFile(file) {
  status.textContent = 'Preparing ' + file.name + '…';
  try {
    const extension = file.name.split('.').pop().toLowerCase();
    const text = extension === 'pdf' ? await readPdf(file) : extension === 'epub' ? await readEpub(file) : await file.text();
    setBook(file.name.replace(/\.[^.]+$/, ''), text);
  } catch (error) {
    status.textContent = error.message || 'That file could not be opened.';
  }
}
document.querySelector('#open-library').addEventListener('click', () => {
  if (typeof library.showModal === 'function') library.showModal();
  else library.setAttribute('open', '');
});
document.querySelector('.close-dialog').addEventListener('click', closeLibrary);
fileInput.addEventListener('change', () => fileInput.files[0] && importFile(fileInput.files[0]));
document.querySelector('#read-paste').addEventListener('click', () => {
  const text = document.querySelector('#paste-text').value;
  if (text.trim()) setBook('Untitled passage', text);
});
window.addEventListener('scroll', updateProgress, { passive: true });
document.addEventListener('keydown', (event) => {
  if (library.open || !['ArrowDown', 'ArrowUp', ' '].includes(event.key)) return;
  event.preventDefault();
  const current = pages.findIndex((page) => page.getBoundingClientRect().top >= -window.innerHeight * .25);
  pages[Math.max(0, Math.min(pages.length - 1, current + (event.key === 'ArrowUp' ? -1 : 1)))].scrollIntoView({ behavior: 'smooth' });
});
setupReader();
