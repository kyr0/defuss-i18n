// Builds docs/index.html from site/page.html and site/translations.json. Every translated sentence lives in the JSON,
// once per locale; the build writes the English text as the visible default AND as the en <template>, so the two
// cannot drift apart (the page must read correctly before JavaScript runs). Edit site/, then run `bun run site`.
// VERIFIED: scripts/verify.mjs fails when docs/index.html no longer matches what this script builds (a hand-edited page fails).
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const LOCALES = ['en', 'de'];
const GH = 'https://github.com/kyr0/defuss-i18n';
const DOC = `${GH}/blob/main/documentation`;
const LINKEDIN = 'https://www.linkedin.com/in/aronhomberg/';

const svg = (paths, size = 24) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
// Lucide icon shapes (ISC), inlined so the page needs no icon script.
const ICONS = {
  languages: '<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>',
  plug: '<path d="M12 22v-5"/><path d="M15 8V2"/><path d="M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z"/><path d="M9 8V2"/>',
  'file-code': '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/><path d="M10 12.5 8 15l2 2.5"/><path d="m14 12.5 2 2.5-2 2.5"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
  tags: '<path d="M13.172 2a2 2 0 0 1 1.414.586l6.71 6.71a2.4 2.4 0 0 1 0 3.408l-4.592 4.592a2.4 2.4 0 0 1-3.408 0l-6.71-6.71A2 2 0 0 1 6 9.172V3a1 1 0 0 1 1-1z"/><path d="M2 7v6.172a2 2 0 0 0 .586 1.414l6.71 6.71a2.4 2.4 0 0 0 3.191.193"/><circle cx="10.5" cy="6.5" r=".5" fill="currentColor"/>',
  'list-checks': '<path d="M13 5h8"/><path d="M13 12h8"/><path d="M13 19h8"/><path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/>',
  download: '<path d="M12 15V3"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  menu: '<path d="M4 5h16"/><path d="M4 12h16"/><path d="M4 19h16"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  settings: '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>',
  'arrow-down': '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  github: '<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/>',
};
const LINKEDIN_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>';

const switcher = (id, size = 'sm', extra = '') => `<div class="toggle-group${extra ? ` ${extra}` : ''}" role="group" id="${id}" data-type="single" data-variant="outline" data-size="${size}" {{attr:aria-label:language}}>
          <button class="toggle" aria-pressed="true" value="en" lang="en">English</button>
          <button class="toggle" aria-pressed="false" value="de" lang="de">Deutsch</button>
        </div>`;

