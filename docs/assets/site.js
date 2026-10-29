const input = document.getElementById('search');
const results = document.getElementById('search-results');
const navigation = document.querySelector('.mobile-navigation');
const mobileQuery = globalThis.matchMedia('(max-width: 720px)');
const updateNavigation = () => { navigation.open = !mobileQuery.matches; };
mobileQuery.addEventListener('change', updateNavigation);
updateNavigation();
const normalize = (text) => text.toLocaleLowerCase('ru').replaceAll('ё', 'е');
input.addEventListener('input', () => {
  const query = normalize(input.value.trim());
  results.replaceChildren();
  results.hidden = !query;
  if (!query) return;
  const entries = globalThis.docsSearchIndex.filter((entry) => normalize(entry.title + ' ' + entry.page + ' ' + entry.text).includes(query)).slice(0, 14);
  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'search-empty';
    empty.textContent = 'Ничего не найдено. Попробуйте название метода, например payment.';
    results.append(empty);
  }
  for (const entry of entries) {
    const link = document.createElement('a');
    link.className = 'search-result'; link.href = entry.href;
    const title = document.createElement('strong'); title.textContent = entry.title;
    const page = document.createElement('span'); page.textContent = entry.page;
    link.append(title, page); results.append(link);
  }
});
input.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { results.hidden = true; input.blur(); }
  if (event.key === 'ArrowDown' || event.key === 'Enter') {
    const first = results.querySelector('a');
    if (first) { event.preventDefault(); event.key === 'Enter' ? first.click() : first.focus(); }
  }
});
document.addEventListener('click', (event) => { if (!event.target.closest('.search-box')) results.hidden = true; });
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) { event.preventDefault(); input.focus(); }
});
for (const block of document.querySelectorAll('pre')) {
  const code = block.querySelector('code');
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'copy-code'; button.textContent = 'Копировать';
  button.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = 'Скопировано';
    } catch {
      const range = document.createRange(); range.selectNodeContents(code);
      const selection = globalThis.getSelection(); selection.removeAllRanges(); selection.addRange(range);
      button.textContent = 'Нажмите Ctrl+C';
    }
    setTimeout(() => { button.textContent = 'Копировать'; }, 2500);
  });
  block.prepend(button);
}
if ('IntersectionObserver' in globalThis) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) {
      for (const link of document.querySelectorAll('.toc-link')) link.classList.toggle('active', decodeURIComponent(link.hash.slice(1)) === entry.target.id);
    }
  }, { rootMargin: '-100px 0px -65% 0px' });
  for (const heading of document.querySelectorAll('h2,h3')) observer.observe(heading);
}
document.getElementById('print-doc').addEventListener('click', () => globalThis.print());
