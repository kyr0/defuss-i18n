import type * as core from './core.js';
import {
  I18N_CHANGE_EVENT, I18N_VERSION, PLURAL_CATEGORIES, TRANSLATABLE_ATTRIBUTES, assertValidI18n, canonicalLocale, chooseAttribute,
  createDomI18n, createI18n, localeChain, localeDirection, ownedElements, parseTranslationAttribute, resolveLocale, validateI18n,
} from './core.js';
import type { QueryRuntime } from './types.js';
export * from './core.js';
// VERIFIED: pkgroll's bundled declarations turn `typeof core` into invalid value aliases for its types (TS2693 in the packed consumer), so name the values.
// `satisfies` makes a core export missing from df$.i18n a compile error.
const coreValues = {
  I18N_CHANGE_EVENT, I18N_VERSION, PLURAL_CATEGORIES, TRANSLATABLE_ATTRIBUTES, assertValidI18n, canonicalLocale, chooseAttribute,
  createDomI18n, createI18n, localeChain, localeDirection, ownedElements, parseTranslationAttribute, resolveLocale, validateI18n,
} satisfies Record<keyof typeof core, unknown>;
function createBrowserApi(runtime: QueryRuntime) {
  const dom = createDomI18n(runtime);
  return Object.freeze({ ...coreValues, ...dom, bindI18n: dom.bind, mountI18n: dom.mount, version: I18N_VERSION as string });
}
/** The frozen `df$.i18n` namespace: every core value export plus the DOM API bound to the page's runtime. */
export type BrowserI18n = ReturnType<typeof createBrowserApi>;
export function installGlobal(runtime: QueryRuntime & { i18n?: BrowserI18n }): BrowserI18n {
  if (runtime.i18n) {
    if (runtime.i18n.version !== I18N_VERSION) throw new Error('defuss-i18n: another version is already installed');
    return runtime.i18n;
  }
  const api = createBrowserApi(runtime);
  runtime.i18n = api;
  return api;
}
const runtime = (globalThis as typeof globalThis & { df$?: QueryRuntime & { i18n?: BrowserI18n } }).df$;
if (!runtime) throw new Error('defuss-i18n: load defuss-shadcn core.js or defuss-morph + defuss-query first');
export const i18n = installGlobal(runtime);
export const bindI18n = i18n.bind;
export const mountI18n = i18n.mount;
