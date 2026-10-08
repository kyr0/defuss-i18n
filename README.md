# defuss-i18n

[![CI](https://github.com/kyr0/defuss-i18n/actions/workflows/verify.yml/badge.svg)](https://github.com/kyr0/defuss-i18n/actions/workflows/verify.yml)
[![License](https://img.shields.io/github/license/kyr0/defuss-i18n)](LICENSE)

HTML-authored localization for pages built on defuss-query and defuss-morph, including defuss-shadcn: locale variants live in your markup, and a language switch patches only the regions a component owns.

## TL;DR

Swapping translated markup wholesale destroys the elements inside it, and with them focus, text selection and half-typed input. defuss-i18n keeps each locale's markup in inert `<template>` elements next to the default HTML and morphs only the translated regions in place, so that state survives a switch and the page shows its default language without JavaScript.

- Locale variants per region as `<template data-i18n-for data-i18n-locale>`; content attributes (`alt`, `title`, `aria-label`, `href` and 12 more) through `data-i18n-{attribute}-{locale}`.
- Canonical BCP 47 tags with ordered fallback (`zh-Hant-TW → zh-Hant → zh → en`), native `Intl` number and date formatting, and CLDR plural templates.
- Literal-text value slots, authoring diagnostics with `validateI18n`, and latest-request-wins lazy loading of locale data.
- Isolated controllers with no import-time globals; ESM, CommonJS, browser ESM and classic-script builds, about 6 KB gzip minified with the peers external.

## Quick start

Requirements: Node.js >= 22 and, for development, bun 1.4.2. The peers are defuss-query `^0.1.0` and defuss-morph `^0.1.1`.

Run the demo from a checkout of this repository:

```bash
bun run serve
```

Open <http://127.0.0.1:8080/examples/> and switch languages: the heading, image and cart text change, while the open settings dialog keeps its edited name field. The demo is built from defuss-shadcn 0.9.7 components and loads defuss-shadcn and the released defuss-i18n 0.1.0 from jsDelivr, so it needs network access but no install or build; any static file server can serve `examples/`.

Install the package next to its peers, with the peers inside their supported ranges:

```bash
bun add defuss-i18n defuss-query@^0.1.0 defuss-morph@^0.1.1
```

```js
import { createI18n } from 'defuss-i18n';

const locale = createI18n({ locale: 'de-DE' });
console.log(locale.locale, locale.formatNumber(1234.5)); // de-DE 1.234,5
```

A bare `bun add defuss-query defuss-morph` installs their latest releases, which can fall outside the peer ranges (0.2.0 does). To try unreleased changes, run `bun run build && bun pm pack` in this checkout and add the tarball instead of `defuss-i18n`.

## Usage

### Translate a region of a component

```html
<section id="welcome" data-i18n-component>
  <div data-i18n-target="intro"><h2 key="heading">Welcome</h2></div>
  <template data-i18n-for="intro" data-i18n-locale="en"><h2 key="heading">Welcome</h2></template>
  <template data-i18n-for="intro" data-i18n-locale="de"><h2 key="heading">Willkommen</h2></template>
</section>
```

```js
import { createI18n, bindI18n } from 'defuss-i18n';

const locale = createI18n({ locale: 'en', fallback: ['en'] });
const welcome = bindI18n(document.getElementById('welcome'), locale);
locale.setLocale('de'); // the <h2> now reads "Willkommen"; it is the same element as before
welcome.dispose();      // when the component is removed
```

### Translate attributes outside a region

```html
<button data-i18n-component aria-label="Close"
        data-i18n-aria-label-en="Close" data-i18n-aria-label-de="Schließen">×</button>
```

After `setLocale('de')` the button's `aria-label` is `Schließen`; its other attributes and state are untouched. `data-i18n-remove-{locale}="title"` removes an attribute in one locale.

### Show values and plurals

```html
<article id="cart" data-i18n-component>
  <p data-i18n-target="quantity" data-i18n-count="count">1 item</p>
  <template data-i18n-for="quantity" data-i18n-locale="en" data-i18n-plural="one"><span data-i18n-value="label"></span> item</template>
  <template data-i18n-for="quantity" data-i18n-locale="en" data-i18n-plural="other"><span data-i18n-value="label"></span> items</template>
  <template data-i18n-for="quantity" data-i18n-locale="de" data-i18n-plural="one"><span data-i18n-value="label"></span> Artikel</template>
  <template data-i18n-for="quantity" data-i18n-locale="de" data-i18n-plural="other"><span data-i18n-value="label"></span> Artikel</template>
</article>
```

```js
let cart = { count: 1200 };
const binding = bindI18n(document.getElementById('cart'), locale, {
  getState: () => cart,
  values: state => ({ count: state.count, label: locale.formatNumber(state.count) }),
});
// "1,200 items" in en, "1.200 Artikel" in de; after cart = { count: 1 } and binding.refresh(): "1 item"
```

Values are always inserted as literal text. The [getting-started guide](documentation/getting-started.md) continues with locale negotiation, a language switcher and validation; the [documentation index](documentation/index.md) lists every guide and reference.

## Configuration

The library reads no environment or global configuration: each controller is configured by `createI18n({ locale, fallback, direction })` and each component by the options of `bind` (see the [API reference](documentation/api.md)).

Development reads a gitignored `.env` (see `.env.example`), which `make` loads through `bun --env-file`:

| Key | Meaning | Default |
| --- | --- | --- |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Chromium for the browser tests | Playwright's installed Chromium, else (Linux x64 only) the pinned Sparticuz package |
| `I18N_REPORT_DIR` | directory for the browser report and screenshot | `test-results` (`make e2e` uses `output`) |
| `PORT` | port of `bun run serve` | `8080` |

## How it works

A controller holds the current locale as an immutable snapshot. When it changes, every bound component selects one template per region through the fallback chain and plural rules, prepares attributes and values on detached copies, and then lets defuss-morph patch the live region through defuss-query, which keeps matched elements and their state. [ARCH.md](ARCH.md) describes the modules, write ordering, failure behavior and trust boundaries.

## Development

```bash
make setup && make verify
```

`make verify` runs oxlint and strict TypeScript, the unit and docs tests with coverage, the browser suite against all four shipped builds in real Chromium, a packed-consumer check and release verification. The bundled Chromium fallback runs only on Linux x64; elsewhere install Playwright's Chromium (`bunx playwright install chromium`) or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` in `.env`. `bun publish` runs `prepublishOnly`, which is `bun run check`.

Start with [ARCH.md](ARCH.md), then the [design rationale](documentation/design.md) and the [authoring contract](documentation/component-skill.md).

## License

MIT, see [LICENSE](LICENSE).
