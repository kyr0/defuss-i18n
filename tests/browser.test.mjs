import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, writeFile, mkdir, stat, rm } from 'node:fs/promises';
import { chromium } from 'playwright';
import { serve } from '../scripts/serve.mjs';
const reportDir = process.env.I18N_REPORT_DIR ?? 'test-results';

async function launch() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) return chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  try { await access(chromium.executablePath()); return chromium.launch(); }
  catch {
    if (process.platform !== 'linux' || process.arch !== 'x64') throw Error(`No Playwright Chromium at ${chromium.executablePath()}; the Sparticuz fallback is Linux x64 only. Run npx playwright install chromium or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH.`);
    const fallback = (await import('@sparticuz/chromium')).default;
    // Some hosted runtimes seed an empty path; Sparticuz otherwise treats it as a cache hit.
    try { if ((await stat('/tmp/chromium')).size === 0) await rm('/tmp/chromium'); } catch {}
    const executablePath = await fallback.executablePath();
    const bytes = await readFile(executablePath);
    assert(bytes.length > 1000000, 'Chromium fallback is not a valid executable');
    return chromium.launch({ executablePath, args: fallback.args.filter(arg => !['--single-process', '--disable-web-security', '--allow-running-insecure-content'].includes(arg)), headless: true });
  }
}

test('shipped browser artifacts and side-effect-free DOM adapter', async t => {
  const server = await serve(undefined, 0);
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try { browser = await launch(); }
  catch (error) { await new Promise(resolve => server.close(resolve)); throw error; }
  const report = { browser: browser.version(), modes: {} };
  try {
    for (const mode of ['all.js', 'all.min.js', 'global.min.js', 'core']) {
      await t.test(mode, async () => {
        const page = await browser.newPage();
        await page.goto(`${base}/tests/fixture.html`);
        await page.evaluate(async () => {
          await import('/node_modules/defuss-morph/dist/all.min.js');
          await import('/node_modules/defuss-query/dist/all.min.js');
        });
        if (mode === 'global.min.js') await page.addScriptTag({ url: `${base}/dist/${mode}` });
        else await page.evaluate(async mode => {
          if (mode === 'core') {
            const core = await import('/dist/core.js');
            window.api = { ...core, ...core.createDomI18n(window.df$) };
          } else await import(`/dist/${mode}`);
        }, mode);
        if (mode !== 'core') await page.evaluate(() => { window.api = window.df$.i18n; });
        const results = await page.evaluate(async () => (await import('/tests/browser-suite.js')).run(window.api, window.df$));
        report.modes[mode] = results;
        for (const result of results) assert.equal(result.error, undefined, `${mode}: ${result.name}\n${result.error}`);
        console.log(`${mode}: ${results.length} browser scenarios passed`);
        await page.close();
      });
    }
    await t.test('missing runtime gives an actionable load-order error', async () => {
      const page = await browser.newPage(); await page.goto(`${base}/tests/fixture.html`);
      const error = await page.evaluate(async () => { try { await import('/dist/all.js'); } catch (error) { return error.message; } });
      assert.match(error, /load defuss-shadcn core.js/); await page.close();
    });
    await t.test('interactive shipped demo', async () => {
      const page = await browser.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/examples/`);
      await page.waitForFunction(() => window.demoReady === true);
      await page.locator('header [data-demo-locale="de"]').click();
      assert.equal(await page.locator('#welcome-heading').textContent(), 'Willkommen');
      await page.locator('#open-settings').click();
      await page.locator('#nickname').fill('preserved state');
      await page.locator('#settings [data-demo-locale="en"]').click();
      assert.equal(await page.locator('#nickname').inputValue(), 'preserved state');
      assert(await page.locator('#settings').evaluate(element => element.open));
      await page.locator('#settings-close').click();
      await page.locator('#add-item').click();
      assert.match(await page.locator('#cart-copy').textContent(), /2 items/);
      await mkdir(reportDir, { recursive: true });
      await page.screenshot({ path: `${reportDir}/demo.png`, fullPage: true });
      assert.deepEqual(errors, []); await page.close();
    });
  } finally {
    await mkdir(reportDir, { recursive: true }); await writeFile(`${reportDir}/browser-report.json`, JSON.stringify(report, null, 2) + '\n');
    await browser.close(); await new Promise(resolve => server.close(resolve));
  }
});
