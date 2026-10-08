# Agent memory

<!-- One tagged line per durable fact NOT derivable from code, git or docs:
- VERIFIED[toolchain] human approved migrating npm → bun + oxlint + pkgroll (2026-10-05); Node still runs tests (`node --test`) because consumers run Node; esbuild stays BC pkgroll 2.28 has no IIFE output.
- VERIFIED[types] NOT `typeof <namespace import>` in exported types BC pkgroll's dts bundler emitted invalid `declare const X: typeof <Type>` chunks (TS2693); scripts/package-tests.mjs emits consumer declarations to catch it.
- VERIFIED[tests/browser-suite.js] new DOM behavior → a scenario in tests/browser-suite.js, NOT a separate runner BC tests/browser.test.mjs runs that one suite unchanged against all.js|all.min.js|global.min.js|core.
- VERIFIED[documentation] document new public surface in the same change BC tests/docs.test.mjs fails IF an export|validator code|error stem is missing from api.md|errors.md OR a relative link|anchor breaks.
- UNKNOWN[coverage.dom] src/dom.ts + src/validate.ts coverage unmeasured BC c8 remaps only locale.ts+attributes.ts from dist/core.js and browser V8 coverage is NOT collected; post-pkgroll branch 100% ≠ tsc-era 96.8%.
- VERIFIED[examples] `bun run check` needs cdn.jsdelivr.net BC the demo e2e loads defuss-i18n and defuss-shadcn 0.9.7 from jsDelivr (gh path only: npm stops at 0.9.4, npm path 404 on 2026-10-08).
- UNKNOWN[peers] defuss-i18n with defuss-query|defuss-morph 0.2.0 untested BC npm latest is 0.2.0 (2026-10-08), outside the ^0.1.x peer ranges; install docs pin the ranges.