// ---- code: the hero's markup diff (Code Mockup lines) and the install code blocks -----------------------------
const esc = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const mock = lines => lines.map(([kind, text, id]) => {
  const body = esc(text).replaceAll('&lt;ins&gt;', '<ins>').replaceAll('&lt;/ins&gt;', '</ins>').replaceAll('&lt;del&gt;', '<del>').replaceAll('&lt;/del&gt;', '</del>');
  return `<pre${kind ? ` data-diff="${kind}"` : ''}${id ? ` id="${id}"` : ''}><code>${body}</code></pre>`;
}).join('\n            ');
const PLAIN = [
  ['', '<section id="welcome">'],
  ['', '  <h1>Translate the page.</h1>'],
  ['', '  <button aria-label="Close">×</button>'],
  ['', '</section>'],
];
const DIFF = [
  ['remove', '<section id="welcome">'],
  ['add', '<section id="welcome" <ins>data-i18n-component</ins>>'],
  ['remove', '  <h1>Translate the page.</h1>'],
  ['add', '  <h1 <ins>data-i18n-target="title"</ins>>Translate the page.</h1>'],
  ['add', '  <template data-i18n-for="title" data-i18n-locale="en">Translate the page.</template>', 'code-line-en'],
  ['add', '  <template data-i18n-for="title" data-i18n-locale="de">Seite übersetzen.</template>', 'code-line-de'],
  ['remove', '  <button aria-label="Close">×</button>'],
  ['add', '  <button aria-label="Close" <ins>data-i18n-aria-label-de="Schließen"</ins>>×</button>'],
  ['', '</section>'],
];
const hlHtml = line => esc(line)
  .replace(/(&lt;!--.*?--&gt;)/g, '<span class="mk-code-block-c">$1</span>')
  .replace(/("[^"]*")/g, '<span class="mk-code-block-s">$1</span>')
  .replace(/(&lt;\/?[a-z][\w-]*|\/?&gt;)/g, '<span class="mk-code-block-k">$1</span>');
const hlJs = line => {
  const text = esc(line);
  // VERIFIED: splitting at the first // coloured 'https://…' as a comment; a comment starts only after whitespace or line start.
  const at = text.search(/(?:^|\s)\/\//);
  const [code, comment] = at < 0 ? [text, ''] : [text.slice(0, at), `${text.slice(at).match(/^\s*/)[0]}<span class="mk-code-block-c">${text.slice(at).trimStart()}</span>`];
  return code.replace(/('[^']*')/g, '<span class="mk-code-block-s">$1</span>')
    .replace(/\b(const|await|import|from|for|of)\b/g, '<span class="mk-code-block-k">$1</span>') + comment;
};
const code = (lines, highlight) => `<code>${lines.map(line => `<span>${line ? highlight(line) : ' '}</span>`).join('')}</code>`;
const mixed = lines => code(lines, line => (line.trim().startsWith('<') ? hlHtml : hlJs)(line));
const INSTALL_CDN = [
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/defuss-shadcn@0.9.8/dist/components/core.min.css">',
  '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/defuss-shadcn@0.9.8/dist/components/all.min.css">',
  '<script type="module" src="https://cdn.jsdelivr.net/npm/defuss-shadcn@0.9.8/dist/components/all.min.js"></script>',
  '<script type="module" src="https://cdn.jsdelivr.net/npm/defuss-i18n@0.1.0/dist/all.min.js"></script>',
  '<script type="module">',
  "  const locale = df$.i18n.createI18n({ locale: 'en', fallback: ['en'] });",
  "  for (const root of document.querySelectorAll('[data-i18n-component]')) df$.i18n.bind(root, locale);",
  "  locale.setLocale('de'); // every bound component now shows German",
  '</script>',
];
const INSTALL_NPM = [
  "import { createI18n, bindI18n } from 'defuss-i18n';",
  '',
  "const locale = createI18n({ locale: 'de-DE', fallback: ['en'] });",
  "const welcome = bindI18n(document.getElementById('welcome'), locale);",
  'welcome.dispose(); // when the component leaves the page',
];
const INSTALL_PEERS = [
  '<script type="module">',
  "  await import('https://cdn.jsdelivr.net/npm/defuss-morph@0.1.1/dist/all.min.js');",
  "  await import('https://cdn.jsdelivr.net/npm/defuss-query@0.1.0/dist/all.min.js');",
  "  await import('https://cdn.jsdelivr.net/npm/defuss-i18n@0.1.0/dist/all.min.js');",
  '</script>',
];

// ---- expansion ---------------------------------------------------------------------------------------------
const escAttr = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
function expandComponent(id, body, translations) {
  const table = translations.components[id] ?? {};
  const value = key => { if (!table[key]) throw Error(`site/translations.json: ${id}.${key} is missing`); return table[key]; };
  const used = [];
  body = body.replace(/\{\{attr:([a-z-]+):([\w-]+)\}\}/g, (_, name, key) =>
    `${name}="${escAttr(value(key).en)}" ` + LOCALES.map(locale => `data-i18n-${name}-${locale}="${escAttr(value(key)[locale])}"`).join(' '));
  body = body.replace(/\{\{([\w-]+)\}\}/g, (match, key) => { if (key === 'templates') return match; used.push(key); return value(key).en; });
  const lines = used.flatMap(key => LOCALES.map(locale => `<template data-i18n-for="${key}" data-i18n-locale="${locale}">${value(key)[locale]}</template>`));
  for (const row of translations.plurals[id] ?? []) lines.push(`<template data-i18n-for="${row.for}" data-i18n-locale="${row.locale}"${row.plural ? ` data-i18n-plural="${row.plural}"` : ''}>${row.html}</template>`);
  const block = lines.length ? `<div hidden>\n${lines.map(line => `          ${line}\n`).join('')}        </div>` : '';
  return body.replace('{{templates}}', block);
}
// Components are marked <!--c:id--> … <!--/c:id--> in site/page.html; innermost first, so a nested card keeps its own table.
const INNER = /[ \t]*<!--c:([\w-]+)-->\n?((?:(?!<!--c:)[\s\S])*?)[ \t]*<!--\/c:\1-->\n?/;

export async function buildSite() {
  let page = await readFile(new URL('site/page.html', root), 'utf8');
  const translations = JSON.parse(await readFile(new URL('site/translations.json', root), 'utf8'));
  const subs = {
    '%ICON_LANG%': svg(ICONS.languages), '%ICON_MENU%': svg(ICONS.menu, 20), '%ICON_X%': svg(ICONS.x, 15),
    '%ICON_COPY%': svg(ICONS.copy, 16), '%ICON_MINUS%': svg(ICONS.minus, 16), '%ICON_PLUS%': svg(ICONS.plus, 16),
    '%ICON_SETTINGS%': svg(ICONS.settings, 16), '%ICON_ARROW_DOWN%': svg(ICONS['arrow-down'], 16), '%ICON_GITHUB%': svg(ICONS.github, 18),
    '%ICON_FILE_CODE_16%': svg(ICONS['file-code'], 16), '%ICON_LINKEDIN%': LINKEDIN_ICON,
    '%SW_HEADER%': switcher('locale-switcher', 'sm', 'mk-header-wide'), '%SW_SHEET%': switcher('sheet-locale'),
    '%SW_DEMO%': switcher('demo-locale'), '%SW_SETTINGS%': switcher('settings-locale'),
    '%MOCK_PLAIN%': mock(PLAIN), '%MOCK_DIFF%': mock(DIFF),
    '%CODE_CDN%': mixed(INSTALL_CDN), '%CODE_NPM%': code(INSTALL_NPM, hlJs), '%CODE_PEERS%': mixed(INSTALL_PEERS),
    '%GH%': GH, '%DOC%': DOC, '%LINKEDIN%': LINKEDIN,
  };
  for (const name of ['plug', 'file-code', 'shield-check', 'globe', 'tags', 'list-checks', 'download', 'lock']) subs[`%ICON_${name.toUpperCase().replaceAll('-', '_')}%`] = svg(ICONS[name]);
  for (const [key, value] of Object.entries(subs).sort((a, b) => b[0].length - a[0].length)) page = page.replaceAll(key, value);
  for (let match; (match = INNER.exec(page));) page = page.slice(0, match.index) + expandComponent(match[1], match[2], translations) + page.slice(match.index + match[0].length);
  const left = page.match(/\{\{[^}]*\}\}|%[A-Z][A-Z_0-9]*%/g);
  if (left) throw Error(`site/page.html: unexpanded ${[...new Set(left)].join(', ')}`);
  return page;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = await buildSite();
  await writeFile(new URL('docs/index.html', root), html);
  console.log(`docs/index.html: ${html.length} characters`);
}
