# Design rationale

Each section names a decision, the plausible alternative and why the alternative lost. Claims about behavior carry `VERIFIED:` when a test in this repository checks them, and `HYPOTHESIS:` when they are reasoned rather than measured.

## Locale variants as HTML templates, not a key catalog

**Alternative:** a JSON message catalog (`t('cart.items', { count })`) rendered into text nodes.

**Why templates:** a catalog only replaces strings. Real localization also changes structure: word order around inline links, which element carries emphasis, a different image, an RTL-specific layout. Templates hold the whole localized fragment, so translators see context, and the page's default HTML works without JavaScript. Native `<template>` content is inert, so unused locales cost parse time but nothing renders or loads.

**Cost:** markup repeated per locale. The validator offsets that by checking every locale for structural drift (`IDENTITY_TAG_MISMATCH`, `DUPLICATE_KEY`, coverage). If you have thousands of short strings with ICU-style message logic, a catalog library fits better. This package deliberately ships no message-format parser.

## Morph regions instead of replacing `innerHTML`

**Alternative:** `region.innerHTML = template.innerHTML`.

**Why morph:** replacing markup destroys element identity, listeners, focus, selection and typed input. defuss-morph patches matched nodes in place. VERIFIED: the browser suite checks node identity, listener survival, an open modal dialog, focus and selection range, and typed and checked inputs across switches, in all four shipped builds.

**Why through defuss-query:** query's `html()`/`text()` call the morph engine. Query adds what a raw morph call would need re-implemented: parsing in the target's own document (iframes), wrapping table and select fragments, shadow-root write targets, and lifecycle and delegated-event handling. There is exactly one reconciler, and no second diff algorithm lives here.

## Explicit ownership regions

**Alternative:** translate any element anywhere, and diff the whole component.

**Why regions:** state is only safe if the morph never touches it. Making regions explicit (`data-i18n-target`) puts a visible boundary in the markup: everything outside is a shell the library writes only declared attributes to. Overlap, nested components inside regions and templates inside their own target are rejected at bind time, because any of those would make one node have two owners.

## Attribute allowlist

**Alternative:** `data-i18n-{any-attribute}-{locale}`.

**Why an allowlist:** translating `aria-expanded`, `value`, `checked`, `id` or `aria-labelledby` per locale would let a language switch silently change UI state or break ID references. The allowlist ([API](api.md#html-attributes)) covers only content attributes, which are human-readable text, media sources and links.

## Isolated controllers, no global locale

**Alternative:** one module-level current locale.

**Why isolated:** a page may show two locales at once (an editor preview, a side-by-side translation view), and tests and SSR need independent instances. `createI18n` returns a self-contained controller. Importing the library has no side effects. VERIFIED: the package tests import the npm entry points with `document` and `df$` access trapped.

## Explicit lifecycle, no MutationObserver

**Alternative:** observe the document and auto-bind or unbind marked elements.

**Why explicit:** an observer guesses intent. A temporarily detached element (moved, or in a transition) would be torn down or double-bound, and every DOM change on the page would cost work. Explicit `bind`/`dispose` matches how defuss components already manage their lifecycle. Disposal detaches only listeners; the root is tracked in a `WeakMap`.

## Synchronous, phased projection

**Alternative:** async rendering, or a single subscriber list.

**Why synchronous:** after `setLocale` returns, the DOM is in the new locale, so tests and focus management can rely on it immediately. Bindings subscribe in a `render` phase that completes before ordinary `notify` subscribers, so "page changed" observers see every component already switched. Subscriber failures are collected and raised as one `AggregateError` after everyone has run, so one broken widget doesn't leave the others in the old locale.

**Not a transaction:** within one component, preparation (template selection, plural category, attribute and value checks) happens on detached copies before any live write. Across components there is no rollback. HYPOTHESIS: a cross-component rollback would have to capture and restore native state the browser does not expose (selection, media position), so it could not be made reliable.

## Latest request wins

**Alternative:** let each `loadLocale` publish when it resolves.

**Why tickets:** a user clicking German, then French, must end up in French even if the German fetch returns last. Every synchronous change (even a no-op `setLocale`) and every new load invalidates the pending ticket. Only the newest ticket may commit and publish. VERIFIED: core tests cover an out-of-order resolution where the stale loader ignores its abort signal.

## Native `Intl` instead of bundled CLDR data

**Alternative:** ship plural rules and number and date data.

**Why native:** browsers and Node already ship CLDR through ICU, so bundling that data would duplicate it on every page. VERIFIED: the minified browser ESM is about 16 KB raw and 6 KB gzip (`dist/stats.json`). Plural categories for a region use the *rendered* template locale, so a German page falling back to English templates chooses English plural forms. Engines without `Intl.Locale#getTextInfo` use a likely-subtag script table for text direction, and you can override it with `direction`.

## Raw-text slot rejection

**Alternative:** escape slot values specially for `<script>`/`<style>` content.

**Why reject:** there is no single correct escaping for raw-text content, because each context (CSS, JS, JSON) has its own syntax. A translated value has no business inside executable or styling content. Rejecting such slots is simpler and leaves no gap. VERIFIED: browser tests assert both the rejection and that no injected handler runs.
