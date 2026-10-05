# API reference

## Entry points

| Import | Contents | Side effects |
| --- | --- | --- |
| `defuss-i18n` | everything in `defuss-i18n/core`, plus `bindI18n` and `mountI18n` bound to the `defuss-query` peer | none at import; no DOM or global access |
| `defuss-i18n/core` | locale controller, attribute helpers, validation, `createDomI18n` | none; imports no peer, safe in Node/SSR |
| `defuss-i18n/global` | types only: `BrowserI18n`, `I18nGlobalRuntime`, `WithI18n` | none; types only |
| `dist/all.js`, `dist/all.min.js` | browser ESM: everything in core plus `installGlobal`, `i18n`, `bindI18n`, `mountI18n` | installs `df$.i18n` on import; throws if `df$` is missing |
| `dist/global.min.js` | classic script build of `all.js` | installs `df$.i18n` |

ESM and CommonJS builds have matching declarations. The browser builds keep `defuss-query` and `defuss-morph` external and use the page's `df$`.

## Locale controller

### `createI18n(options?: I18nOptions): I18n`

```ts
interface I18nOptions {
  locale?: string;                              // default 'en'
  fallback?: string | readonly string[];        // default ['en']; [] disables fallback
  direction?: (locale: string) => Direction;    // default localeDirection
}
```

Returns an isolated controller. Tags are canonicalized (`DE-de` → `de-DE`). Fallbacks are canonicalized, de-duplicated and frozen. An invalid tag throws `RangeError`, and a `direction` policy returning anything other than `'ltr' | 'rtl'` throws `TypeError`.

### `I18n`

| Member | Signature | Behavior |
| --- | --- | --- |
| `snapshot` | `LocaleSnapshot` | current frozen `{ locale, revision, fallback, direction }` |
| `locale` | `string` | `snapshot.locale` |
| `disposed` | `boolean` | `true` after `dispose()` |
| `setLocale` | `(locale: string) => LocaleSnapshot` | canonicalize, cancel any pending load, publish. A canonical no-op returns the same snapshot and notifies no one |
| `refresh` | `() => LocaleSnapshot` | cancel any pending load; publish the same locale with `revision + 1` |
| `subscribe` | `(listener, options?: SubscribeOptions) => () => void` | register; returns an idempotent unsubscribe. Subscribing the same function twice throws |
| `resolveLocale` | `(available: Iterable<string>, requested?: string) => string \| undefined` | best match for `requested` (default: current locale) through this controller's fallbacks |
| `directionFor` | `(locale?: string) => Direction` | apply the configured direction policy (default: current locale) |
| `formatNumber` | `(value: number \| bigint, options?: Intl.NumberFormatOptions) => string` | `Intl.NumberFormat` in the current locale |
| `formatDate` | `(value: Date \| number, options?: Intl.DateTimeFormatOptions) => string` | `Intl.DateTimeFormat` in the current locale. Pass `timeZone` for deterministic output |
| `plural` | `(value: number, options?: Intl.PluralRulesOptions) => Intl.LDMLPluralRule` | `Intl.PluralRules#select` in the current locale |
| `loadLocale` | `<T>(locale, load: (locale, signal: AbortSignal) => Promise<T>, commit?: (data: T) => void) => Promise<LoadResult>` | latest-request-wins loading; see [lazy loading](lazy-loading.md) |
| `dispose` | `() => void` | cancel a pending load, drop all listeners; further writes and subscriptions throw. Idempotent |

```ts
interface SubscribeOptions { immediate?: boolean; phase?: 'render' | 'notify' }   // default phase 'notify'
type LocaleListener = (snapshot: LocaleSnapshot) => void;
interface LoadResult { readonly status: 'applied' | 'superseded'; readonly snapshot: LocaleSnapshot }
interface LocaleSnapshot { readonly locale: string; readonly revision: number; readonly fallback: readonly string[]; readonly direction: Direction }
type Direction = 'ltr' | 'rtl';
type Primitive = string | number | boolean;
type Values = Readonly<Record<string, Primitive>>;
```

**Publishing:** the snapshot is committed first. Then all `render`-phase listeners run, then all `notify`-phase listeners. A listener unsubscribed during the run is skipped. Errors are collected and thrown afterwards as `AggregateError('defuss-i18n: locale committed, but one or more subscribers failed')`. Calling `setLocale`, `refresh` or `loadLocale` from inside a listener throws, so schedule follow-ups with `queueMicrotask`. With `immediate: true`, the listener runs once at subscription. If that call throws, the listener is not registered.

