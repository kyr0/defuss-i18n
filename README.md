# defuss-i18n

HTML-authored localization for defuss-query, defuss-morph and defuss-shadcn. Keep locale variants in `<template>` elements or `data-i18n-*` attributes; morph component-owned translation regions. No framework, JSX, Astro, translation-key catalog or second reconciler.

- DOM-free, isolated locale controllers: canonical BCP 47 tags, ordered fallback, immutable snapshots, subscriptions, disposal and latest-request-wins loading.
- Localized content/images/links/accessibility attributes through the existing defuss runtime.
- Native Intl formatting and plural selection; literal primitive interpolation.
- Optional state-driven HTML rendering and explicit live-property control.
- Strict TypeScript, ESM/CommonJS declarations, browser ESM/classic script, source maps, measured sizes, real Chromium tests and packed-consumer verification.

## Documentation

| Guide | Reference |
| --- | --- |
| [Getting started](documentation/getting-started.md) | [API reference](documentation/api.md): every export, option, attribute and event |
| [State and ownership](documentation/state-and-ownership.md) | [Errors and diagnostics](documentation/errors.md): every message and validator code |
| [Lazy loading](documentation/lazy-loading.md) | [Design rationale](documentation/design.md) |
| [Security model](documentation/security.md) | [Authoring contract](documentation/component-skill.md) · [Docs index](documentation/index.md) |

## Install and run

```sh
bun add defuss-i18n defuss-query defuss-morph   # or: npm install defuss-i18n defuss-query defuss-morph
```

```js
import { createI18n, bindI18n } from 'defuss-i18n';
const locale = createI18n({ locale: 'en', fallback: ['en'] });
const binding = bindI18n(document.getElementById('welcome'), locale);
locale.setLocale('de');
// On unmount:
binding.dispose();
locale.dispose();
```

For this downloaded source project, run `bun install && bun run serve` and open <http://127.0.0.1:8080/examples/>. The demo uses local peer scripts pinned by the lockfile. Built `dist/` files are included for self-hosting.

## HTML contract

```html
<section id="welcome" data-i18n-component>
  <div data-i18n-target="intro">
    <h2 key="heading">Welcome</h2>
    <img key="image" src="welcome-en.webp" alt="Welcome illustration">
  </div>
  <template data-i18n-for="intro" data-i18n-locale="en">
    <h2 key="heading">Welcome</h2>
    <img key="image" src="welcome-en.webp" alt="Welcome illustration">
  </template>
  <template data-i18n-for="intro" data-i18n-locale="de">
    <h2 key="heading">Willkommen</h2>
    <img key="image" src="welcome-de.webp" alt="Willkommensillustration">
  </template>
</section>
```

Active HTML supplies the no-JS default. Targets own their complete descendant markup. Keep templates outside their target; they are cloned/captured at bind time, never consumed or mutated during switching. `binding.rescan()` explicitly adopts changed sources/targets. Preserve keys/IDs and tag names for identity-sensitive nodes.

Keep imperative shells/state outside regions. Targets cannot overlap, contain nested `[data-i18n-component]` boundaries or introduce nested targets/templates. A parent ignores nested components; bind each child independently. `mountI18n(scope, locale)` binds all declared roots, including a component scope itself, and returns `{ bindings, dispose() }`. Do not mount the same roots twice. Bind/dispose dynamic components explicitly; no global MutationObserver exists.

Querying never pierces shadow roots. Bind an explicit root inside a shadow tree or a custom-element host's light DOM. Regular elements with their own open shadow root inherit the morph peer's shadow targeting rule. SVG/MathML, event delegation and other morph/query limitations remain inherited.

## Attributes

```html
<button data-i18n-component aria-label="Close"
        data-i18n-aria-label-en="Close" data-i18n-aria-label-de="Schließen"
        title="Close" data-i18n-title-en="Close"
        data-i18n-remove-de="title">×</button>
```

Use `data-i18n-{attribute}-{locale}`. Empty strings are real values. Explicit absence uses `data-i18n-remove-{locale}="title aria-label"`; declaring removal and a value for the same attribute/locale conflicts. HTML lowercases attribute names; locale suffixes are canonicalized, including `zh-hant-tw`.

