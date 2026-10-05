# Release verification — defuss-i18n 0.1.0

Verified 2026-10-01 with `npm run check` (exit 0).

- Node: v24.19.0; TypeScript: 5.8.3.
- Peers: defuss-query 0.1.0, defuss-morph 0.1.1. Real engine; no mocks or vendored snapshot.
- Unit tests: 27 passed; zero failures/skips.
- Chromium: 153.0.8010.0.
- Browser behavior: 168 scenario executions (all.js: 42, all.min.js: 42, global.min.js: 42, core: 42), plus missing-runtime and interactive-demo checks; all passed.
- Strict source/API type checks: passed, including positive/negative state/interpolation/renderer cases.
- npm pack: 100 shipped files; peer-free core imports, ESM/CJS root imports with DOM/global access guards, strict NodeNext .mts/.cts consumers passed.
- Release verification: source freshness, version agreement, byte budgets, source maps, peer exclusion and required artifacts passed.
- Locale/attribute core coverage: 100% lines/statements, 100% functions, 96.8% branches. This is core-only coverage, not whole-package DOM coverage.
- Minified browser ESM: 16088 bytes, 6153 gzip bytes, 5439 Brotli bytes. External query/morph peers excluded.
- Demo screenshot inspected for layout; included under test-results/demo.png.

Behavior verified includes open modal/focus/selection preservation, edited forms, keyed identity/listeners, nested ownership, canonical/fallback locales, content attributes/removal, literal interpolation, native plural categories, latest state after lazy loading, explicit form properties, cross-document/shadow roots, cleanup/rebinding, source validation, version reuse and all shipping formats.

Browser execution covered Chromium. Firefox/Safari and a live defuss-shadcn docs-site integration were not executed. The shadcn integration uses the same injected callable query/morph runtime contract. Templates/renderer HTML remain trusted authoring input; no DOM transaction or sanitizer is claimed.
