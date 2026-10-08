# Release verification: defuss-i18n 0.2.0

Verified 2026-10-08 with `bun run check` (exit 0), the command `prepublishOnly` runs before `bun publish`.

- Toolchain: bun 1.4.2, Node v24.14.0, TypeScript 5.8.3, oxlint with `--deny-warnings`, Playwright 1.58.2.
- Peers: defuss-query 0.1.0 and defuss-morph 0.1.1, the real engines; no mocks and no vendored snapshot.
- Unit and docs tests: 31 passed, 0 failed, 0 skipped.
- Chromium: 153.0.8010.12.
- Browser behavior: 192 scenario executions (48 each in all.js, all.min.js, global.min.js and core), the missing-runtime check and the interactive demo in two passes, all passed. The "published" pass loaded defuss-i18n 0.1.0 from jsDelivr; the "checkout" pass loaded this build's `dist/all.min.js` (version 0.2.0).
- Strict source and consumer types: passed, including the positive and negative state, interpolation and renderer cases.
- Packed consumer: 55 files; peer-free core imports, ESM and CommonJS root imports under DOM and global access guards, strict NodeNext `.mts`/`.cts` consumers passed.
- Release verification: source freshness, version agreement, byte budgets, source maps, peer exclusion, the pinned demo runtime and the required artifacts passed.
- Coverage of `src/locale.ts` and `src/attributes.ts`, remapped from `dist/core.js`: 100% lines, statements, functions and branches. This is core-only coverage, not whole-package DOM coverage.
- Minified browser ESM: 16242 bytes, 6202 gzip bytes, 5499 Brotli bytes, with the query and morph peers excluded.
- Demo screenshots (`test-results/demo-*.png`) inspected for layout in English and Arabic.

Browser execution covered Chromium only; Firefox and Safari were not run. The demo runs on defuss-shadcn 0.9.7's `df$` runtime, while the browser suite injects the peers above. Template and renderer HTML remain trusted authoring input; no DOM transaction or sanitizer is claimed.
