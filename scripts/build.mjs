import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { build } from 'esbuild';
const root = new URL('../', import.meta.url);
process.chdir(root.pathname);
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
await rm('dist', { recursive: true, force: true });
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json'], { stdio: 'inherit' });
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.json', '--module', 'CommonJS', '--moduleResolution', 'Node', '--verbatimModuleSyntax', 'false', '--esModuleInterop', 'true', '--outDir', 'dist/cjs'], { stdio: 'inherit' });
await writeFile('dist/cjs/package.json', '{"type":"commonjs"}\n');
const banner = `/*! defuss-i18n v${pkg.version} | MIT | external runtime: defuss-query + defuss-morph */`;
for (const [name, format, minify] of [['all.js', 'esm', false], ['all.min.js', 'esm', true], ['global.min.js', 'iife', true]]) {
  await build({ entryPoints: ['src/all.ts'], outfile: `dist/${name}`, bundle: true, format, platform: 'browser', target: 'es2022', minify, sourcemap: true, banner: { js: banner }, legalComments: 'none' });
}
const stats = { version: pkg.version, files: {} };
for (const name of ['all.js', 'all.min.js', 'global.min.js']) {
  const bytes = await readFile(`dist/${name}`);
  stats.files[name] = { bytes: bytes.length, gzip: gzipSync(bytes).length, brotli: brotliCompressSync(bytes).length };
}
await writeFile('dist/stats.json', JSON.stringify(stats, null, 2) + '\n');
const inputs = ['package.json', 'tsconfig.json', 'scripts/build.mjs', ...(await readdir('src')).filter(name => name.endsWith('.ts')).map(name => `src/${name}`)];
const manifest = {};
for (const path of inputs) manifest[path] = createHash('sha256').update(await readFile(path)).digest('hex');
await writeFile('dist/build-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
await mkdir('test-results', { recursive: true });
console.log(`Built defuss-i18n ${pkg.version}; minified browser ESM: ${stats.files['all.min.js'].bytes} bytes / ${stats.files['all.min.js'].gzip} gzip bytes.`);
