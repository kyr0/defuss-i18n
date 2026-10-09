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
    // The project site in docs/ loads defuss-shadcn and the released defuss-i18n from jsDelivr, pinned by Subresource
    // Integrity. "published" runs it as visitors get it; "checkout" serves this build's dist/all.min.js for the
    // defuss-i18n URL and drops that one integrity attribute, so the site also checks unreleased code.
    const siteSource = await readFile('docs/index.html', 'utf8');
    const i18nUrl = siteSource.match(/https:\/\/cdn\.jsdelivr\.net\/npm\/defuss-i18n@([^/]+)\/dist\/all\.min\.js/);
    assert(i18nUrl, 'docs/index.html no longer loads defuss-i18n from jsDelivr');
    const { version } = JSON.parse(await readFile('package.json', 'utf8'));
    const site = `${base}/docs/`;
    const switchers = ['locale-switcher', 'sheet-locale', 'demo-locale', 'settings-locale'];
    const watch = page => {
      const problems = [];
      page.on('pageerror', error => problems.push(`page error: ${error.message}`));
      page.on('console', message => { if (message.type() === 'error') problems.push(`console error: ${message.text()}`); });
      page.on('requestfailed', request => problems.push(`request failed: ${request.url()} (${request.failure()?.errorText})`));
      page.on('response', response => { if (response.status() >= 400) problems.push(`HTTP ${response.status()}: ${response.url()}`); });
      return problems;
    };
    const ready = (page, problems) => page.waitForFunction(() => /\d/.test(document.getElementById('snapshot-revision')?.textContent ?? ''), null, { timeout: 30000 })
      .catch(error => { throw Error(`site did not start (it needs cdn.jsdelivr.net): ${problems.join('; ') || error.message}`); });
    const pressed = (page, id) => page.locator(`#${id} .toggle[aria-pressed="true"]`).evaluateAll(toggles => toggles.map(toggle => toggle.value));
    const text = (page, selector) => page.locator(selector).textContent();
    report.site = {};
    for (const pass of ['published', 'checkout']) await t.test(`project site (${pass})`, async () => {
      const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 900 } });
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: base });
      const page = await context.newPage(); const problems = watch(page);
      let routed = 0; let stripped = false;
      if (pass === 'checkout') {
        await page.route(i18nUrl[0], route => { routed++; return route.fulfill({ path: fileURLToPath(new URL('../dist/all.min.js', import.meta.url)), contentType: 'text/javascript', headers: { 'access-control-allow-origin': '*' } }); });
        await page.route(site, async route => {
          const response = await route.fetch();
          const body = (await response.text()).replace(/(src="https:\/\/cdn\.jsdelivr\.net\/npm\/defuss-i18n@[^"]+") integrity="[^"]+"/, (_, src) => { stripped = true; return src; });
          return route.fulfill({ response, body });
        });
      }
      await page.goto(site);
      await ready(page, problems);
      const loaded = await page.evaluate(() => window.df$.i18n.version);
      assert.equal(loaded, pass === 'published' ? i18nUrl[1] : version);
      assert.deepEqual([routed, stripped], pass === 'checkout' ? [1, true] : [0, false], 'the checkout pass must load dist/all.min.js');
      report.site[pass] = { i18n: loaded };
      const heading = await page.$('#welcome-heading'); const nickname = await page.$('#nickname');
      const lastLog = () => page.locator('#event-log pre').last().textContent();
      assert.match(await lastLog(), /^bind\(\) · \d+ components · en$/);
      assert.equal(await page.locator('#code-line-en').getAttribute('data-cursor'), '', 'the cursor marks the live template line');

      await page.locator('#locale-switcher .toggle[value="de"]').click();
      assert.equal(await text(page, '#welcome-heading'), 'Seite übersetzen. State bleibt erhalten.');
      assert(await heading.evaluate(element => element === document.getElementById('welcome-heading')), 'the heading keeps its identity');
      assert.deepEqual([await page.locator('#code-line-de').getAttribute('data-cursor'), await page.locator('#code-line-en').getAttribute('data-cursor')], ['', null]);
      assert.match(await lastLog(), /^setLocale\('de'\) · revision 1 · \d+ components morphed$/);
      assert.match(await page.locator('#attributes-card img').getAttribute('src'), /assets\/welcome-de\.svg$/);
      assert.equal(await page.locator('#attributes-card img').getAttribute('alt'), 'Hallo in einer Sprechblase');
      assert.equal(await page.locator('#add-item').getAttribute('aria-label'), 'Ein Ei hinzufügen');
      assert.equal(await text(page, '#cart-copy'), '1 Ei');
      await page.locator('#add-item').click();
      assert.equal(await text(page, '#cart-copy'), '2 Eier', 'German plural: Ei becomes Eier');
      assert.equal(await lastLog(), 'refresh() · #cart');
      assert.equal(await text(page, '#stats [data-i18n-target="gzip"]'), '6,2 kB', 'Intl formats the stat for de');
      assert.deepEqual([await text(page, '#snapshot-locale'), await text(page, '#snapshot-chain')], ['de', 'de → en']);
      for (const id of switchers) assert.deepEqual(await pressed(page, id), ['de'], `${id} follows the locale`);
      assert.equal(await page.locator('html').getAttribute('lang'), 'de');
      // A single-select toggle group clears the pressed item on a second click; the site keeps the current locale pressed.
      await page.locator('#locale-switcher .toggle[value="de"]').click();
      assert.deepEqual(await pressed(page, 'locale-switcher'), ['de']);

      // Hero markup tabs: plain HTML, then the defuss-i18n diff again (its animation replays).
      assert.equal(await text(page, '#tab-plain'), 'Standard-HTML');
      await page.locator('#tab-plain').click();
      assert.deepEqual([await page.locator('#panel-plain').isVisible(), await page.locator('#panel-i18n').isVisible()], [true, false]);
      await page.locator('#tab-i18n').click();
      assert.deepEqual([await page.locator('#panel-i18n').isVisible(), await page.locator('#markup-diff').getAttribute('data-animate')], [true, '']);

      // Install tabs (the Tabs component) and copying the visible code block.
      assert.equal(await text(page, '#tab-shadcn'), 'Mit defuss-shadcn');
      await page.locator('#tab-npm').click();
      assert.deepEqual([await page.locator('#panel-npm').isVisible(), await page.locator('#panel-shadcn').isVisible()], [true, false]);
      await page.locator('#panel-npm .mk-code-block[data-variant="inline"] .mk-code-block-copy').click();
      await page.waitForFunction(() => document.querySelector('#panel-npm .mk-code-block[data-variant="inline"] .mk-code-block-status').textContent === 'Kopiert');
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'bun add defuss-i18n defuss-query@^0.1.0 defuss-morph@^0.1.1');

      // Vibe coding: the agent prompt copies in the current language; the defuss-vae tabs switch.
      await page.locator('#copy-prompt').click();
      await page.waitForFunction(() => document.getElementById('copy-prompt-status').textContent === 'Kopiert');
      const prompt = await page.evaluate(() => navigator.clipboard.readText());
      assert.match(prompt, /^Integriere defuss-i18n in diese App: https:\/\/github\.com\/kyr0\/defuss-i18n\n/);
      assert.equal(prompt.split('\n').length, 4, 'four prompt lines, without the send hint');
      await page.locator('#tab-claude').click();
      assert.deepEqual([await page.locator('#panel-claude').isVisible(), await page.locator('#panel-skills').isVisible()], [true, false]);
      assert.equal(await text(page, '#consult-title'), 'Gestresst von inkonsistenten Ergebnissen und ermüdenden Reviews?');
      assert.deepEqual(await page.locator('#consult a').evaluateAll(links => links.map(link => link.getAttribute('href'))),
        ['https://github.com/kyr0/defuss-vae', 'https://vae.defuss.org/', 'https://www.linkedin.com/in/aronhomberg/']);

      // Footer: linked copyright line and the consulting column.
      assert.deepEqual(await page.locator('#site-footer .mk-footer-copy a').evaluateAll(links => links.map(link => link.getAttribute('href'))),
        ['https://www.linkedin.com/in/aronhomberg/', 'https://github.com/kyr0/defuss-i18n/blob/main/LICENSE', 'https://shadcn.defuss.org/']);
      assert.equal(await text(page, '#site-footer .site-ad .btn'), 'Auf LinkedIn vernetzen');
      assert.equal(await page.locator('#site-footer .site-ad img').getAttribute('alt'), 'Porträt von Aron Homberg');

      await page.locator('#open-settings').click();
      assert(await page.locator('#settings').evaluate(element => element.open));
      await page.locator('#nickname').fill('preserved state');
      await page.locator('#settings-locale .toggle[value="en"]').click();
      assert.equal(await text(page, '#settings-title'), 'Your settings');
      assert.equal(await page.locator('#nickname').inputValue(), 'preserved state');
      assert(await nickname.evaluate(element => element === document.getElementById('nickname')), 'the input keeps its identity');
      assert(await page.locator('#settings').evaluate(element => element.open), 'the modal stays open across a switch');
      assert.deepEqual(await pressed(page, 'locale-switcher'), ['en']);
      await page.locator('#settings-close').click();
      assert(!(await page.locator('#settings').evaluate(element => element.open)));

      assert.equal(await text(page, '#cart-copy'), '2 eggs');
      await page.locator('#add-item').click();
      assert.equal(await text(page, '#cart-copy'), '3 eggs');
      await page.locator('#remove-item').click();
      await page.locator('#remove-item').click();
      assert.equal(await text(page, '#cart-copy'), '1 egg');
      await page.locator('#controlled').uncheck();
      await page.screenshot({ path: `${reportDir}/site-${pass}-en.png`, fullPage: true });
      await page.locator('#demo-locale .toggle[value="de"]').click();
      assert.equal(await text(page, 'label[for="controlled"]'), 'Eine kontrollierte Checkbox');
      assert.equal(await page.locator('#controlled').isChecked(), false, 'the renderer keeps application state across a switch');
      await page.locator('#toggle-checked').click();
      assert.equal(await page.locator('#controlled').isChecked(), true);
      await page.screenshot({ path: `${reportDir}/site-${pass}-de.png`, fullPage: true });
      assert.deepEqual(problems, []); await context.close();
    });
    await t.test('project site opens in the visitor’s language', async () => {
      const context = await browser.newContext({ locale: 'de-DE' }); const page = await context.newPage(); const problems = watch(page);
      await page.goto(site); await ready(page, problems);
      assert.deepEqual([await text(page, '#welcome-heading'), await text(page, '#snapshot-locale'), await page.locator('html').getAttribute('lang')], ['Seite übersetzen. State bleibt erhalten.', 'de', 'de']);
      assert.deepEqual(problems, []); await context.close();
    });
    await t.test('project site without JavaScript shows the English templates', async () => {
      const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
      await page.goto(site);
      // Every visible default must equal its en template, or the page would change on load and read wrong without script.
      const drift = await page.evaluate(() => [...document.querySelectorAll('[data-i18n-target]')].flatMap(target => {
        const root = target.closest('[data-i18n-component]'); const key = target.getAttribute('data-i18n-target');
        const template = [...root.querySelectorAll(`template[data-i18n-for="${key}"][data-i18n-locale="en"]`)].find(element => element.closest('[data-i18n-component]') === root);
        if (!template) return [`${root.id}/${key}: no en template`];
        if (template.content.querySelector('[data-i18n-value]')) return [];
        const normal = value => value.replace(/\s+/g, ' ').trim();
        return normal(target.innerHTML) === normal(template.innerHTML) ? [] : [`${root.id}/${key}`];
      }));
      assert.deepEqual(drift, []);
      assert.equal(await text(page, '#welcome-heading'), 'Translate the page. Keep its state.');
      await context.close();
    });
    await t.test('project site on a phone', async () => {
      const context = await browser.newContext({ locale: 'en-US', viewport: { width: 375, height: 760 } }); const page = await context.newPage(); const problems = watch(page);
      await page.goto(site); await ready(page, problems);
      assert.deepEqual([await page.locator('#locale-switcher').isVisible(), await page.locator('.mk-header-menu').isVisible()], [false, true]);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 375, 'no sideways scrolling');
      await page.locator('.mk-header-menu').click();
      assert(await page.locator('#site-menu').evaluate(element => element.open));
      await page.locator('#sheet-locale .toggle[value="de"]').click();
      assert.equal(await text(page, '#site-menu a[href="#demo"]'), 'Live-Demo');
      await page.locator('#site-menu a[href="#demo"]').click();
      await page.waitForFunction(() => !document.getElementById('site-menu').open);
      assert.equal(await page.locator('html').getAttribute('lang'), 'de');
      await page.screenshot({ path: `${reportDir}/site-phone-de.png` });
      assert.deepEqual(problems, []); await context.close();
    });
  } finally {
    await mkdir(reportDir, { recursive: true }); await writeFile(`${reportDir}/browser-report.json`, JSON.stringify(report, null, 2) + '\n');
    await browser.close(); await new Promise(resolve => server.close(resolve));
  }
});
