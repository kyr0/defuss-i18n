/** The DOM-free locale controller. No document reads, globals or peer imports. */
export const I18N_VERSION = '0.2.0';
export type Direction = 'ltr' | 'rtl';
export type Primitive = string | number | boolean;
export type Values = Readonly<Record<string, Primitive>>;
export interface LocaleSnapshot {
  readonly locale: string;
  readonly revision: number;
  readonly fallback: readonly string[];
  readonly direction: Direction;
}
export interface I18nOptions {
  locale?: string;
  fallback?: string | readonly string[];
  direction?: (locale: string) => Direction;
}
export interface SubscribeOptions { immediate?: boolean; phase?: 'render' | 'notify' }
export type LocaleListener = (snapshot: LocaleSnapshot) => void;
export interface LoadResult { readonly status: 'applied' | 'superseded'; readonly snapshot: LocaleSnapshot }
export interface I18n {
  readonly snapshot: LocaleSnapshot;
  readonly locale: string;
  readonly disposed: boolean;
  setLocale(locale: string): LocaleSnapshot;
  refresh(): LocaleSnapshot;
  subscribe(listener: LocaleListener, options?: SubscribeOptions): () => void;
  resolveLocale(available: Iterable<string>, requested?: string): string | undefined;
  directionFor(locale?: string): Direction;
  formatNumber(value: number | bigint, options?: Intl.NumberFormatOptions): string;
  formatDate(value: Date | number, options?: Intl.DateTimeFormatOptions): string;
  plural(value: number, options?: Intl.PluralRulesOptions): Intl.LDMLPluralRule;
  loadLocale<T>(locale: string, load: (locale: string, signal: AbortSignal) => Promise<T>, commit?: (data: T) => void): Promise<LoadResult>;
  dispose(): void;
}

export function canonicalLocale(locale: string): string {
  if (typeof locale !== 'string' || !locale.trim()) throw new RangeError('defuss-i18n: locale must be a non-empty BCP 47 tag');
  return Intl.getCanonicalLocales(locale)[0]!;
}

/** Strip extensions before walking region/script parents; retain requested tag first. */
export function localeChain(locale: string, fallback: readonly string[] = ['en']): string[] {
  const result: string[] = [];
  const add = (tag: string): void => {
    const canonical = canonicalLocale(tag);
    if (!result.includes(canonical)) result.push(canonical);
    const parts = new Intl.Locale(canonical).baseName.split('-');
    while (parts.length) {
      const candidate = parts.join('-');
      if (!result.includes(candidate)) result.push(candidate);
      parts.pop();
    }
  };
  add(locale);
  fallback.forEach(add);
  return result;
}

export function resolveLocale(available: Iterable<string>, locale: string, fallback: readonly string[] = ['en']): string | undefined {
  const tags = new Set(Array.from(available, canonicalLocale));
  return localeChain(locale, fallback).find(tag => tags.has(tag));
}

/** CLDR likely-subtag script resolution; an explicit script overrides the language. */
export function localeDirection(locale: string): Direction {
  const tag = new Intl.Locale(canonicalLocale(locale)) as Intl.Locale & {
    getTextInfo?: () => { direction: Direction };
    textInfo?: { direction: Direction };
  };
  const native = typeof tag.getTextInfo === 'function' ? tag.getTextInfo() : tag.textInfo;
  if (native) return native.direction;
  const rtlScripts = new Set(['Adlm', 'Arab', 'Armi', 'Avst', 'Elym', 'Hatr', 'Hebr', 'Hung', 'Khar', 'Lydi', 'Mand', 'Mani', 'Mend', 'Merc', 'Mero', 'Narb', 'Nbat', 'Nkoo', 'Orkh', 'Ougr', 'Palm', 'Phli', 'Phlp', 'Phnx', 'Prti', 'Rohg', 'Samr', 'Sarb', 'Sogd', 'Sogo', 'Syrc', 'Thaa', 'Yezi']);
  return rtlScripts.has(tag.maximize().script ?? '') ? 'rtl' : 'ltr';
}

