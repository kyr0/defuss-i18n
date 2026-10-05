import type { BrowserI18n } from './all.js';
export type { BrowserI18n } from './all.js';
export interface I18nGlobalRuntime { readonly i18n: BrowserI18n }
/** Use this intersection without declaring or overwriting defuss-query's df$ ambient type. */
export type WithI18n<T> = T & I18nGlobalRuntime;