Supported: `alt`, `title`, `placeholder`, `aria-label`, `aria-description`, `aria-roledescription`, `aria-placeholder`, `aria-valuetext`, `src`, `srcset`, `sizes`, `href`, `poster`, `label`, `download`, `content`.

ARIA state (`aria-expanded`/`aria-checked`), ID references (`aria-labelledby`/`aria-describedby`), input `value`/`checked`, runtime classes and initialization markers are not attribute-translation targets. A full region still owns every descendant attribute: imperative changes there may be overwritten. Keep stateful shells outside it or use a complete state renderer.

## Values and plurals

```html
<section id="cart" data-i18n-component>
  <p data-i18n-target="quantity" data-i18n-count="count">1 item</p>
  <template data-i18n-for="quantity" data-i18n-locale="en" data-i18n-plural="one">
    <span data-i18n-value="count"></span> item
  </template>
  <template data-i18n-for="quantity" data-i18n-locale="en" data-i18n-plural="other">
    <span data-i18n-value="count"></span> items
  </template>
</section>
```

```js
const cart = bindI18n(document.getElementById('cart'), locale, { values: { count: 1 } });
cart.setValues({ count: 2 });
```

Each plural locale requires `other`; add optional native CLDR categories. Plural selection uses the resolved template locale. Counts must be finite numbers. Values must be strings/numbers/booleans; missing values throw. Slots may contain text only and cannot be raw-text elements (`script`, `style`, `iframe`, `noscript`, ...) because serialization would not escape them. Values are literal text, never HTML or evaluated code. `setValues` replaces its map and restores the prior map when preparation fails; once live writes happened (e.g. `afterRender` threw), the new map stays committed.

For application state, pass `getState` and `values: state => ({ count: state.count })`; call `binding.refresh()` after an atomic state update. Format with `locale.formatNumber(value, options)`, `.formatDate(date, options)` and `.plural(count, options)`. Set an explicit time zone for deterministic dates.

## State renderer

```js
let state = Object.freeze({ checked: true });
const binding = bindI18n(document.getElementById('preferences'), locale, {
  getState: () => state,
  render: ({ locale }) => `<label key="label"><input key="check" type="checkbox"> ${locale === 'de' ? 'Aktiv' : 'Enabled'}</label>`,
  afterRender: ({ root, query, state }) => query(root.querySelector('input')).prop('checked', state.checked),
});
state = Object.freeze({ checked: false });
binding.refresh();
```

Read `getState()` once immediately before projection, including after lazy loading. `render(context)` must return HTML synchronously. Context is `{ state, values, locale, snapshot, i18n, root, query }`. Renderers cannot own/introduce nested components/templates. afterRender must also be synchronous. `afterRender` performs explicit property control or native lifecycle operations after morphing.

Omitting HTML attributes does not explicitly uncheck a checkbox or clear every live form property: morph preserves unspecified uncontrolled state. Use `.prop(...)` for explicit control. Application state belongs to the caller; this package does not capture native modal/popover/focus state or create a reactive store. Template/renderer HTML and URL attributes are trusted authoring input. Escape dynamic renderer strings or use literal slots; this package is not a sanitizer.

## Locale API

`createI18n({ locale: 'en', fallback: ['en'], direction })` returns an isolated controller.

| Member | Behavior |
| --- | --- |
| `snapshot`, `locale`, `disposed` | Immutable current `{ locale, revision, fallback, direction }`, locale shortcut, lifecycle flag |
| `setLocale(tag)` | Canonical synchronous update; canonical no-op does not notify |
| `refresh()` | Increment revision and re-project the current locale |
| `subscribe(fn, { immediate, phase })` | Return idempotent unsubscribe; default phase is `notify` |
| `resolveLocale(tags, requested?)` | Deterministic fallback match or undefined |
| `directionFor(tag?)` | Apply the configured direction policy |
| `formatNumber`, `formatDate`, `plural` | Native Intl in the requested locale |
| `loadLocale(tag, loader, commit?)` | Stage data, then install/publish only the latest request |
| `dispose()` | Cancel loads and clear listeners; repeated disposal is harmless |

