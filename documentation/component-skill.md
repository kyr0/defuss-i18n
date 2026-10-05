# Author HTML with defuss-i18n

Apply this contract when making defuss-shadcn/plain HTML locale-aware. Read [README](../README.md) for the complete API.

1. Reuse defuss-shadcn core's df$; load i18n afterwards. Without shadcn load morph 0.1.1, query 0.1.0, then i18n in the same ordered module sequence.
2. Mark durable roots `[data-i18n-component]`; give translation targets unique component-local names. Keep native modal/popover shells, imperative state/initialization and child boundaries outside translated regions.
3. Author `<template data-i18n-for="name" data-i18n-locale="de">…</template>` per locale outside its target. Provide no-JS default HTML. Preserve IDs, sibling keys and tags where identity matters. Do not nest targets/components/templates in a region.
4. Translate normal attributes in templates; use `data-i18n-title-de`, `data-i18n-aria-label-de`, `data-i18n-src-de`, etc. for isolated shell attributes. Preserve ARIA state, ID references, input state and runtime classes. Explicit removal uses `data-i18n-remove-de="title"`; empty means present/empty.
5. Use text-only `[data-i18n-value="name"]` slots for primitive dynamic values. Never concatenate untrusted strings into renderer HTML. Plural targets use `[data-i18n-count="count"]`; require an `other` plural template per locale, then optional native categories.
6. Create an isolated controller, bind once, call setLocale to switch. Refresh after application-state updates, rescan after source/target changes, dispose on unmount. Newly mounted components receive the current locale immediately.
7. Use full state rendering only with a complete application snapshot. Return HTML synchronously from render; use afterRender/query.prop for explicit live-property control. Keep children outside its owned root.
8. Validate with `validateI18n(root, { locales, values })`, resolve every diagnostic, and verify linguistic quality separately. Test language switching with a modal dialog, checked checkbox and edited input/focus/selection.

Use pure TypeScript/JavaScript, HTML and CSS. No Astro. See [MDX](i18n.mdx) and [runnable demo](../examples/index.html).