**Loading:** see [lazy loading](lazy-loading.md). A failure of the newest request rejects the promise. A failure of a superseded request resolves to `{ status: 'superseded' }`. A `commit` returning a promise throws `load commit must be synchronous` and does not publish.

### Locale utilities

| Function | Behavior |
| --- | --- |
| `canonicalLocale(locale: string): string` | BCP 47 canonical form via `Intl.getCanonicalLocales`. Empty or invalid throws `RangeError` |
| `localeChain(locale: string, fallback = ['en']): string[]` | ordered candidates: the requested tag (with extensions), its base name and parents, then each fallback and its parents, de-duplicated. `zh-Hant-TW-u-nu-hanidec` → `zh-Hant-TW-u-nu-hanidec, zh-Hant-TW, zh-Hant, zh, …` |
| `resolveLocale(available: Iterable<string>, locale: string, fallback = ['en']): string \| undefined` | first `localeChain` entry contained in `available` (canonicalized). Never guesses siblings (`fr-CA` ≠ `fr-FR`) |
| `localeDirection(locale: string): Direction` | `Intl.Locale#getTextInfo()`/`textInfo` when available; otherwise RTL if the likely script is a right-to-left script (`Arab`, `Hebr`, `Thaa`, `Syrc`, `Nkoo`, `Adlm`, ...) |
| `I18N_VERSION: string` | package version; also guards against two versions installing on one `df$` |

## DOM binding

### `bindI18n(root, controller, options?)` / `createDomI18n(df$).bind(...)`

```ts
function bind<S = undefined>(root: Element, controller: I18n, options?: BindOptions<S>): I18nBinding<S>;

interface BindOptions<S = undefined> {
  getState?: () => S;                                                      // read once per render
  values?: Values | ((state: S, snapshot: LocaleSnapshot) => Values);       // interpolation and plural counts
  render?: (context: RenderContext<S>) => string;                           // full renderer: owns the root's content
  afterRender?: (context: RenderContext<S>) => void;                        // synchronous; explicit property control
  reflectLocale?: boolean;                                                  // default true: write lang/dir
  eventTarget?: EventTarget;                                                // where to dispatch the change event (default: root)
}

interface RenderContext<S> {
  readonly state: S; readonly locale: string; readonly snapshot: LocaleSnapshot; readonly i18n: I18n;
  readonly values: Values; readonly root: Element; readonly query: QueryRuntime;
}
```

`bind` throws if `root` is not an Element, if `root` already has a live binding, if the controller is disposed, or if the component is invalid. It then marks the root with `data-i18n-component`, captures templates, subscribes in the `render` phase and renders immediately in the current locale. If the first render fails, the binding is disposed and the error rethrown.

### `I18nBinding<S>`

| Member | Behavior |
| --- | --- |
| `root`, `controller` | what was bound |
| `disposed` | `true` once the binding **or** its controller is disposed |
| `context` | the last `RenderContext` that reached the DOM, or `undefined` |
| `refresh()` | re-read state and values; re-render in the current locale |
| `setValues(values)` | replace the value map (overrides `values` from then on) and re-render. The previous map is restored if the render fails before touching the DOM |
| `rescan()` | re-capture templates and targets, re-validate, re-render |
| `dispose()` | unsubscribe; leaves the DOM as is. Idempotent |

A render that is already running cannot start another one (`reentrant binding refresh`), for example `afterRender` calling `refresh()`.

### `mountI18n(scope, controller)` / `createDomI18n(df$).mount(...)`

```ts
function mount(scope: ParentNode, controller: I18n): { readonly bindings: readonly I18nBinding[]; dispose(): void };
```

Binds every `[data-i18n-component]` in `scope`, including `scope` itself when it is a marked element, in document order, without options. If any bind fails, the ones already bound are disposed and the error is rethrown. Don't mount the same roots twice.

### `createDomI18n(runtime: QueryRuntime)`

