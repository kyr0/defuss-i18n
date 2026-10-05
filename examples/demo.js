// Run npm ci and npm run serve. All three runtime scripts are local and pinned by the lockfile.
await import('../node_modules/defuss-morph/dist/all.min.js');
await import('../node_modules/defuss-query/dist/all.min.js');
await import('../dist/all.js');
const query = globalThis.df$;
const { createI18n, bind, validateI18n } = query.i18n;
const locale = createI18n({ locale: 'en', fallback: ['en'] });
const bindings = [];
for (const root of document.querySelectorAll('[data-i18n-component]:not(#cart)')) {
  const errors = validateI18n(root, { locales: ['en', 'de', 'ar'] });
  if (errors.length) throw Error(errors.map(error => error.message).join('\n'));
  bindings.push(bind(root, locale));
}
let cartState = Object.freeze({ count: 1 });
const cart = bind(document.getElementById('cart'), locale, { getState: () => cartState, values: state => state });
bindings.push(cart);
document.getElementById('add-item').addEventListener('click', () => { cartState = Object.freeze({ count: cartState.count + 1 }); cart.refresh(); });
document.getElementById('remove-item').addEventListener('click', () => { cartState = Object.freeze({ count: Math.max(0, cartState.count - 1) }); cart.refresh(); });
document.querySelectorAll('[data-demo-locale]').forEach(button => button.addEventListener('click', () => locale.setLocale(button.dataset.demoLocale)));
const dialog = document.getElementById('settings');
document.getElementById('open-settings').addEventListener('click', () => dialog.showModal());
document.getElementById('settings-close').addEventListener('click', () => dialog.close());
let state = Object.freeze({ checked: true });
const rendered = bind(document.getElementById('rendered'), locale, {
  getState: () => state,
  render: ({ locale }) => {
    const copy = { en: 'A controlled checkbox', de: 'Eine kontrollierte Checkbox', ar: 'مربع اختيار تتحكم فيه الحالة' };
    return `<label key="label"><input key="checkbox" type="checkbox"> ${copy[locale] ?? copy.en}</label>`;
  },
  afterRender: ({ query, root, state }) => query(root.querySelector('input')).prop('checked', state.checked),
});
bindings.push(rendered);
document.getElementById('toggle-checked').addEventListener('click', () => { state = Object.freeze({ checked: !state.checked }); rendered.refresh(); });
document.getElementById('rendered').addEventListener('change', event => { state = Object.freeze({ checked: event.target.checked }); });
locale.subscribe(snapshot => {
  query(document.getElementById('locale-status')).text(`Locale: ${snapshot.locale} · revision ${snapshot.revision} · ${snapshot.direction}`);
  query(document.documentElement).attr('lang', snapshot.locale).attr('dir', snapshot.direction);
});
// Explicit lifecycle cleanup. No global observer, singleton locale or hidden registration.
window.addEventListener('pagehide', () => { bindings.forEach(binding => binding.dispose()); locale.dispose(); }, { once: true });
window.demoReady = true;
