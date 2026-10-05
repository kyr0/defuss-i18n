# Getting started

## 1. Install

With a bundler:

```sh
npm install defuss-i18n defuss-query defuss-morph
```

`defuss-query` and `defuss-morph` are peer dependencies: your app and defuss-i18n share a single copy of each.

Without a bundler, load the peers first and then a browser build. If the page already loads defuss-shadcn's `core.js`, skip the two peer imports because shadcn already provides `df$`:

```html
<script type="module">
  await import('https://cdn.jsdelivr.net/npm/defuss-morph@0.1.1/dist/all.min.js');
  await import('https://cdn.jsdelivr.net/npm/defuss-query@0.1.0/dist/all.min.js');
  await import('./vendor/defuss-i18n/dist/all.min.js'); // installs df$.i18n
</script>
```

Use `dist/global.min.js` with a classic `<script>` tag instead. Load order matters: importing defuss-i18n before `df$` exists throws `load defuss-shadcn core.js or defuss-morph + defuss-query first`.

## 2. Mark up a component

```html
<section id="welcome" data-i18n-component>
  <div data-i18n-target="intro">
    <h2 key="heading">Welcome</h2>
    <p key="lead">Your markup is the translation catalog.</p>
  </div>
  <template data-i18n-for="intro" data-i18n-locale="en">
    <h2 key="heading">Welcome</h2>
    <p key="lead">Your markup is the translation catalog.</p>
  </template>
  <template data-i18n-for="intro" data-i18n-locale="de">
    <h2 key="heading">Willkommen</h2>
    <p key="lead">Dein HTML ist der Übersetzungskatalog.</p>
  </template>
  <button aria-label="Close" data-i18n-aria-label-en="Close" data-i18n-aria-label-de="Schließen">×</button>
</section>
```

- `data-i18n-component` marks the **root**. Everything in the root is owned by this component, except nested components.
- `data-i18n-target="intro"` marks a **region**. On a locale switch the region's whole content is morphed to the matching template.
- `<template data-i18n-for="intro" data-i18n-locale="…">` holds one locale's version of that region. Templates are inert: browsers don't render them, run their scripts or load their images.
- The live markup inside the target is the **no-JS default**. Keep it identical to the default-locale template.
- `key` attributes tell the morph which elements are "the same" across locales, so they keep their identity, listeners and state.
- Attributes on elements outside a region are translated with `data-i18n-{attribute}-{locale}`. See [supported attributes](api.md#html-attributes).

## 3. Bind it

```js
import { createI18n, bindI18n } from 'defuss-i18n';

const locale = createI18n({ locale: 'en', fallback: ['en'] });
const welcome = bindI18n(document.getElementById('welcome'), locale);

locale.setLocale('de'); // synchronous: the DOM shows German when this returns
```

In the browser build, the same functions are on `df$.i18n`: `df$.i18n.createI18n(...)` and `df$.i18n.bind(...)`.

To bind every marked component under a node at once:

```js
const components = df$.i18n.mount(document, locale); // or mountI18n(document, locale)
// later:
components.dispose();
```

`mount` passes no options. A component that needs `values`, `getState` or a renderer has to be bound on its own with `bind`, before or instead of `mount`.

## 4. Pick the initial locale

Match the visitor's preferences against the locales you ship:

```js
import { createI18n, resolveLocale } from 'defuss-i18n';

const supported = ['en', 'de', 'ar'];
const preferred = navigator.languages
  .map(tag => resolveLocale(supported, tag, []))
  .find(Boolean) ?? 'en';
const locale = createI18n({ locale: preferred, fallback: ['en'] });
```

For a preference list of `fr-FR, de-CH, en` this returns `de`. Matching walks parent tags (`de-CH → de`) and never guesses sibling locales: `fr-CA` does not match `fr-FR`.

## 5. Add a language switcher

```html
<nav aria-label="Language">
  <button data-locale="en" lang="en">English</button>
  <button data-locale="de" lang="de">Deutsch</button>
</nav>
```

```js
for (const button of document.querySelectorAll('[data-locale]')) {
  button.addEventListener('click', () => locale.setLocale(button.dataset.locale));
}
locale.subscribe(({ locale: tag, direction }) => {
  document.documentElement.lang = tag;
  document.documentElement.dir = direction;
});
```

Each bound root gets `lang` and `dir` set for the requested locale; a right-to-left locale such as `ar` gets `dir="rtl"`. Each region gets the locale it actually rendered, which differs when it fell back. The library does not touch `<html>`, so set that in a subscriber as shown above.

## 6. Dynamic values and plurals

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
const cartBinding = bindI18n(document.getElementById('cart'), locale, {
  getState: () => cart,
  values: state => ({ count: state.count, label: locale.formatNumber(state.count) }),
});
// "1,200 items" in en, "1.200 Artikel" in de

cart = { count: 1 };
cartBinding.refresh(); // "1 item"
```

`data-i18n-count` names the value that selects the plural category, and that value must be a finite **number**. Show a formatted version through a separate key (`label` above). Passing `formatNumber(...)` as the count throws `plural count count must be a finite number`. Values are always inserted as literal text, never parsed as HTML.

## 7. Validate during development

```js
import { validateI18n } from 'defuss-i18n';

for (const root of document.querySelectorAll('[data-i18n-component]')) {
  const issues = validateI18n(root, { locales: ['en', 'de'], values: ['count', 'label'] });
  for (const issue of issues) console.warn(issue.code, issue.message, issue.element);
}
```

`bind` and `rescan` already reject structurally invalid components. Passing `locales` and `values` also checks coverage: every target and translated attribute has every locale, and every slot names a declared value. Each code is explained in [errors and diagnostics](errors.md).

## 8. Clean up

```js
welcome.dispose();     // stop following locale changes; the DOM stays as-is
cartBinding.dispose();
locale.dispose();      // cancels a pending load and drops all subscribers
```

Nothing watches the DOM for removed elements, so dispose bindings when your app removes a component. A disposed root can be bound again.

Next: [state and ownership](state-and-ownership.md) explains what survives a switch and how to structure stateful components.
