import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync } from 'node:zlib';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const stats = JSON.parse(await readFile('dist/stats.json', 'utf8'));
assert.equal(stats.version, pkg.version);
const manifest = JSON.parse(await readFile('dist/build-manifest.json', 'utf8'));
for (const [path, expected] of Object.entries(manifest)) {
  assert.equal(createHash('sha256').update(await readFile(path)).digest('hex'), expected, `${path} changed after build; run bun run build`);
}
for (const [name, expected] of Object.entries(stats.files)) {
  const bytes = await readFile(`dist/${name}`);
  assert.deepEqual({ bytes: bytes.length, gzip: gzipSync(bytes).length, brotli: brotliCompressSync(bytes).length }, expected);
  const text = bytes.toString();
  assert(!/from\s*["']defuss-(query|morph)["']/.test(text), `${name} imports an external module`);
  assert(!/function morphDomDirect|class DfQuery/.test(text), `${name} embeds a peer engine`);
  assert(text.includes(`v${pkg.version}`), `${name} has stale version metadata`);
  assert(expected.gzip <= 16000 && expected.bytes <= 120000, `${name} exceeds release budget`);
  const map = JSON.parse(await readFile(`dist/${name}.map`, 'utf8'));
  assert.equal(map.version, 3); assert(map.sources.length > 0 && map.sourcesContent.length > 0);
}
for (const path of ['dist/index.js', 'dist/index.d.ts', 'dist/core.js', 'dist/core.d.ts', 'dist/index.cjs', 'dist/index.d.cts', 'dist/core.cjs', 'dist/core.d.cts', 'dist/global.d.ts', 'README.md', 'ARCH.md', 'LICENSE', 'documentation/i18n.mdx', 'documentation/component-skill.md', 'examples/index.html']) await readFile(path);
// VERIFIED: the demo runs on released files from jsDelivr (human decision 2026-10-08). An exact version keeps it
// reproducible; a tag such as @latest or a range would change what it runs without a commit.
for (const path of ['examples/index.html', 'examples/demo.js']) {
  const text = await readFile(path, 'utf8');
  assert(!/(?:\.\.\/|["'`]\/)(?:node_modules|dist)\//.test(text), `${path} loads a local build; the demo uses released files from jsDelivr`);
  for (const [url] of text.matchAll(/https:\/\/cdn\.jsdelivr\.net\/[^"'`\s)]+/g)) assert.match(url, /@\d+\.\d+\.\d+\//, `${path}: ${url} must pin an exact version`);
}
const version = (await readFile('src/locale.ts', 'utf8')).match(/I18N_VERSION = '([^']+)'/)[1];
assert.equal(version, pkg.version);
console.log('Verified source freshness, version agreement, browser budgets, maps, peer exclusion, pinned demo runtime and release artifacts.');
