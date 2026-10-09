# Agent memory

<!-- One tagged line per durable fact NOT derivable from code, git or docs:
- VERIFIED[toolchain] human approved migrating npm → bun + oxlint + pkgroll (2026-10-05); Node still runs tests (`node --test`) because consumers run Node; esbuild stays BC pkgroll 2.28 has no IIFE output.
- VERIFIED[types] NOT `typeof <namespace import>` in exported types BC pkgroll's dts bundler emitted invalid `declare const X: typeof <Type>` chunks (TS2693); scripts/package-tests.mjs emits consumer declarations to catch it.
- VERIFIED[tests/browser-suite.js] new DOM behavior → a scenario in tests/browser-suite.js, NOT a separate runner BC tests/browser.test.mjs runs that one suite unchanged against all.js|all.min.js|global.min.js|core.
- VERIFIED[documentation] document new public surface in the same change BC tests/docs.test.mjs fails IF an export|validator code|error stem is missing from api.md|errors.md OR a relative link|anchor breaks.
- UNKNOWN[coverage.dom] src/dom.ts + src/validate.ts coverage unmeasured BC c8 remaps only locale.ts+attributes.ts from dist/core.js and browser V8 coverage is NOT collected; post-pkgroll branch 100% ≠ tsc-era 96.8%.
- VERIFIED[docs/] `bun run check` needs cdn.jsdelivr.net BC the site e2e loads defuss-shadcn and defuss-i18n from jsDelivr; a version bump there needs new SRI hashes (CLI_GIST sri).
- VERIFIED[defuss-shadcn@0.9.8] .mk-code-block tabs show panels only for value npm|pnpm|bun BC its CSS hard-codes those three; other tabs → Tabs component, one code block per panel.
- UNKNOWN[peers] defuss-i18n with defuss-query|defuss-morph 0.2.0 untested BC npm latest is 0.2.0 (2026-10-08), outside the ^0.1.x peer ranges; install docs pin the ranges.
