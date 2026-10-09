// The page script. index.html loads defuss-shadcn (df$) and the released defuss-i18n (df$.i18n) from jsDelivr first,
// pinned by Subresource Integrity, so this module only wires the page; serve the docs/ folder statically.
const query = globalThis.df$;
const { createI18n, bind, validateI18n, resolveLocale, localeChain } = query.i18n;
const locales = ['en', 'de'];

// Open in the visitor's language when the page has it; the static HTML stays English without JavaScript.
const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
const initial = preferred.map(tag => { try { return resolveLocale(locales, tag, []); } catch { return undefined; } }).find(Boolean) ?? 'en';
const locale = createI18n({ locale: initial, fallback: ['en'] });

// Live event log: every binding dispatches defuss-i18n:change after its writes. Renders run synchronously inside
// bind, setLocale and refresh, so one microtask later the batch is complete and becomes one line.
const log = document.getElementById('event-log');
let pending = [];
let logged = { revision: locale.snapshot.revision, booted: false };
const logLine = (text, tone) => {
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.textContent = text;
  pre.append(code);
  query(pre).attr('data-prefix', '›').attr('data-tone', tone);
  query(log).append(pre);
  while (log.children.length > 6) query(log.firstElementChild).remove();
};
const flush = () => {
  const roots = pending; pending = [];
  const { locale: tag, revision } = locale.snapshot;
  if (!logged.booted) logLine(`bind() · ${roots.length} components · ${tag}`, 'success');
  else if (revision !== logged.revision) logLine(`setLocale('${tag}') · revision ${revision} · ${roots.length} components morphed`, 'info');
  else logLine(`refresh() · #${roots.join(', #')}`, 'muted');
  logged = { revision, booted: true };
};
query(document).on('defuss-i18n:change', event => {
  pending.push(event.detail.root.id || event.detail.root.localName);
  if (pending.length === 1) queueMicrotask(flush);
});

const bindings = [];
const validated = root => {
  const errors = validateI18n(root, { locales });
  if (errors.length) throw Error(errors.map(error => error.message).join('\n'));
  return root;
};

// Components without application state: header, sections, cards, footer, dialog.
for (const root of document.querySelectorAll('[data-i18n-component]:not(#cart, #rendered, #stats)')) bindings.push(bind(validated(root), locale));

