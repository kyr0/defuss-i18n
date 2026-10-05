import * as core from './core.js';
import type { QueryRuntime } from './types.js';
export * from './core.js';
export function installGlobal(runtime: QueryRuntime & { i18n?: BrowserI18n }): BrowserI18n {
  if (runtime.i18n) {
    if (runtime.i18n.version !== core.I18N_VERSION) throw new Error('defuss-i18n: another version is already installed');
    return runtime.i18n;
  }
  const dom = core.createDomI18n(runtime);
  const api = Object.freeze({ ...core, ...dom, bindI18n: dom.bind, mountI18n: dom.mount, version: core.I18N_VERSION });
  runtime.i18n = api;
  return api;
}
export type BrowserI18n = typeof core & ReturnType<typeof core.createDomI18n> & {
  bindI18n: ReturnType<typeof core.createDomI18n>['bind'];
  mountI18n: ReturnType<typeof core.createDomI18n>['mount'];
  readonly version: string;
};
const runtime = (globalThis as typeof globalThis & { df$?: QueryRuntime & { i18n?: BrowserI18n } }).df$;
if (!runtime) throw new Error('defuss-i18n: load defuss-shadcn core.js or defuss-morph + defuss-query first');
export const i18n = installGlobal(runtime);
export const bindI18n = i18n.bind;
export const mountI18n = i18n.mount;
