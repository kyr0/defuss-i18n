# defuss-i18n

[![CI](https://github.com/kyr0/defuss-i18n/actions/workflows/verify.yml/badge.svg)](https://github.com/kyr0/defuss-i18n/actions/workflows/verify.yml)
[![npm](https://img.shields.io/npm/v/defuss-i18n)](https://www.npmjs.com/package/defuss-i18n)
[![License](https://img.shields.io/github/license/kyr0/defuss-i18n)](LICENSE)

The [defuss](https://github.com/kyr0/defuss) runtime's localization module, made for [defuss-shadcn](https://shadcn.defuss.org/): translate the page, keep its state.

Every translation is plain HTML in a `<template>` beside your markup, and a language switch morphs only what a component owns and has rendered before: focus, typed input and state-related rendering like open dialogs stay exactly as they were. Live site and demo: <https://i18n.defuss.org>.

## TL;DR

You don't need a translation framework, a message catalog format or a build step to localize a page. Write the default language as HTML, put each translation into an inert `<template>` next to it, bind the component once and call `setLocale('de')`. defuss-i18n selects one template per region, fills values and attributes on a detached copy, and lets defuss-morph patch the live region through `df$`, so matched elements survive the switch. The page reads correctly before any JavaScript runs.

Features:
- 🔌 Plugs into `df$`: load it after defuss-shadcn and call `df$.i18n`; without shadcn, defuss-query and defuss-morph provide the same runtime
- 📄 HTML is the catalog: one `<template>` per language next to the default markup; a translation may change structure, not only words
- 🛡️ State survives a switch: regions are morphed in place, so elements, listeners, focus, text selection, typed input and open dialogs stay
- 🌐 Native `Intl`: BCP 47 fallback chains such as `de-AT → de → en`, CLDR plural rules, number and date formats from the browser, no bundled locale data
- 🏷️ Attributes, too: sixteen content attributes, from `alt` and `aria-label` to `href` and `src`, through `data-i18n-{attribute}-{locale}`
- ✅ Checked before it writes: `validateI18n` returns structured diagnostics for missing languages, overlapping regions and broken ID references
- ⬇️ Languages on demand: ship one language and fetch the others with `loadLocale`; only the newest request commits
- 🔒 Values stay text: interpolated values are written as text, and value slots inside `script`, `style` or `iframe` are rejected before any write
- ⚡ Synchronous switches: when `setLocale` returns, every bound component shows the new language
- 📦 ESM, CommonJS, browser ESM and classic-script builds; the two peers stay external
- 🪶 6.2 kB gzip for the minified browser build
- 🧪 Unit and docs tests plus real-browser tests of every shipped build in Chromium
- 🟦 Written in TypeScript

## Quick, traditional CDN-based setup with defuss-shadcn

defuss-i18n works best with defuss-shadcn, whose `all.min.js` installs the shared `df$` runtime. Load defuss-i18n after it; it adds `df$.i18n`:

```html
<body>
  <section id="welcome" data-i18n-component>
    <h1 data-i18n-target="title">Translate the page.</h1>
    <template data-i18n-for="title" data-i18n-locale="en">Translate the page.</template>
    <template data-i18n-for="title" data-i18n-locale="de">Seite übersetzen.</template>
    <button aria-label="Close" data-i18n-aria-label-de="Schließen">×</button>
  </section>

  <!-- right before the closing </body> tag: defuss-shadcn first, then defuss-i18n, then your page -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/defuss-shadcn@0.9.8/dist/components/all.min.js"></script>
  <script type="module" src="https://cdn.jsdelivr.net/npm/defuss-i18n@0.1.0/dist/all.min.js"></script>
  <script type="module">
    const locale = df$.i18n.createI18n({ locale: 'en', fallback: ['en'] });
    for (const root of document.querySelectorAll('[data-i18n-component]')) df$.i18n.bind(root, locale);
    locale.setLocale('de'); // every bound component now shows German
  </script>
</body>
```

Module scripts run in document order, so the three tags above are the whole load-order contract. The site at <https://i18n.defuss.org> pins the same files with Subresource Integrity hashes.

- **Good for:** Quick, powerful AI-prototyping, demos, and testing in the browser; pages already built on defuss-shadcn.
- **Drawbacks:** Doesn't work offline, single-point-of-failure, no bundler optimizations.

## Quick, modern CDN-based setup using ESM imports

Without defuss-shadcn, load the two peers first (they install `df$`), then import what you need from the defuss-i18n browser build. No globals of your own are required:

```html
<body>
  <section id="welcome" data-i18n-component>…</section>

  <script type="module">
    await import('https://cdn.jsdelivr.net/npm/defuss-morph@0.1.1/dist/all.min.js');
    await import('https://cdn.jsdelivr.net/npm/defuss-query@0.1.0/dist/all.min.js');
    const { createI18n, bindI18n } = await import('https://cdn.jsdelivr.net/npm/defuss-i18n@0.1.0/dist/all.min.js');

    const locale = createI18n({ locale: 'en', fallback: ['en'] });
    const welcome = bindI18n(document.getElementById('welcome'), locale);
    locale.setLocale('de'); // the <h1> now reads "Seite übersetzen."; it is the same element as before
  </script>
</body>
```

Importing defuss-i18n before `df$` exists throws `load defuss-shadcn core.js or defuss-morph + defuss-query first`.

- **Good for:** Quick, powerful AI-prototyping, demos, and testing in the browser, with explicit imports and no global namespace pollution.
- **Drawbacks:** Also doesn't work offline, still single-point-of-failure, still no bundler optimizations.

## Quick, non-CDN setup

Download the browser builds once and serve them with your own assets: `dist/all.min.js` from the defuss-i18n package on [jsDelivr](https://www.jsdelivr.com/package/npm/defuss-i18n), and the peers' `dist/all.min.js` from [defuss-morph](https://www.jsdelivr.com/package/npm/defuss-morph) and [defuss-query](https://www.jsdelivr.com/package/npm/defuss-query). With defuss-shadcn, its `components/all.min.js` replaces the two peers.

Example:
```text
project/
├── assets/
│   └── js/
│       ├── defuss-morph.min.js
│       ├── defuss-query.min.js
│       └── defuss-i18n.min.js
└── index.html
```

Then import the local files in the same order:

```html
<script type="module">
  await import('./assets/js/defuss-morph.min.js');
  await import('./assets/js/defuss-query.min.js');
  const { createI18n, bindI18n } = await import('./assets/js/defuss-i18n.min.js');
  // … as above
</script>
```

`dist/global.min.js` is the same build as a classic `<script>` (no `type="module"`), for pages that cannot use modules.

- **Good for:** Offline-support, air-gapped environments, and locking the exact version you ship.
- **Drawbacks:** Manual updates: you need to re-download the files to get a new version, and still no bundler optimizations.

## For production: Install via package manager

The most professional approach is to use a package manager: this allows for version-pinning, offline-support, and optimized production builds using tree-shaking and minification.

We recommend [`bun`](https://bun.sh) only as a package manager and simple script runner. defuss-query and defuss-morph are peer dependencies; install them inside their supported ranges:

```bash
bun add defuss-i18n defuss-query@^0.1.0 defuss-morph@^0.1.1
# or: npm install defuss-i18n defuss-query@^0.1.0 defuss-morph@^0.1.1
```

A bare `bun add defuss-query defuss-morph` installs their latest releases, which can fall outside the peer ranges (0.2.0 does).

Then, in `.ts` or `.js` files:

```ts
import { createI18n, bindI18n } from 'defuss-i18n';

const locale = createI18n({ locale: 'de-DE', fallback: ['en'] });
console.log(locale.locale, locale.formatNumber(1234.5)); // de-DE 1.234,5

// only the translated regions are patched; untouched nodes keep
// their identity, focus, selection, typed input and event listeners
const welcome = bindI18n(document.getElementById('welcome')!, locale);
locale.setLocale('en');
welcome.dispose(); // when the component leaves the page
```

`defuss-i18n/core` is the same API without the peer import, for Node, SSR and tests: `createDomI18n(df$)` returns `bind` and `mount` for any callable `df$` with a `morph` capability.

If you have `bun` installed, you can serve your project directory statically with a single command:

```bash
bunx serve .
```

## Vibe coding

Paste this prompt into your coding agent. It links the repository, so the agent works from this README and the authoring contract in [`documentation/component-skill.md`](documentation/component-skill.md):

```text
Integrate defuss-i18n into this app: https://github.com/kyr0/defuss-i18n
Read its README.md and documentation/component-skill.md first. Install it with bun add defuss-i18n defuss-query@^0.1.0 defuss-morph@^0.1.1, or load https://cdn.jsdelivr.net/npm/defuss-i18n@0.1.0/dist/all.min.js after the all.min.js of defuss-shadcn.
Mark each translated component with data-i18n-component and the parts that change with data-i18n-target. Put one <template data-i18n-for data-i18n-locale> per language next to each part, never inside it, and translate attributes with data-i18n-{attribute}-{locale}.
Create one controller with createI18n({ locale, fallback: ['en'] }), bind() every component, resolve every validateI18n diagnostic, pass dynamic values as text through data-i18n-value slots, and dispose() a binding when its component leaves the page.
```

Give your agent the [defuss-vae](https://github.com/kyr0/defuss-vae) skills too: it then plans, tests and reviews against a verifier instead of declaring itself done. In Claude Code, the plugin adds the commit and Stop-hook gate. Needs `python3` ≥ 3.9, `git` and `make`.

```bash
npx skills add kyr0/defuss-vae --skill '*'
# Claude Code plugin:
claude plugin marketplace add kyr0/defuss-vae
claude plugin install defuss-vae@defuss-vae
```

## API

The complete contract, every option and every error message, is in the [API reference](documentation/api.md) and [errors and diagnostics](documentation/errors.md). This is the working subset.

### `createI18n(options?): I18n`

```ts
interface I18nOptions {
  locale?: string;                              // default 'en'
  fallback?: string | readonly string[];        // default ['en']; [] disables fallback
  direction?: (locale: string) => 'ltr' | 'rtl'; // default localeDirection
}
```

Returns an isolated controller; a page can hold several. Tags are canonicalized (`DE-de` → `de-DE`), an invalid tag throws `RangeError`.

| Member | Behavior |
| --- | --- |
| `snapshot`, `locale` | the current frozen `{ locale, revision, fallback, direction }` and its tag |
| `setLocale(tag)` | canonicalize, cancel a pending load, publish. Synchronous: when it returns, every bound component shows the new locale |
| `refresh()` | publish the same locale with `revision + 1` |
| `subscribe(listener, { immediate?, phase? })` | `render`-phase listeners (the bindings) run before `notify`-phase listeners; returns an unsubscribe function |
| `resolveLocale(available, requested?)` | best match through this controller's fallbacks; never guesses siblings (`fr-CA` ≠ `fr-FR`) |
| `formatNumber`, `formatDate`, `plural` | `Intl.NumberFormat`, `Intl.DateTimeFormat` and `Intl.PluralRules` in the current locale |
| `loadLocale(tag, loader, commit?)` | latest-request-wins loading, see below |
| `dispose()` | cancel a pending load, drop all listeners; further writes throw |

Publishing commits the snapshot first, then runs all listeners; their errors are collected and thrown afterwards as one `AggregateError`, so a failing subscriber never leaves the locale half-switched.

### `bindI18n(root, controller, options?): I18nBinding`

```ts
interface BindOptions<S> {
  getState?: () => S;                                                 // read once per render
  values?: Values | ((state: S, snapshot: LocaleSnapshot) => Values); // interpolation and plural counts
  render?: (context: RenderContext<S>) => string;                     // full renderer: owns the root's content
  afterRender?: (context: RenderContext<S>) => void;                  // synchronous; explicit property control
  reflectLocale?: boolean;                                            // default true: write lang/dir on the root
  eventTarget?: EventTarget;                                          // where defuss-i18n:change is dispatched (default: root)
}
```

`bind` captures the templates once, checks ownership (every region belongs to exactly one component) and renders immediately in the current locale. The binding offers `refresh()` after application state changed, `setValues(values)`, `rescan()` after templates or targets changed, and `dispose()`. After each render it dispatches `defuss-i18n:change` with `{ snapshot, root }`.

`mountI18n(scope, controller)` binds every `[data-i18n-component]` in `scope` without options and returns `{ bindings, dispose }`.

### HTML attributes

| Attribute | On | Meaning |
| --- | --- | --- |
| `data-i18n-component` | root | component boundary; `bind` adds it if missing |
| `data-i18n-target="name"` | element | translation region named `name` (unique per component) |
| `data-i18n-for="name"` | `<template>` | source for region `name` |
| `data-i18n-locale="tag"` | `<template>` | locale of that source (required, BCP 47) |
| `data-i18n-plural="category"` | `<template>` | `zero`, `one`, `two`, `few`, `many` or `other`; count regions need `other` per locale |
| `data-i18n-count="key"` | target | value key whose number selects the plural category |
| `data-i18n-value="key"` | element without child elements | filled with the value as literal text; not on raw-text elements |
| `data-i18n-{attr}-{locale}` | any owned element | localized value for a content attribute; empty string is a real value |
| `data-i18n-remove-{locale}="attr attr…"` | any owned element | remove those attributes in that locale |
| `key` | any | sibling identity for the morph (keep tags stable per key) |

The sixteen translatable attributes are `aria-roledescription`, `aria-description`, `aria-placeholder`, `aria-valuetext`, `aria-label`, `placeholder`, `download`, `srcset`, `poster`, `title`, `sizes`, `label`, `alt`, `src`, `href` and `content`. Templates never go inside their own target, and targets, components and templates never nest inside a region.

### Values and plurals

```html
<article id="carton" data-i18n-component>
  <p data-i18n-target="quantity" data-i18n-count="count">1 egg</p>
  <template data-i18n-for="quantity" data-i18n-locale="en" data-i18n-plural="one"><span data-i18n-value="label"></span> egg</template>
  <template data-i18n-for="quantity" data-i18n-locale="en" data-i18n-plural="other"><span data-i18n-value="label"></span> eggs</template>
  <template data-i18n-for="quantity" data-i18n-locale="de" data-i18n-plural="one"><span data-i18n-value="label"></span> Ei</template>
  <template data-i18n-for="quantity" data-i18n-locale="de" data-i18n-plural="other"><span data-i18n-value="label"></span> Eier</template>
</article>
```

```ts
let carton = { count: 12 };
const binding = bindI18n(document.getElementById('carton')!, locale, {
  getState: () => carton,
  values: state => ({ count: state.count, label: locale.formatNumber(state.count) }),
});
// "12 eggs" in en, "12 Eier" in de; after carton = { count: 1 } and binding.refresh(): "1 egg" / "1 Ei"
```

CLDR picks the plural form, `Intl` formats the number, and the value lands as a text node, never as markup.

### `validateI18n(root, { locales?, values? }): Diagnostic[]`

Returns `{ code, message, element }` per problem and never throws for markup problems. With `locales`, every target and translated attribute must cover each locale; with `values`, every slot and count must name a declared key. `assertValidI18n` throws the same list as one error; `bind` calls it for every non-renderer component.

### `loadLocale(tag, loader, commit?)`

```ts
const result = await locale.loadLocale('fr', async (tag, signal) => {
  const response = await fetch(`/locales/${tag}.html`, { signal });
  return response.text();
}, html => {
  templates.insertAdjacentHTML('beforeend', html); // trusted markup
  binding.rescan();
});
result.status; // 'applied' | 'superseded'
```

The loader fetches and must not touch the page; the synchronous commit runs only while this request is still the newest one, then the locale is published. When a user picks German and then French before the German data arrives, only the French request commits. See [lazy loading](documentation/lazy-loading.md).

## Examples

The project site at <https://i18n.defuss.org> is the runnable example: every sentence on it comes from a defuss-i18n template, in English and German. Its source is [`site/`](site/), its built page [`docs/index.html`](docs/index.html) and its script [`docs/assets/demo.js`](docs/assets/demo.js).

| Section | What it shows |
| --- | --- |
| Hero | The same markup as standard HTML and as defuss-i18n HTML, rendered as a diff; a cursor marks the live template line |
| How it works | Author, bind, select, morph: the four steps of a switch |
| Live demo | Plural rules (one egg, two eggs; ein Ei, zwei Eier), a dialog whose typed input survives a switch, markup rendered from application state, translated `src` and `alt`, a live locale snapshot and a `defuss-i18n:change` event log |
| Install | The three setups above, by hand or as a coding-agent prompt |

Run it from a checkout with `bun run serve` and open <http://127.0.0.1:8080/docs/>; it loads defuss-shadcn and the released defuss-i18n from jsDelivr, so it needs network access but no build. `docs/index.html` is generated: edit [`site/page.html`](site/page.html) and [`site/translations.json`](site/translations.json), then run `bun run site`; `scripts/verify.mjs` fails when the page no longer matches its source.

The guides go deeper: [getting started](documentation/getting-started.md), [state and ownership](documentation/state-and-ownership.md), [lazy loading](documentation/lazy-loading.md), the [security model](documentation/security.md), the [design rationale](documentation/design.md) and the [authoring contract](documentation/component-skill.md) for agents. [ARCH.md](ARCH.md) is the module map for contributors.

## Two things to know

**Markup is trusted; values are not.** Template markup, HTML added in a `loadLocale` commit, renderer output and URL-valued attribute translations become live DOM without sanitizing, because they are your own HTML. If translators, a CMS or users can edit templates, sanitize that HTML before it reaches the page. Interpolation values are the untrusted channel: only strings, numbers and booleans are accepted, they are written as text, and slots on `script`, `style`, `iframe` and similar raw-text elements are rejected before any write.

**A region owns its whole subtree.** defuss-morph can only keep what it can match, so keep IDs, `key` attributes and tags stable across the translations of a region, keep native shells such as a `<dialog>` outside the translated region and translate their text inside it, and keep nested components outside the region of their parent. `validateI18n` reports overlapping targets, nested templates and broken ID references before the first write.

## Size

<!-- bundle-size:start -->
| File | Size | Gzipped | Purpose |
| --- | ---: | ---: | --- |
| `index.js` | 0.6 kB | 0.3 kB | ESM/library build; binds to the `defuss-query` peer; used when installing via npm/bun |
| `index.cjs` | 1.0 kB | 0.4 kB | CommonJS build of the same entry |
| `core.js` | 28.6 kB | 7.5 kB | ESM core without any peer import; Node, SSR, tests, `createDomI18n(df$)` |
| `core.cjs` | 29.0 kB | 7.5 kB | CommonJS core |
| `all.js` | 29.9 kB | 7.8 kB | Browser ESM build; installs `df$.i18n`; for CDN-based usage with debugging |
| `all.min.js` | 16.2 kB | **6.2 kB** | Minified browser ESM build; for CDN-based usage without debugging (Pareto-optimal when no bundler is used) |
| `global.min.js` | 15.9 kB | 6.1 kB | Minified classic-script build; installs `df$.i18n` from a plain `<script>` |
<!-- bundle-size:end -->

`index.js` is small because the npm entry only adds the peer binding on top of `core.js`; a bundler resolves both. The browser builds keep defuss-query and defuss-morph external, so a page loads each engine once. `scripts/verify.mjs` compares this table with the built files.

## Development

```bash
make setup && make verify
```

`make verify` runs oxlint and strict TypeScript, the unit and docs tests with coverage, the browser suite against all four shipped builds in real Chromium, the project site as published and with the checkout's build, a packed-consumer check and release verification. Development reads a gitignored `.env` (see `.env.example`): `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` points the browser tests at a Chromium (the bundled fallback runs only on Linux x64), `I18N_REPORT_DIR` is where the browser report and screenshots land, `PORT` is the port of `bun run serve`. `bun publish` runs `prepublishOnly`, which is `bun run check`.

## License

[MIT](LICENSE)
