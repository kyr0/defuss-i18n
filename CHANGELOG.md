# Changelog

## Unreleased

- Reject interpolation slots on raw-text elements; serialized region/renderer values could otherwise inject markup.
- Resolve validator ID references within the root's shadow/detached tree, so valid shadow-root components bind.
- Detect overlapping targets for roots bound without `data-i18n-component`.
- `setValues` keeps a map committed once its values were projected, matching locale commit semantics.
- Documentation: getting started, state and ownership, lazy loading, security model, design rationale, complete API reference and errors/diagnostics reference; a docs test keeps exports, messages, codes and links in sync.
- Browser tests fail with an actionable message instead of ENOEXEC when the Linux-x64-only Sparticuz fallback cannot run.

## 0.1.0 (2026-10-01)

Initial standalone release: DOM-free locale controllers, HTML-template regions, localized content attributes/removal, literal interpolation, native plurals/formatting, state-renderer hooks, explicit ownership/lifecycle, latest-request loading, authoring diagnostics, defuss-shadcn runtime reuse, ESM/CJS/browser distributions, MDX/agent docs, demos and publication verification.
