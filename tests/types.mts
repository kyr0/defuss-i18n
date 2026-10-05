import { createI18n, bindI18n, createDomI18n, type Values } from '../src/index.js';
import df$ from 'defuss-query';
const i18n = createI18n({ locale: 'de-DE', fallback: ['en'], direction: () => 'ltr' });
const values: Values = { name: 'Aron', count: 2, available: true };
const element = {} as HTMLElement;
bindI18n(element, i18n, { values });
const binding = createDomI18n(df$).bind(element, i18n, {
  getState: () => ({ checked: false }),
  render: ({ state }) => `<input type="checkbox" key="check" ${state.checked ? 'checked' : ''}>`,
  afterRender: ({ query, root, state }) => query(root.querySelector('input')!).prop('checked', state.checked),
});
binding.context?.state.checked satisfies boolean | undefined;
// @ts-expect-error invalid direction
createI18n({ direction: () => 'up' });
// @ts-expect-error interpolation must remain primitive
bindI18n(element, i18n, { values: { object: {} } });
// @ts-expect-error a renderer must return HTML synchronously
bindI18n(element, i18n, { render: async () => '<p>Hello</p>' });
// @ts-expect-error wrong state property
binding.context?.state.missing;
