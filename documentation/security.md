# Security model

defuss-i18n moves markup from templates into the live page. That makes it an HTML pipeline, so it matters which inputs are trusted. In short: **markup is trusted; values are not.**

## Trust boundaries

| Input | Trust | Why |
| --- | --- | --- |
| Template markup (`<template data-i18n-for>`) | **trusted, like your own HTML** | becomes live DOM with all its attributes, including `on*` handlers and URLs |
| HTML loaded in a `loadLocale` commit | **trusted** | appended as templates; same as above |
| Renderer output (`render(context)`) | **trusted** | parsed as HTML and morphed into the root |
| `data-i18n-{attr}-{locale}` values (`href`, `src`, ...) | **trusted** | written verbatim; URLs are not checked, so a `javascript:` URL in an `href` translation stays one |
| Interpolation values (`values`, `setValues`) | **untrusted is fine** | inserted only as literal text |

The library is not a sanitizer. If translators, a CMS or users can edit templates, sanitize that HTML with a maintained sanitizer such as DOMPurify **before** it reaches the page or a load commit, and review URL-valued attribute translations.

## How values stay literal

A `data-i18n-value` slot receives its value as a text node:

```html
<template data-i18n-for="greeting" data-i18n-locale="en">Hello <span data-i18n-value="name"></span></template>
```

```js
bindI18n(root, locale, { values: { name: '<img src=x onerror=alert(1)>' } });
// renders: Hello <span data-i18n-value="name">&lt;img src=x onerror=alert(1)&gt;</span>
```

- Values must be strings, numbers or booleans. Objects throw, so nothing is implicitly stringified through `toString`.
- Slots must have no child elements, so a value can never wipe out markup inside the slot.
- Region and renderer output passes through HTML serialization before it is morphed, and serialization escapes text. The exceptions are the **raw-text elements** `script`, `style`, `xmp`, `iframe`, `noembed`, `noframes`, `noscript` and `plaintext`, whose content is written out unescaped. A slot on one of those elements could close the element and inject markup, so such slots throw `cannot be a raw-text <…>` before anything is written. `textarea` and `title` slots are safe and allowed.

The browser suite checks this with real script-execution payloads in every shipped build.

## Renderers

A renderer returns HTML, so concatenating untrusted strings into it is an injection bug. Put dynamic text in slots instead. Slots work inside renderer output too:

```js
bindI18n(root, locale, {
  getState: () => state,
  values: state => ({ name: state.name }),
  render: () => '<p>Hello <span data-i18n-value="name"></span></p>',   // safe for any name
});
```

If you must build HTML from data, escape it first:

```js
const escapeHtml = value => String(value).replace(/[&<>"']/g, character =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
```

## Content Security Policy

The shipped bundles and both peers contain no `eval` or `new Function`, so `script-src` needs no `'unsafe-eval'`. Inline event-handler attributes in your templates (`onclick="…"`) are subject to your CSP like any other inline handler. Prefer `addEventListener` on keyed elements, which keep their listeners across switches.

## What is deliberately out of scope

- Sanitizing template, renderer or loaded HTML.
- Validating URLs in translated attributes.
- Protecting against a compromised peer (`df$`): the library calls whatever `df$` the page installed.
