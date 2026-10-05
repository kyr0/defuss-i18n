import test from 'node:test';
import assert from 'node:assert/strict';
import { createI18n, canonicalLocale, localeChain, resolveLocale, localeDirection, parseTranslationAttribute, chooseAttribute, TRANSLATABLE_ATTRIBUTES } from '../dist/core.js';

test('SSR root/core imports have no DOM or global side effects', async () => {
  const before = globalThis.df$;
  const root = await import('../dist/index.js');
  assert.equal(typeof root.bindI18n, 'function'); assert.equal(globalThis.df$, before);
  assert.equal(globalThis.document, undefined);
});
test('canonical BCP 47 tags and invalid inputs', () => {
  assert.equal(canonicalLocale('DE-de'), 'de-DE'); assert.equal(canonicalLocale('zh-hant-tw'), 'zh-Hant-TW');
  for (const invalid of ['', ' ', 'de_DE', 'de--DE']) assert.throws(() => canonicalLocale(invalid), RangeError);
  assert.throws(() => canonicalLocale(null), RangeError);
});
test('fallback strips extensions before region/script parents and deduplicates', () => {
  assert.deepEqual(localeChain('zh-Hant-TW-u-nu-hanidec', ['zh-Hant', 'en-US', 'en']), ['zh-Hant-TW-u-nu-hanidec', 'zh-Hant-TW', 'zh-Hant', 'zh', 'en-US', 'en']);
  assert.deepEqual(localeChain('de-DE'), ['de-DE', 'de', 'en']);
});
test('resolution is canonical and deterministic', () => {
  assert.equal(resolveLocale(['EN', 'DE'], 'de-AT'), 'de');
  assert.equal(resolveLocale(['en'], 'fr-CA'), 'en');
  assert.equal(resolveLocale(['de'], 'fr', []), undefined);
});
test('direction honors script and explicit overrides', () => {
  assert.equal(localeDirection('ar'), 'rtl'); assert.equal(localeDirection('he'), 'rtl');
  assert.equal(localeDirection('az-Arab'), 'rtl'); assert.equal(localeDirection('ar-Latn'), 'ltr');
  assert.equal(localeDirection('de'), 'ltr');
  assert.equal(localeDirection('und-Phnx'), 'rtl');
  const custom = createI18n({ locale: 'ar', direction: () => 'ltr' });
  assert.equal(custom.snapshot.direction, 'ltr'); assert.equal(custom.directionFor(), 'ltr'); assert.equal(custom.directionFor('he'), 'ltr');
  assert.throws(() => createI18n({ direction: () => 'invalid' }), TypeError);
});
test('direction has a script-based fallback on engines without textInfo', () => {
  const method = Object.getOwnPropertyDescriptor(Intl.Locale.prototype, 'getTextInfo');
  const getter = Object.getOwnPropertyDescriptor(Intl.Locale.prototype, 'textInfo');
  try {
    Object.defineProperty(Intl.Locale.prototype, 'getTextInfo', { value: undefined, configurable: true });
    Object.defineProperty(Intl.Locale.prototype, 'textInfo', { value: undefined, configurable: true });
    assert.equal(localeDirection('ar'), 'rtl'); assert.equal(localeDirection('und-Phnx'), 'rtl'); assert.equal(localeDirection('de'), 'ltr');
  } finally {
    if (method) Object.defineProperty(Intl.Locale.prototype, 'getTextInfo', method); else delete Intl.Locale.prototype.getTextInfo;
    if (getter) Object.defineProperty(Intl.Locale.prototype, 'textInfo', getter); else delete Intl.Locale.prototype.textInfo;
  }
});
test('snapshots and fallback lists are immutable', () => {
  const i = createI18n({ fallback: ['EN', 'en', 'de'] });
  assert.deepEqual(i.snapshot.fallback, ['en', 'de']);
  assert(Object.isFrozen(i.snapshot)); assert(Object.isFrozen(i.snapshot.fallback));
  assert.throws(() => { i.snapshot.locale = 'de'; }, TypeError);
});
test('setLocale canonical no-op and refresh revision', () => {
  const i = createI18n(); const first = i.snapshot; let changes = 0;
  i.subscribe(() => changes++);
  assert.equal(i.setLocale('EN'), first); assert.equal(changes, 0);
  i.setLocale('de'); assert.equal(i.locale, 'de'); assert.equal(i.snapshot.revision, 1);
  i.refresh(); assert.equal(i.snapshot.revision, 2); assert.equal(changes, 2);
});
test('render phase completes before observers, immediate subscribe and cleanup', () => {
  const i = createI18n(); const calls = [];
  const listener = s => calls.push(`notify:${s.locale}`);
  const off = i.subscribe(listener, { immediate: true });
  i.subscribe(s => calls.push(`render:${s.locale}`), { phase: 'render' });
  assert.throws(() => i.subscribe(listener), /already/);
  i.setLocale('de'); off(); off(); i.setLocale('fr');
  assert.deepEqual(calls, ['notify:en', 'render:de', 'notify:de', 'render:fr']);
});
test('failed immediate subscription does not remain registered', () => {
  const i = createI18n(); let calls = 0; const listener = () => { calls++; throw Error('bad'); };
  assert.throws(() => i.subscribe(listener, { immediate: true }), /bad/);
  i.setLocale('de'); assert.equal(calls, 1);
});
test('subscriber failures are aggregated after every subscriber receives committed state', () => {
  const i = createI18n(); const observed = [];
  i.subscribe(() => { throw Error('render failed'); }, { phase: 'render' });
  i.subscribe(s => observed.push(s.locale));
  assert.throws(() => i.setLocale('de'), error => error instanceof AggregateError && error.errors[0].message === 'render failed');
  assert.equal(i.locale, 'de'); assert.deepEqual(observed, ['de']);
});
test('unsubscribe during notification skips the removed listener', () => {
  const i = createI18n(); let calls = 0; let off;
  i.subscribe(() => off()); off = i.subscribe(() => calls++); i.setLocale('de'); assert.equal(calls, 0);
});
test('reentrant changes fail explicitly without overwriting the committed locale', () => {
  const i = createI18n(); i.subscribe(() => i.setLocale('fr'));
  assert.throws(() => i.setLocale('de'), AggregateError); assert.equal(i.locale, 'de');
});
test('instance isolation', () => {
  const a = createI18n(); const b = createI18n({ locale: 'de' }); a.setLocale('fr'); assert.equal(b.locale, 'de');
});
test('Intl formats match native Intl including bigint and plural categories', () => {
  const i = createI18n({ locale: 'de-DE' });
  assert.equal(i.formatNumber(1234.5), new Intl.NumberFormat('de-DE').format(1234.5));
  assert.equal(i.formatNumber(123456789123456789n), new Intl.NumberFormat('de-DE').format(123456789123456789n));
  const opts = { timeZone: 'UTC', dateStyle: 'medium' };
  assert.equal(i.formatDate(new Date('2026-01-02T00:00:00Z'), opts), new Intl.DateTimeFormat('de-DE', opts).format(new Date('2026-01-02T00:00:00Z')));
  assert.equal(i.plural(1), 'one'); assert.equal(i.plural(2), 'other');
  i.setLocale('ru'); assert.equal(i.plural(2), 'few'); assert.equal(i.plural(5), 'many');
});
test('instance fallback resolution accepts explicit requested locale', () => {
  const i = createI18n({ locale: 'de', fallback: 'fr' });
  assert.equal(i.resolveLocale(['fr']), 'fr'); assert.equal(i.resolveLocale(['en'], 'en-GB'), 'en');
});
test('lazy loading stages then commits and force-refreshes a same locale', async () => {
  const i = createI18n(); const calls = [];
  i.subscribe(s => calls.push(s.locale));
  const result = await i.loadLocale('EN', async (tag, signal) => { assert.equal(tag, 'en'); assert(!signal.aborted); return 7; }, value => calls.push(value));
  assert.equal(result.status, 'applied'); assert.deepEqual(calls, [7, 'en']); assert.equal(i.snapshot.revision, 1);
});
test('latest lazy request wins even when an aborted loader ignores its signal', async () => {
  const i = createI18n(); let finish; let oldSignal; const commits = [];
  const slow = i.loadLocale('de', async (_, signal) => { oldSignal = signal; return new Promise(resolve => { finish = resolve; }); }, value => commits.push(value));
  const fast = await i.loadLocale('fr', async () => 'fresh', value => commits.push(value));
  finish('stale'); assert.equal((await slow).status, 'superseded'); assert.equal(fast.status, 'applied');
  assert(oldSignal.aborted); assert.deepEqual(commits, ['fresh']); assert.equal(i.locale, 'fr');
});
test('synchronous setLocale, including a no-op, invalidates pending load', async () => {
  const i = createI18n(); let finish;
  const pending = i.loadLocale('de', () => new Promise(resolve => { finish = resolve; }));
  i.setLocale('en'); finish(); assert.equal((await pending).status, 'superseded'); assert.equal(i.locale, 'en');
});
test('refresh invalidates pending load', async () => {
  const i = createI18n(); let finish; const pending = i.loadLocale('de', () => new Promise(resolve => { finish = resolve; }));
  i.refresh(); finish(); assert.equal((await pending).status, 'superseded');
});
test('current load failures propagate; stale failures are suppressed', async () => {
  const i = createI18n(); await assert.rejects(i.loadLocale('de', async () => { throw Error('network'); }), /network/); assert.equal(i.locale, 'en');
  let reject; const stale = i.loadLocale('de', () => new Promise((_, r) => { reject = r; }));
  i.setLocale('fr'); reject(Error('aborted')); assert.equal((await stale).status, 'superseded');
});
test('a commit can supersede its request', async () => {
  const i = createI18n(); const result = await i.loadLocale('de', async () => 1, () => i.setLocale('fr'));
  assert.equal(result.status, 'superseded'); assert.equal(i.locale, 'fr');
});
test('commit errors do not publish a locale', async () => {
  const i = createI18n(); await assert.rejects(i.loadLocale('de', async () => 1, () => { throw Error('commit'); }), /commit/); assert.equal(i.locale, 'en');
});
test('async commits are rejected instead of silently publishing early', async () => {
  const i = createI18n(); await assert.rejects(i.loadLocale('de', async () => 1, async () => {}), /synchronous/); assert.equal(i.locale, 'en');
});
test('dispose cancels pending work and rejects new operations', async () => {
  const i = createI18n(); let finish;
  const pending = i.loadLocale('de', () => new Promise(resolve => { finish = resolve; }));
  i.dispose(); i.dispose(); finish(); assert.equal((await pending).status, 'superseded'); assert(i.disposed);
  assert.throws(() => i.setLocale('de'), /disposed/); assert.throws(() => i.refresh(), /disposed/);
  assert.throws(() => i.subscribe(() => {}), /disposed/);
  await assert.rejects(i.loadLocale('de', async () => {}), /disposed/);
});
test('attribute parser handles hyphenated ARIA and script-region locales', () => {
  assert.deepEqual(parseTranslationAttribute('data-i18n-aria-label-zh-hant-tw'), { attribute: 'aria-label', locale: 'zh-Hant-TW' });
  assert.deepEqual(parseTranslationAttribute('data-i18n-src-en'), { attribute: 'src', locale: 'en' });
  assert.equal(parseTranslationAttribute('aria-label'), undefined);
  assert.equal(parseTranslationAttribute('data-i18n-aria-expanded-de'), undefined);
  assert.throws(() => parseTranslationAttribute('data-i18n-title-de_de'), RangeError);
  assert(Object.isFrozen(TRANSLATABLE_ATTRIBUTES));
});
test('attribute fallback preserves an explicitly empty translation', () => {
  const variants = new Map([['en', 'Title'], ['de', '']]);
  assert.equal(chooseAttribute(variants, 'de-AT', ['en']), '');
  assert.equal(chooseAttribute(variants, 'fr', ['en']), 'Title');
  assert.equal(chooseAttribute(variants, 'fr', []), undefined);
});