// Numbers as text: Intl formats them for the current locale (6.2 kB is dist/all.min.js gzip, 6202 bytes in 0.2.0).
const decimal = (value, snapshot) => new Intl.NumberFormat(snapshot.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
bindings.push(bind(validated(document.getElementById('stats')), locale, { values: (_, snapshot) => ({ gzip: decimal(6.2, snapshot) }) }));

// Plural templates: the count picks the CLDR category (one egg / two eggs, ein Ei / zwei Eier), Intl formats it.
let cart = Object.freeze({ count: 1 });
const cartBinding = bind(validated(document.getElementById('cart')), locale, {
  getState: () => cart,
  values: state => ({ count: state.count, label: locale.formatNumber(state.count) }),
});
bindings.push(cartBinding);
const setCount = count => { cart = Object.freeze({ count }); cartBinding.refresh(); };
query('#add-item').on('click', () => setCount(cart.count + 1));
query('#remove-item').on('click', () => setCount(Math.max(0, cart.count - 1)));

// Explicit state renderer: markup from render(), the checked property from application state.
const copy = { en: 'A controlled checkbox', de: 'Eine kontrollierte Checkbox' };
let settings = Object.freeze({ checked: true });
const rendered = bind(document.getElementById('rendered'), locale, {
  getState: () => settings,
  render: ({ locale }) => `<div class="flex items-center gap-2" key="row"><input class="checkbox" type="checkbox" id="controlled" key="checkbox"><label class="label" for="controlled" style="margin:0;" key="label">${copy[locale] ?? copy.en}</label></div>`,
  afterRender: ({ query, root, state }) => query(root.querySelector('input')).prop('checked', state.checked),
});
bindings.push(rendered);
query('#toggle-checked').on('click', () => { settings = Object.freeze({ checked: !settings.checked }); rendered.refresh(); });
query('#rendered').on('change', event => { settings = Object.freeze({ checked: event.target.checked }); });

// The controller owns the current locale; switchers, the snapshot, the markup cursor and <html lang dir> display it.
// VERIFIED: a single-select toggle group clears the pressed item on a second click, and toggle-group.js listens on the
// group element. The document listener always runs after it and rewrites every switcher from the snapshot.
const switchers = '#locale-switcher .toggle, #sheet-locale .toggle, #demo-locale .toggle, #settings-locale .toggle';
const showLocale = snapshot => {
  for (const toggle of document.querySelectorAll(switchers)) query(toggle).attr('aria-pressed', String(toggle.value === snapshot.locale));
  for (const tag of locales) query(`#code-line-${tag}`).attr('data-cursor', tag === snapshot.locale ? '' : null);
  query('#snapshot-locale').text(snapshot.locale);
  query('#snapshot-revision').text(String(snapshot.revision));
  query('#snapshot-direction').text(snapshot.direction);
  query('#snapshot-chain').text(localeChain(snapshot.locale, snapshot.fallback).join(' → '));
  query(document.documentElement).attr('lang', snapshot.locale).attr('dir', snapshot.direction);
};
query(document).on('click', event => {
  const toggle = event.target.closest(switchers);
  if (!toggle) return;
  locale.setLocale(toggle.value);
  showLocale(locale.snapshot);
});
const unsubscribe = locale.subscribe(showLocale);
showLocale(locale.snapshot);

// The markup diff plays when it renders; opening its tab again replays it (Code Mockup: set data-animate again).
const diff = document.getElementById('markup-diff');
query('#tab-i18n').on('click', () => { query(diff).attr('data-animate', null); void diff.offsetWidth; query(diff).attr('data-animate', ''); });

// Code blocks: copying the visible block is the one script the component leaves to the page.
const copied = { en: 'Copied', de: 'Kopiert' };
const timers = new Set();
query(document).on('click', async event => {
  const button = event.target.closest('.mk-code-block-copy');
  if (!button) return;
  const figure = button.closest('.mk-code-block');
  const pre = [...figure.querySelectorAll('pre')].find(element => element.checkVisibility());
  try { await navigator.clipboard.writeText(pre.innerText.trim()); } catch { return; }
  const status = figure.querySelector('.mk-code-block-status');
  query(button).attr('data-copied', '');
  query(status).text(copied[locale.locale] ?? copied.en);
  const timer = setTimeout(() => { timers.delete(timer); query(button).attr('data-copied', null); query(status).text(''); }, 1500);
  timers.add(timer);
});

// The coding-agent prompt: copy its lines in the current language; the prompt column and the send hint stay out.
query('#copy-prompt').on('click', async () => {
  const lines = [...document.querySelectorAll('#agent-prompt > pre:not([data-tone])')].map(pre => pre.textContent.trim());
  try { await navigator.clipboard.writeText(lines.join('\n')); } catch { return; }
  const button = document.getElementById('copy-prompt');
  query(button).attr('data-variant', 'default');
  query('#copy-prompt-status').text(copied[locale.locale] ?? copied.en);
  const timer = setTimeout(() => { timers.delete(timer); query(button).attr('data-variant', 'secondary'); query('#copy-prompt-status').text(''); }, 1500);
  timers.add(timer);
});

// Follow later OS colour-scheme changes; the inline <head> script set the first one before paint.
const dark = matchMedia('(prefers-color-scheme: dark)');
const followScheme = event => query(document.documentElement).toggleClass('dark', event.matches).css('color-scheme', event.matches ? 'dark' : 'light');
dark.addEventListener('change', followScheme);

// Explicit lifecycle cleanup. No global observer, singleton locale or hidden registration.
addEventListener('pagehide', () => {
  dark.removeEventListener('change', followScheme);
  timers.forEach(clearTimeout);
  unsubscribe();
  bindings.forEach(binding => binding.dispose());
  locale.dispose();
}, { once: true });