Fallback walks the requested tag, extension-free base and shorter parents, then configured fallbacks/parents: `zh-Hant-TW → zh-Hant → zh → en`. No sibling-locale guessing. Missing matches throw before that binding's live translation writes. Direction uses native Intl locale text info, with a likely-subtag script fallback; override it with `direction: tag => 'ltr' | 'rtl'`. Roots reflect requested language/direction; regions reflect the selected fallback locale. Set `reflectLocale: false` to manage them yourself.

An async loader receives `(canonicalTag, AbortSignal)` and returns staged data without side effects. Its optional synchronous commit receives that data and runs only for the still-current request; update trusted template sources then call `binding.rescan()`. Result is `{ status: 'applied' | 'superseded', snapshot }`. Successful loads force refresh even for the same locale. New loads, `setLocale` (including a no-op), `refresh` and disposal invalidate prior tickets. Current loader/commit failures propagate; stale loader failures are suppressed. Abort is advisory.

## Notifications, lifecycle and errors

Bindings use the controller's `render` phase. Normal subscribers run afterwards, after all render callbacks. Each binding emits `defuss-i18n:change` after its own writes/`afterRender`, with `detail: { snapshot, root }`; it bubbles, does not cross shadow boundaries, and may use `eventTarget` override. Component events are not document-wide completion events; use a normal controller subscriber for that. State-only binding refreshes also emit the component event.

Source/attribute/value preparation precedes live translation writes within one binding. The locale snapshot commits before subscribers run. Subscriber failures are collected, remaining subscribers run, then `AggregateError` is thrown. There is no cross-component rollback or DOM transaction; morph lifecycle callbacks/user code may observe intermediate mutations. Reentrant locale changes/refreshes are rejected; schedule a microtask for follow-up work.

Binding methods: `refresh()`, `setValues(map)`, `rescan()`, `dispose()`; properties: `root`, `controller`, `disposed`, `context`. Dispose on unmount; controller disposal stops all subscriptions and permits rebinding a root to another live controller.

## Browser / defuss-shadcn

Load defuss-shadcn `core.js` first, then the supplied `dist/all.js`. It installs `df$.i18n` and reuses the same runtime; no additional query/morph bundle is needed. Without shadcn:

```html
<script type="module">
  await import('https://cdn.jsdelivr.net/npm/defuss-morph@0.1.1/dist/all.min.js');
  await import('https://cdn.jsdelivr.net/npm/defuss-query@0.1.0/dist/all.min.js');
  await import('./defuss-i18n/dist/all.min.js');
  const locale = df$.i18n.createI18n({ locale: 'en' });
  const components = df$.i18n.mount(document, locale);
</script>
```

Browser ESM: `all.js`/`all.min.js`. Classic script: `global.min.js`. Peers remain external; missing runtime/version conflicts fail explicitly. Root/core imports have no import-time DOM reads/global writes; `defuss-i18n/core` also avoids peer imports and supports `createDomI18n(customDf$)` injection. Use `WithI18n<typeof df$>` from `defuss-i18n/global` for global-runtime typing without conflicting ambient declarations.

## Validation and release

`validateI18n(root, { locales: ['en', 'de'], values: ['count'] })` returns `{ code, message, element }[]`; `assertValidI18n` throws an actionable list. Check source/target pairing, duplicates, locale/attribute coverage, stable identity tags, locale syntax, attribute policy, plural sets, values, ownership and ARIA/label references. This validates markup contracts, not linguistic correctness.

```sh
bun install --frozen-lockfile
bun run check
make verify
bun publish
```

`prepublishOnly` gates release: build → oxlint + strict types → unit tests/coverage → browser behavior → packed ESM/CJS/type consumers → source/version/maps/size/peer-exclusion verification. Browser tests use installed Playwright Chromium, an explicit `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, or, on Linux x64 only, the pinned Sparticuz Chromium package; no test-time browser download. Core coverage concerns locale/attribute modules, not the entire DOM adapter. Browser outcomes/screenshot go to `test-results/`; measured raw/gzip/Brotli sizes are in `dist/stats.json`.

The npm package includes sources, distributions, docs and demos, excluding test fixtures/tools/reports. See the [documentation index](documentation/index.md), [architecture](ARCH.md), [MDX](documentation/i18n.mdx) and [agent authoring contract](documentation/component-skill.md). MIT.
