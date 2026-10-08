import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, writeFile, mkdir, stat, rm } from 'node:fs/promises';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
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
    await mkdir(reportDir, { recursive: true });
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
    // The demo loads defuss-shadcn and the released defuss-i18n from jsDelivr. "published" runs it as visitors get it;
    // "checkout" serves this build's dist/all.min.js for the defuss-i18n URL, so the demo also checks unreleased code.
    const demoSource = await readFile('examples/demo.js', 'utf8');
    const i18nUrl = demoSource.match(/https:\/\/cdn\.jsdelivr\.net\/npm\/defuss-i18n@([^/]+)\/dist\/all\.min\.js/);
    assert(i18nUrl, 'examples/demo.js no longer loads defuss-i18n from jsDelivr');
    const { version } = JSON.parse(await readFile('package.json', 'utf8'));
    report.demo = {};
    for (const pass of ['published', 'checkout']) await t.test(`interactive shipped demo (${pass})`, async () => {
      const page = await browser.newPage(); const problems = [];
      page.on('pageerror', error => problems.push(`page error: ${error.message}`));
      page.on('console', message => { if (message.type() === 'error') problems.push(`console error: ${message.text()}`); });
      page.on('requestfailed', request => problems.push(`request failed: ${request.url()} (${request.failure()?.errorText})`));
      page.on('response', response => { if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`); });
      let routed = 0;
      if (pass === 'checkout') await page.route(i18nUrl[0], route => { routed++; return route.fulfill({ path: fileURLToPath(new URL('../dist/all.min.js', import.meta.url)), contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }); });
      await page.goto(`${base}/examples/`);
      await page.waitForFunction(() => document.getElementById('locale-status')?.textContent.includes('revision'), null, { timeout: 30000 })
        .catch(error => { throw Error(`demo did not start (it needs cdn.jsdelivr.net): ${problems.join('; ') || error.message}`); });
      const loaded = await page.evaluate(() => window.df$.i18n.version);
      assert.equal(loaded, pass === 'published' ? i18nUrl[1] : version);
      assert.equal(routed, pass === 'checkout' ? 1 : 0, 'the checkout pass must load dist/all.min.js');
      report.demo[pass] = { i18n: loaded };
      const pressed = selector => page.locator(`${selector} .toggle[aria-pressed="true"]`).evaluateAll(toggles => toggles.map(toggle => toggle.value));
      const heading = await page.$('#welcome-heading'); const nickname = await page.$('#nickname');

      await page.locator('#locale-switcher .toggle[value="de"]').click();
      assert.equal(await page.locator('#welcome-heading').textContent(), 'Willkommen');
      assert(await heading.evaluate(element => element === document.getElementById('welcome-heading')), 'the heading keeps its identity');
      assert.match(await page.locator('.mk-hero-media img').getAttribute('src'), /welcome-de\.svg$/);
      assert.equal(await page.locator('.mk-hero-media img').getAttribute('alt'), 'Hallo in einer Sprechblase');
      assert.equal(await page.locator('#add-item').getAttribute('aria-label'), 'Artikel hinzufügen');
      assert.equal(await page.locator('#cart-copy').textContent(), '1 Artikel');
      assert.deepEqual([await pressed('#locale-switcher'), await pressed('#settings-locale')], [['de'], ['de']]);
      assert.equal(await page.locator('html').getAttribute('lang'), 'de');
      // A single-select toggle group clears the pressed item on a second click; the demo keeps the current locale pressed.
      await page.locator('#locale-switcher .toggle[value="de"]').click();
      assert.deepEqual(await pressed('#locale-switcher'), ['de']);

      await page.locator('#open-settings').click();
      assert(await page.locator('#settings').evaluate(element => element.open));
      await page.locator('#nickname').fill('preserved state');
      await page.locator('#settings-locale .toggle[value="en"]').click();
      assert.equal(await page.locator('#settings-title').textContent(), 'Your settings');
      assert.equal(await page.locator('#nickname').inputValue(), 'preserved state');
      assert(await nickname.evaluate(element => element === document.getElementById('nickname')), 'the input keeps its identity');
      assert(await page.locator('#settings').evaluate(element => element.open), 'the modal stays open across a switch');
      assert.deepEqual(await pressed('#locale-switcher'), ['en']);
      await page.locator('#settings-close').click();
      assert(!(await page.locator('#settings').evaluate(element => element.open)));

      await page.locator('#add-item').click();
      await page.locator('#add-item').click();
      assert.equal(await page.locator('#cart-copy').textContent(), '3 items');
      await page.locator('#remove-item').click();
      assert.equal(await page.locator('#cart-copy').textContent(), '2 items');
      await page.locator('#controlled').uncheck();
      await page.screenshot({ path: `${reportDir}/demo-${pass}-en.png`, fullPage: true });
      await page.locator('#locale-switcher .toggle[value="ar"]').click();
      assert.deepEqual([await page.locator('html').getAttribute('lang'), await page.locator('html').getAttribute('dir')], ['ar', 'rtl']);
      assert.match(await page.locator('#cart-copy').textContent(), /عنصر$/);
      assert.equal(await page.locator('label[for="controlled"]').textContent(), 'مربع اختيار تتحكم فيه الحالة');
      assert.equal(await page.locator('#controlled').isChecked(), false, 'the renderer keeps application state across a switch');
      await page.locator('#toggle-checked').click();
      assert.equal(await page.locator('#controlled').isChecked(), true);
      await page.screenshot({ path: `${reportDir}/demo-${pass}-ar.png`, fullPage: true });
      assert.deepEqual(problems, []); await page.close();
    });
  } finally {
    await mkdir(reportDir, { recursive: true }); await writeFile(`${reportDir}/browser-report.json`, JSON.stringify(report, null, 2) + '\n');
    await browser.close(); await new Promise(resolve => server.close(resolve));
  }
});
