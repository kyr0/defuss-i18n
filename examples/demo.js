// Every runtime file comes from jsDelivr at an exact release, so the demo shows what users install and needs no build;
// the browser test swaps in this checkout's dist/all.min.js to cover unreleased code. Serve this folder statically.
// VERIFIED: order matters - defuss-shadcn installs the df$ runtime (defuss-query + defuss-morph), defuss-i18n then
// adds df$.i18n and throws when df$ is missing.
const SHADCN_URL = 'https://cdn.jsdelivr.net/gh/kyr0/defuss-shadcn@0.9.7/dist/components/all.min.js';
const I18N_URL = 'https://cdn.jsdelivr.net/npm/defuss-i18n@0.1.0/dist/all.min.js';
await import(SHADCN_URL);
await import(I18N_URL);

const query = globalThis.df$;
const { createI18n, bind, validateI18n } = query.i18n;
const locales = ['en', 'de', 'ar'];
const locale = createI18n({ locale: 'en', fallback: ['en'] });
const bindings = [];
const validated = root => {
  const errors = validateI18n(root, { locales });
  if (errors.length) throw Error(errors.map(error => error.message).join('\n'));
  return root;
};

// Components without application state: header, hero, cards, footer, dialog.
for (const root of document.querySelectorAll('[data-i18n-component]:not(#cart, #rendered)')) bindings.push(bind(validated(root), locale));

// Plural templates: the count picks the CLDR category, the label is formatted by native Intl for the current locale.
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
const copy = { en: 'A controlled checkbox', de: 'Eine kontrollierte Checkbox', ar: 'مربع اختيار تتحكم فيه الحالة' };
let settings = Object.freeze({ checked: true });
const rendered = bind(document.getElementById('rendered'), locale, {
  getState: () => settings,
  render: ({ locale }) => `<div class="flex items-center gap-2" key="row"><input class="checkbox" type="checkbox" id="controlled" key="checkbox"><label class="label" for="controlled" style="margin:0;" key="label">${copy[locale] ?? copy.en}</label></div>`,
  afterRender: ({ query, root, state }) => query(root.querySelector('input')).prop('checked', state.checked),
});
bindings.push(rendered);
query('#toggle-checked').on('click', () => { settings = Object.freeze({ checked: !settings.checked }); rendered.refresh(); });
query('#rendered').on('change', event => { settings = Object.freeze({ checked: event.target.checked }); });

// The controller owns the current locale; the switchers only display it. VERIFIED: a single-select toggle group clears
// the pressed item on a second click, and toggle-group.js listens on the group element. A document listener always runs
// after it and rewrites both switchers from the snapshot; a listener on each button would race the group's handler.
const showLocale = snapshot => {
  for (const toggle of document.querySelectorAll('#locale-switcher .toggle, #settings-locale .toggle')) query(toggle).attr('aria-pressed', String(toggle.value === snapshot.locale));
  query('#locale-status').text(`Locale: ${snapshot.locale} · revision ${snapshot.revision} · ${snapshot.direction}`);
  query(document.documentElement).attr('lang', snapshot.locale).attr('dir', snapshot.direction);
};
query(document).on('click', event => {
  const toggle = event.target.closest('#locale-switcher .toggle, #settings-locale .toggle');
  if (!toggle) return;
  locale.setLocale(toggle.value);
  showLocale(locale.snapshot);
});
const unsubscribe = locale.subscribe(showLocale);
showLocale(locale.snapshot);

// Follow later OS colour-scheme changes; the inline <head> script set the first one before paint.
const dark = matchMedia('(prefers-color-scheme: dark)');
const followScheme = event => query(document.documentElement).toggleClass('dark', event.matches).css('color-scheme', event.matches ? 'dark' : 'light');
dark.addEventListener('change', followScheme);

// Explicit lifecycle cleanup. No global observer, singleton locale or hidden registration.
addEventListener('pagehide', () => {
  dark.removeEventListener('change', followScheme);
  unsubscribe();
  bindings.forEach(binding => binding.dispose());
  locale.dispose();
}, { once: true });
