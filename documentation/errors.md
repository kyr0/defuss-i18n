# Errors and diagnostics

Every error the library throws starts with `defuss-i18n:`. Structural problems are reported by `validateI18n` as diagnostics with a `code`. `bind` and `rescan` turn the same diagnostics into one `invalid component` error.

## Validator diagnostics

`validateI18n(root, { locales, values })` returns `{ code, message, element }[]`. The codes marked *coverage* only appear when you pass `locales` or `values`.

### Regions and sources

| Code | Meaning | Fix |
| --- | --- | --- |
| `EMPTY_TARGET` | `data-i18n-target=""` | give the region a name |
| `DUPLICATE_TARGET` | two regions share a name in one component | rename one; names are component-local |
| `INVALID_TARGET` | a `<template>` is marked as a target | target a live element; templates are sources |
| `OVERLAPPING_TARGET` | a target sits inside another target of the same component | make them siblings, or merge them into one region |
| `NESTED_OWNERSHIP` | a target contains a nested `data-i18n-component`, or a template's content contains a component or target | move the child component into the shell, or bind it outside the region |
| `INVALID_SOURCE` | `data-i18n-for` on something other than `<template>` | use `<template data-i18n-for>` |
| `MISSING_SOURCE` | a target has no templates | add at least the default-locale template |
| `MISSING_TARGET` | templates name a target that does not exist (reported on the root) | fix the `data-i18n-for` name or add the target |
| `SOURCE_INSIDE_TARGET` | a template sits inside the target it feeds | move it out; the first render would delete it |
| `NESTED_TEMPLATE` | a template contains another `<template>` | flatten it; morphing does not preserve nested template content |
| `DUPLICATE_VARIANT` | two templates for the same target, locale and plural category | delete one (common after loading a locale twice) |
| `MISSING_LOCALE` *coverage* | a target lacks a template for a required locale (`other` for count regions) | add the template |

### Plurals and values

| Code | Meaning | Fix |
| --- | --- | --- |
| `INVALID_PLURAL` | `data-i18n-plural` is not `zero`/`one`/`two`/`few`/`many`/`other` | use a CLDR category |
| `MISSING_COUNT` | plural templates exist but the target has no `data-i18n-count` | add `data-i18n-count="key"` to the target |
| `INVALID_PLURAL_SET` | a count region's locale has no `other` template, or mixes in an unqualified one | give every locale an `other`; mark all its templates with a category |
| `UNKNOWN_VALUE` | an empty `data-i18n-value`/`data-i18n-count`, or (*coverage*) a key not in `values` | name a declared value |

### Attributes and locales