export function createI18n(options: I18nOptions = {}): I18n {
  const fallback = Object.freeze(Array.from(new Set(
    (typeof options.fallback === 'string' ? [options.fallback] : options.fallback ?? ['en']).map(canonicalLocale),
  )));
  const direction = options.direction ?? localeDirection;
  const makeSnapshot = (locale: string, revision: number): LocaleSnapshot => {
    const dir = direction(locale);
    if (dir !== 'ltr' && dir !== 'rtl') throw new TypeError('defuss-i18n: direction must be ltr or rtl');
    return Object.freeze({ locale, revision, fallback, direction: dir });
  };
  let snapshot = makeSnapshot(canonicalLocale(options.locale ?? 'en'), 0);
  let disposed = false;
  let notifying = false;
  let request = 0;
  let pending: AbortController | undefined;
  const listeners = new Map<LocaleListener, 'render' | 'notify'>();
  const assertLive = (): void => { if (disposed) throw new Error('defuss-i18n: controller is disposed'); };
  const assertWritable = (): void => {
    assertLive();
    if (notifying) throw new Error('defuss-i18n: reentrant locale changes are unsupported; schedule a microtask');
  };
  const invalidateLoad = (): void => { request++; pending?.abort(); pending = undefined; };
  const publish = (locale: string, force = false): LocaleSnapshot => {
    if (!force && locale === snapshot.locale) return snapshot;
    const next = makeSnapshot(locale, snapshot.revision + 1);
    snapshot = next;
    notifying = true;
    const errors: unknown[] = [];
    const batch = Array.from(listeners);
    try {
      for (const phase of ['render', 'notify'] as const) {
        for (const [listener, registeredPhase] of batch) {
          if (registeredPhase !== phase || !listeners.has(listener)) continue;
          try { listener(next); } catch (error) { errors.push(error); }
        }
      }
    } finally { notifying = false; }
    if (errors.length) throw new AggregateError(errors, 'defuss-i18n: locale committed, but one or more subscribers failed');
    return next;
  };
  const api: I18n = {
    get snapshot() { return snapshot; },
    get locale() { return snapshot.locale; },
    get disposed() { return disposed; },
    setLocale(locale) { assertWritable(); const tag = canonicalLocale(locale); invalidateLoad(); return publish(tag); },
    refresh() { assertWritable(); invalidateLoad(); return publish(snapshot.locale, true); },
    subscribe(listener, opts = {}) {
      assertLive();
      if (listeners.has(listener)) throw new Error('defuss-i18n: listener already subscribed');
      listeners.set(listener, opts.phase ?? 'notify');
      if (opts.immediate) {
        try { listener(snapshot); } catch (error) { listeners.delete(listener); throw error; }
      }
      return () => { listeners.delete(listener); };
    },
    resolveLocale(available, requested = snapshot.locale) { return resolveLocale(available, requested, fallback); },
    directionFor(locale = snapshot.locale) {
      const dir = direction(canonicalLocale(locale));
      if (dir !== 'ltr' && dir !== 'rtl') throw new TypeError('defuss-i18n: direction must be ltr or rtl');
      return dir;
    },
    formatNumber(value, opts) { return new Intl.NumberFormat(snapshot.locale, opts).format(value); },
    formatDate(value, opts) { return new Intl.DateTimeFormat(snapshot.locale, opts).format(value); },
    plural(value, opts) { return new Intl.PluralRules(snapshot.locale, opts).select(value); },
    async loadLocale(locale, load, commit) {
      assertWritable();
      const tag = canonicalLocale(locale);
      invalidateLoad();
      const ticket = request;
      const controller = new AbortController();
      pending = controller;
      let data: Awaited<ReturnType<typeof load>>;
      try { data = await load(tag, controller.signal); }
      catch (error) {
        if (disposed || ticket !== request) return { status: 'superseded', snapshot };
        pending = undefined;
        throw error;
      }
      if (disposed || ticket !== request) return { status: 'superseded', snapshot };
      pending = undefined;
      // Stage data in the loader; mutate sources only in this latest-request commit.
      const committed = commit?.(data) as unknown;
      if (committed && typeof (committed as { then?: unknown }).then === 'function') throw new TypeError('defuss-i18n: load commit must be synchronous');
      if (disposed || ticket !== request) return { status: 'superseded', snapshot };
      return { status: 'applied', snapshot: publish(tag, true) };
    },
    dispose() { if (disposed) return; disposed = true; invalidateLoad(); listeners.clear(); },
  };
  return api;
}
