import df$ from 'defuss-query';
import { createDomI18n } from './dom.js';
import type { QueryRuntime } from './types.js';
export * from './core.js';
/** Lazy injection: importing the library touches no global/document and binds nothing. */
export const bindI18n: ReturnType<typeof createDomI18n>['bind'] = (...args) => createDomI18n(df$ as QueryRuntime).bind(...args);
export const mountI18n: ReturnType<typeof createDomI18n>['mount'] = (...args) => createDomI18n(df$ as QueryRuntime).mount(...args);