| Code | Meaning | Fix |
| --- | --- | --- |
| `INVALID_LOCALE` | an unparseable locale in an attribute suffix, `data-i18n-remove-*`, or a missing/invalid `data-i18n-locale` | use a BCP 47 tag (`de-DE`, not `de_DE`) |
| `UNSUPPORTED_ATTRIBUTE` | `data-i18n-{x}-{locale}` or a removal for an attribute not in `TRANSLATABLE_ATTRIBUTES` (e.g. `aria-expanded`) | keep state attributes out of translation; see the [allowlist](api.md#translatable_attributes) |
| `CONFLICTING_ATTRIBUTE` | the same attribute and locale are declared twice, e.g. a value **and** `data-i18n-remove-{locale}` | keep one declaration |
| `MISSING_ATTRIBUTE_LOCALE` *coverage* | a translated attribute lacks a required locale | add `data-i18n-{attr}-{locale}` |

### Identity and references

| Code | Meaning | Fix |
| --- | --- | --- |
| `DUPLICATE_ID` | an `id` repeats inside one template | make ids unique |
| `DUPLICATE_KEY` | sibling elements share a `key` | keys must be unique among siblings |
| `IDENTITY_TAG_MISMATCH` | the same `id` or key path has different tags in different locale templates | keep the tag stable, or the node (and its state) is replaced on switch |
| `MISSING_ID_REFERENCE` | `label for`, `aria-labelledby` or `aria-describedby` in a template names an id that is neither in the template nor outside the live target (in the same document or shadow tree) | add the id to the template, or point at a shell element |

Raw-text slots (below) are rejected when rendering, not by the validator.

## Runtime errors

### Setup and loading order

| Message | Cause | Fix |
| --- | --- | --- |
| `load defuss-shadcn core.js or defuss-morph + defuss-query first` | a browser build ran before `df$` existed | import morph, then query (or shadcn core), then i18n, in that order |
| `load defuss-morph and defuss-query (or defuss-shadcn core.js) first` | `createDomI18n` got something without a `morph` capability | pass the real `df$` after morph has loaded |
| `another version is already installed` | two different defuss-i18n versions on one `df$` | ship one version |
| `component document needs a CustomEvent constructor` | the root's document has no window (e.g. a `DOMParser` document) | bind elements that live in a browsing context |

### Locale controller

| Message | Cause | Fix |
| --- | --- | --- |
| `locale must be a non-empty BCP 47 tag` (`RangeError`) | empty or non-string locale | pass a tag; invalid tags raise the engine's `RangeError` |
| `direction must be ltr or rtl` | a custom `direction` policy returned something else | return `'ltr'` or `'rtl'` |
| `controller is disposed` | a write, subscribe, load or bind after `dispose()` | create a new controller |
| `reentrant locale changes are unsupported; schedule a microtask` | `setLocale`/`refresh`/`loadLocale` from inside a subscriber | `queueMicrotask(() => locale.setLocale(tag))` |
| `listener already subscribed` | the same function subscribed twice | unsubscribe first or use a new function |
| `load commit must be synchronous` | the `commit` callback returned a promise | do async work in the loader; commit only installs |
| `locale committed, but one or more subscribers failed` (`AggregateError`) | one or more bindings or listeners threw while publishing | inspect `error.errors`; the new locale **is** active |

### Binding

| Message | Cause | Fix |
| --- | --- | --- |
| `bind requires an Element` | `bind(null, …)` or a non-element | pass the root element |
| `component already bound; reuse or dispose its binding` | a second live `bind` on one root, or `mount` over already-bound roots | keep the first binding, or `dispose()` it |
| `binding or controller is disposed` | `refresh`/`setValues`/`rescan` after disposal | bind again |
| `invalid component` | `bind`/`rescan` validation failed; each following line is `CODE: message` | fix the listed [diagnostics](#validator-diagnostics) |
| `reentrant binding refresh` | `afterRender` (or code it calls) refreshed the same binding | defer with `queueMicrotask` |
| `target was replaced; call binding.rescan()` | a region element was removed or replaced outside the library | `rescan()` after structural changes |

### Templates, plurals and values

| Message | Cause | Fix |
| --- | --- | --- |
| `no template for {target}/{locale}` | no template locale along the fallback chain | add a template or a fallback locale (this is why a locale with `fallback: []` fails) |
| `missing {target}/{locale}/{category} variant` | neither the plural category nor `other` exists for the chosen locale | add an `other` template |
| `plural count {key} must be a finite number` | the count value is missing, a string (e.g. already formatted) or `NaN`/`Infinity` | pass the raw number; display a formatted copy under another key |
| `missing interpolation value {key}` | a `data-i18n-value` slot has no value (note: `mount` passes no values) | supply it via `values`/`setValues`, or bind that component individually |
| `{key} must be a primitive interpolation value` | an object, array, `null` or function as a value | pass a string, number or boolean |
| `interpolation slot {key} must contain text only` | a slot element has child elements | move the children out; the slot is overwritten |
| `interpolation slot {key} cannot be a raw-text <tag>` | a slot on `script`, `style`, `xmp`, `iframe`, `noembed`, `noframes`, `noscript` or `plaintext` | put the slot on a normal element; see [security](security.md#how-values-stay-literal) |

### Attributes

| Message | Cause | Fix |
| --- | --- | --- |
| `no {attribute} variant for {locale}` | a translated attribute has no variant along the fallback chain | add the locale or a fallback variant |
| `conflicting {attribute}/{locale} variants` | a value and a removal for the same attribute and locale | keep one |
| `cannot remove localized {attribute}` | `data-i18n-remove-*` lists an attribute outside the allowlist | remove only `TRANSLATABLE_ATTRIBUTES` |

### Renderers

| Message | Cause | Fix |
| --- | --- | --- |
| `renderer must return an HTML string synchronously` | `render` returned a promise or non-string | compute data beforehand; render synchronously |
| `afterRender must be synchronous` | `afterRender` returned a promise | start async work without returning it, or schedule it |
| `full renderer cannot own nested components` | the renderer's root contains a `data-i18n-component` | keep child components outside renderer roots |
| `renderer cannot introduce nested components or templates` | renderer output contains `data-i18n-component` or `<template>` | render plain markup |

## Partial failure

Within one component, template selection, plural selection, attribute choice and value checks all finish before the first live write. So any error above that is raised during preparation leaves that component untouched. Errors in `afterRender`, in the morph peer's lifecycle callbacks or in other components can leave a page partly switched. The locale itself stays committed, and the next successful render brings the component in line.
