import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rename, symlink, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const root = process.cwd();
const temporary = await mkdtemp(join(tmpdir(), 'defuss-i18n-consumer-'));
try {
  const packed = JSON.parse(execFileSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', temporary], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))[0];
  const paths = packed.files.map(file => file.path);
  for (const required of ['dist/index.js', 'dist/cjs/index.js', 'dist/core.d.ts', 'dist/global.min.js', 'src/locale.ts', 'documentation/i18n.mdx', 'documentation/api.md', 'documentation/errors.md', 'examples/index.html']) assert(paths.includes(required), `${required} missing from npm pack`);
  for (const path of paths) assert(!/^(node_modules|tests|test-results|coverage|scripts)\//.test(path), `Unexpected dev file ${path}`);
  const consumer = join(temporary, 'consumer'); await mkdir(join(consumer, 'node_modules'), { recursive: true });
  execFileSync('tar', ['-xzf', join(temporary, packed.filename), '-C', temporary]);
  await rename(join(temporary, 'package'), join(consumer, 'node_modules/defuss-i18n'));
  await writeFile(join(consumer, 'package.json'), '{"private":true,"type":"module"}\n');
  // Core must work with no peers available in the consumer.
  execFileSync(process.execPath, ['--input-type=module', '-e', "import { createI18n } from 'defuss-i18n/core'; if (createI18n().locale !== 'en') throw Error('core');"], { cwd: consumer });
  execFileSync(process.execPath, ['-e', "const { createI18n } = require('defuss-i18n/core'); if (createI18n().locale !== 'en') throw Error('core');"], { cwd: consumer });
  for (const peer of ['defuss-query', 'defuss-morph']) await symlink(resolve(root, `node_modules/${peer}`), join(consumer, `node_modules/${peer}`), 'dir');
  const guard = "Object.defineProperty(globalThis, 'document', { get() { throw Error('import-time document access'); } }); Object.defineProperty(globalThis, 'df$', { get() { throw Error('import-time global access'); }, set() { throw Error('import-time global write'); } });";
  execFileSync(process.execPath, ['--input-type=module', '-e', `${guard} const api = await import('defuss-i18n'); if (typeof api.bindI18n !== 'function') throw Error('ESM');`], { cwd: consumer });
  execFileSync(process.execPath, ['-e', `${guard} const api = require('defuss-i18n'); if (typeof api.bindI18n !== 'function') throw Error('CJS');`], { cwd: consumer });
  const source = `import { createI18n, bindI18n } from 'defuss-i18n';
import { createDomI18n } from 'defuss-i18n/core';
import type { WithI18n } from 'defuss-i18n/global';
import df$ from 'defuss-query';
const i = createI18n({ locale: 'de' });
const root = {} as HTMLElement;
bindI18n(root, i, { getState: () => ({ count: 2 }), values: s => ({ count: s.count }), render: ({ state }) => String(state.count) });
createDomI18n(df$);
const runtime = df$ as WithI18n<typeof df$>;
runtime.i18n.createI18n();
// @ts-expect-error invalid primitive interpolation
bindI18n(root, i, { values: { nested: {} } });
// @ts-expect-error asynchronous renderers are unsupported
bindI18n(root, i, { render: async () => 'x' });
`;
  for (const extension of ['mts', 'cts']) await writeFile(join(consumer, `consumer.${extension}`), source);
  await writeFile(join(consumer, 'tsconfig.json'), JSON.stringify({ compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true, noEmit: true, esModuleInterop: true, lib: ['ES2022', 'DOM', 'DOM.Iterable'], skipLibCheck: false }, include: ['consumer.mts', 'consumer.cts'] }));
  execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', join(consumer, 'tsconfig.json')], { cwd: consumer, stdio: 'inherit' });
  const stats = JSON.parse(await readFile(join(consumer, 'node_modules/defuss-i18n/dist/stats.json'), 'utf8'));
  assert.equal(stats.version, packed.version);
  console.log(`Packed consumer verification passed: ${paths.length} files; peer-free core, ESM/CJS root, guarded imports and strict .mts/.cts consumers.`);
} finally { await rm(temporary, { recursive: true, force: true }); }