Returns a frozen `{ bind, mount }` that uses the given callable `df$` for all live writes. Throws unless `runtime` is a function with a `morph` capability. Use it with `defuss-i18n/core` to inject a specific `df$` (an iframe's, a test's or shadcn's).

```ts
interface QueryRuntime { (element: Element): QuerySelection; morph?: unknown }
interface QuerySelection {
  html(content: string): unknown; text(content: string): unknown;
  attr(name: string, value: string | null): unknown; prop(name: string, value: unknown): unknown;
}
```

### `I18N_CHANGE_EVENT = 'defuss-i18n:change'`

A `CustomEvent` dispatched after each binding render, once the writes and `afterRender` are done. This includes `refresh`, `setValues` and `rescan`. Its `detail` is a frozen `{ snapshot, root }`. It bubbles, is not `composed`, and is created in the root's own realm. It is dispatched on `eventTarget` if given, otherwise on the root.

## HTML attributes

| Attribute | On | Meaning |
| --- | --- | --- |
| `data-i18n-component` | root | component boundary; `bind` adds it if missing |
| `data-i18n-target="name"` | element | translation region named `name` (unique per component) |
| `data-i18n-for="name"` | `<template>` | source for region `name` |
| `data-i18n-locale="tag"` | `<template>` | locale of that source (required, BCP 47) |
| `data-i18n-plural="category"` | `<template>` | one of `PLURAL_CATEGORIES`; count regions need `other` per locale |
| `data-i18n-count="key"` | target | value key whose number selects the plural category |
| `data-i18n-value="key"` | element without child elements | filled with the value as literal text; not on raw-text elements |
| `data-i18n-{attr}-{locale}` | any owned element | localized value for a content attribute; empty string is a real value |
| `data-i18n-remove-{locale}="attr attr…"` | any owned element | remove those attributes in that locale |
| `key` | any | sibling identity for the morph (keep tags stable per key) |

The locale suffix is canonicalized, and HTML lowercases attribute names, so `data-i18n-title-zh-hant-tw` works. Attribute variants are chosen by walking `localeChain(currentLocale, fallback)`. If no variant matches, rendering throws.

### `TRANSLATABLE_ATTRIBUTES`

Frozen list: `aria-roledescription`, `aria-description`, `aria-placeholder`, `aria-valuetext`, `aria-label`, `placeholder`, `download`, `srcset`, `poster`, `title`, `sizes`, `label`, `alt`, `src`, `href`, `content`. Type `TranslatableAttribute` is its union.

### Attribute helpers

| Function | Behavior |
| --- | --- |
| `parseTranslationAttribute(name: string): AttributeVariant \| undefined` | `'data-i18n-aria-label-de'` → `{ attribute: 'aria-label', locale: 'de' }`. Longest attribute name wins. `undefined` for anything not on the allowlist. Invalid locale suffix throws `RangeError` |
| `chooseAttribute(variants: ReadonlyMap<string, string>, locale: string, fallback: readonly string[]): string \| undefined` | first variant along `localeChain`; an empty string counts as a match |

```ts
interface AttributeVariant { readonly attribute: TranslatableAttribute; readonly locale: string }
```

## Validation

### `validateI18n(root: Element, options?: ValidationOptions): Diagnostic[]`

```ts
interface ValidationOptions { locales?: readonly string[]; values?: readonly string[] }
interface Diagnostic { readonly code: string; readonly message: string; readonly element: Element }
```

Checks structure on its own. With `locales`, it also checks that every target and translated attribute covers each locale. With `values`, it checks that every slot and count names a declared key. It never throws for markup problems; every code is listed in [errors and diagnostics](errors.md#validator-diagnostics).

### `assertValidI18n(root, options?)`

Throws `defuss-i18n: invalid component` with one `CODE: message` line per diagnostic. `bind` and `rescan` call it without options for non-renderer components.

### `ownedElements(root: Element): Element[]`

`root` plus every descendant whose nearest component boundary is `root`, i.e. everything except nested components. It does not enter template content.

### `PLURAL_CATEGORIES`

`Set` of `zero`, `one`, `two`, `few`, `many`, `other`.

## Browser global

### `installGlobal(runtime): BrowserI18n`

Installs and returns the frozen `df$.i18n` namespace: every core export, plus `bind`, `mount`, `bindI18n`, `mountI18n` (aliases) and `version`. If the same version is already installed it returns the existing namespace. A different version throws `another version is already installed`. `dist/all.js` calls it on import and exports the result as `i18n`, along with `bindI18n` and `mountI18n`.

### Types for the global

```ts
import type { WithI18n, BrowserI18n, I18nGlobalRuntime } from 'defuss-i18n/global';
const runtime = df$ as WithI18n<typeof df$>;   // adds `readonly i18n: BrowserI18n`
runtime.i18n.createI18n({ locale: 'de' });
```

`I18nGlobalRuntime` is `{ readonly i18n: BrowserI18n }`, and `WithI18n<T>` is `T & I18nGlobalRuntime`. They add typing without redeclaring defuss-query's ambient `df$`.
