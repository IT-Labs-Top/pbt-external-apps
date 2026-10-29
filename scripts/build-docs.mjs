import { Marked } from 'marked';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
const pages = [
  { file: 'README.md', html: 'index.html', title: 'Обзор', label: 'Начало работы' },
  { file: 'API.md', html: 'api.html', title: 'Справочник SDK', label: 'Контракт и методы' },
  { file: 'COMPATIBILITY.md', html: 'compatibility.html', title: 'Совместимость', label: 'Версии и схемы' },
  { file: 'ROADMAP.md', html: 'roadmap.html', title: 'Этапы проекта', label: 'Состояние работы' },
  { file: 'CONTRIBUTING.md', html: 'contributing.html', title: 'Участие', label: 'Сборка и изменения' },
];
const escape = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const slug = (text) => text.toLowerCase().normalize('NFC').replace(/<[^>]*>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/g, '-');
const allEntries = [];
const rendered = [];
for (const page of pages) {
  const headings = [];
  const counts = new Map();
  const parser = new Marked({ gfm: true, renderer: {
    heading(token) {
      const text = token.tokens.map((part) => part.text ?? '').join('');
      const base = slug(text) || 'section';
      const count = counts.get(base) ?? 0;
      counts.set(base, count + 1);
      const id = base + (count ? '-' + count : '');
      headings.push({ title: text, id, depth: token.depth });
      return `<h${token.depth} id="${escape(id)}">${this.parser.parseInline(token.tokens)}<a class="anchor" href="#${escape(id)}" aria-label="Ссылка на раздел">#</a></h${token.depth}>\n`;
    },
    link(token) {
      let href = token.href;
      if (/^[a-z][a-z\d+.-]*:/i.test(href) && !/^(?:https?|mailto):/i.test(href)) return this.parser.parseInline(token.tokens);
      const match = pages.find((item) => href.split('#')[0] === item.file);
      if (match) href = match.html + (href.includes('#') ? '#' + href.split('#')[1] : '');
      return `<a href="${escape(href)}"${token.title ? ` title="${escape(token.title)}"` : ''}>${this.parser.parseInline(token.tokens)}</a>`;
    },
    html(token) { return escape(token.text); },
  } });
  const markdown = await readFile(path.join(docs, page.file), 'utf8');
  const content = parser.parse(markdown);
  const plain = markdown.replace(/```[\s\S]*?```/g, '').replace(/[#*`|]/g, '');
  for (const heading of headings) allEntries.push({ title: heading.title, page: page.title,
    href: page.html + '#' + heading.id, text: heading.depth === 1 ? plain.slice(0, 240) : '' });
  rendered.push({ ...page, headings, content });
}
for (const page of rendered) {
  const links = pages.map((item) => `<a class="nav-link${item.html === page.html ? ' current' : ''}" href="${item.html}"${item.html === page.html ? ' aria-current="page"' : ''}><strong>${item.title}</strong><span>${item.label}</span></a>`).join('');
  const toc = page.headings.filter((heading) => heading.depth === 2 || heading.depth === 3).map((heading) =>
    `<a class="toc-link depth-${heading.depth}" href="#${escape(heading.id)}">${escape(heading.title)}</a>`).join('');
  const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${escape(page.title)} — документация SDK внешних приложений фотобудки">
<meta name="theme-color" content="#12243a"><title>${escape(page.title)} · PBT Developers</title>
<link rel="stylesheet" href="assets/site.css"><script defer src="assets/search-index.js"></script><script defer src="assets/site.js"></script></head>
<body><a class="skip-link" href="#content">Перейти к содержимому</a>
<header class="topbar"><a class="brand" href="index.html"><span class="brand-mark" aria-hidden="true">P</span><span>PBT <small>Developers</small></span></a><span class="contract-badge">SDK 1 · 0.1.0</span>
<div class="search-box"><label class="sr-only" for="search">Поиск по документации</label><input id="search" type="search" placeholder="Найти метод или раздел…" autocomplete="off" aria-controls="search-results"><div id="search-results" class="search-results" hidden role="region" aria-label="Результаты поиска" aria-live="polite"></div></div></header>
<div class="layout"><aside class="sidebar"><details open class="mobile-navigation"><summary>Документация</summary><nav aria-label="Разделы">${links}</nav></details><div class="sidebar-note"><span class="status-dot"></span> Этап 1: контракт готов<p>Самостоятельная песочница — следующий этап.</p></div><a class="source-link" href="${page.file}">Исходный Markdown ↗</a></aside>
<main id="content" class="article"><div class="eyebrow">Внешние приложения / ${escape(page.label)}</div>${page.content}<footer><span>PBT · Контракт external-sdk-1</span><a href="${page.file}">Открыть .md</a><button type="button" id="print-doc">Печать / PDF</button></footer></main>
<aside class="toc" aria-label="На этой странице"><p>На этой странице</p>${toc}</aside></div></body></html>\n`;
  await writeFile(path.join(docs, page.html), html);
}
await mkdir(path.join(docs, 'assets'), { recursive: true });
await writeFile(path.join(docs, 'assets/search-index.js'), 'globalThis.docsSearchIndex = ' + JSON.stringify(allEntries).replaceAll('<', '\\u003c') + ';\n');
await writeFile(path.join(docs, '.nojekyll'), '');
process.stdout.write(`Built ${pages.length} HTML pages and ${allEntries.length} search entries from Markdown.\n`);
