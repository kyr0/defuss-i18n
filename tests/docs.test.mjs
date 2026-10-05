import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const read = path => readFile(path, 'utf8');
const sources = Object.fromEntries(await Promise.all((await readdir('src')).map(async name => [name, await read(`src/${name}`)])));
const api = await read('documentation/api.md');
const errors = await read('documentation/errors.md');
const pages = ['README.md', 'ARCH.md', ...(await readdir('documentation')).map(name => `documentation/${name}`)].filter(path => /\.mdx?$/.test(path));

test('API reference names every runtime and type export', async () => {
  const names = new Set([...Object.keys(await import('../dist/index.js')), 'installGlobal', 'i18n']);
  for (const source of Object.values(sources)) for (const [, name] of source.matchAll(/export (?:interface|type|function|const) (\w+)/g)) names.add(name);
  const missing = [...names].filter(name => !new RegExp(`\\b${name}\\b`).test(api));
  assert.deepEqual(missing, [], 'document these exports in documentation/api.md');
});
test('errors reference explains every diagnostic code and thrown message', () => {
  const codes = new Set(Object.values(sources).flatMap(source => [...source.matchAll(/report\('([A-Z_]+)'/g)].map(match => match[1])));
  assert(codes.size > 20);
  assert.deepEqual([...codes].filter(code => !errors.includes(`\`${code}\``)), [], 'document these codes in documentation/errors.md');
  // Message text up to its first interpolation, e.g. "plural count" from `plural count ${key} must…`.
  const stems = Object.values(sources).flatMap(source => [...source.matchAll(/[`']defuss-i18n: ([^`'$\\]+)/g)].map(match => match[1].trim()));
  assert(stems.length > 25);
  assert.deepEqual([...new Set(stems)].filter(stem => !errors.includes(stem)), [], 'document these messages in documentation/errors.md');
});
test('relative documentation links and anchors resolve', async () => {
  const slug = heading => heading.toLowerCase().replace(/[`*]/g, '').replace(/[^\w\- ]/g, '').trim().replace(/ /g, '-');
  const broken = [];
  for (const page of pages) {
    for (const [, target] of (await read(page)).matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^[a-z]+:/i.test(target)) continue;
      const [file, anchor] = target.split('#');
      const path = file ? join(dirname(page), file) : page;
      try { await access(path); } catch { broken.push(`${page} → ${target}`); continue; }
      if (anchor && /\.mdx?$/.test(path)) {
        const headings = [...(await read(path)).matchAll(/^#+ (.+)$/gm)].map(match => slug(match[1]));
        if (!headings.includes(anchor)) broken.push(`${page} → ${target}`);
      }
    }
  }
  assert.deepEqual(broken, []);
});
test('documentation index lists every documentation page', async () => {
  const index = await read('documentation/index.md');
  const unlisted = (await readdir('documentation')).filter(name => name !== 'index.md' && !index.includes(`](${name})`));
  assert.deepEqual(unlisted, [], 'link these pages from documentation/index.md');
});
