# Changelog

## Unreleased

- Reject interpolation slots on raw-text elements; serialized region/renderer values could otherwise inject markup.
- Resolve validator ID references within the root's shadow/detached tree, so valid shadow-root components bind.
- Detect overlapping targets for roots bound without `data-i18n-component`.
- `setValues` keeps a map committed once its values were projected, matching locale commit semantics.
- Documentation: getting started, state and ownership, lazy loading, security model, design rationale, complete API reference and errors/diagnostics reference; a docs test keeps exports, messages, codes and links in sync.
- Toolchain: bun replaces npm (`bun.lock`, `bun run check`, `bun publish`); oxlint joins strict tsc in `lint`; pkgroll builds the npm entries while esbuild keeps the browser bundles.
- The `defuss-i18n`, `defuss-i18n/core` and `defuss-i18n/global` specifiers are unchanged, but `dist/` now holds bundled entries only: CommonJS moved from `dist/cjs/*.js` to `dist/*.cjs` (`.d.cts` types), and per-module files such as `dist/locale.js` are gone. Deep imports of those paths break; import from the package entries.
- `BrowserI18n` lists `df$.i18n` members explicitly and as readonly, matching the frozen runtime object; bundled declarations stay valid for consumers with `skipLibCheck: false`.
- Demo: rebuilt from defuss-shadcn 0.9.7 components (site header, hero, cards, toggle groups, dialog, footer) and loads defuss-shadcn and the released defuss-i18n 0.1.0 from jsDelivr instead of `dist/` and `node_modules/`. The browser test runs it as published and with the checkout's build, and `scripts/verify.mjs` requires exact versions in its CDN URLs.
- Docs: install from npm with the peers inside their ranges (`defuss-query@^0.1.0 defuss-morph@^0.1.1`); a bare install now pulls the out-of-range 0.2.0 peers.
- Browser tests fail with an actionable message instead of ENOEXEC when the Linux-x64-only Sparticuz fallback cannot run.

## 0.1.0 (2026-10-01)

Initial standalone release: DOM-free locale controllers, HTML-template regions, localized content attributes/removal, literal interpolation, native plurals/formatting, state-renderer hooks, explicit ownership/lifecycle, latest-request loading, authoring diagnostics, defuss-shadcn runtime reuse, ESM/CJS/browser distributions, MDX/agent docs, demos and publication verification.
