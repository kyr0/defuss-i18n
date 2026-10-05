# Architecture

| Module | Owns | Dependency |
| --- | --- | --- |
| locale | canonical tags, fallback, immutable revisions, phase ordering, async tickets, Intl | ECMAScript platform |
| attributes | content-attribute policy and locale suffix parsing | locale primitives |
| validate | authoring diagnostics and DOM inspection | locale/attribute primitives |
| dom | ownership, source capture, plan preparation, query writes, lifecycle | injected df$ runtime |
| core | side-effect-free exports/injection | internal modules |
| index | npm convenience binding | actual defuss-query peer |
| all | explicit browser installation at df$.i18n | installed query/morph capabilities |

There is one reconciler: defuss-morph. Live translation content/attribute writes use defuss-query. Native DOM APIs inspect markup, clone source fragments and create detached preparation containers. No second diff algorithm, virtual-DOM requirement, reactive store, global locale singleton or observer exists.

## Projection

Commit a canonical immutable locale revision. Bindings read current application state once; select immutable template sources through fallback and native plurals; prepare literal values and localized attributes on detached clones; validate all plans; morph owned regions; write shell content attributes/locale metadata; invoke afterRender; dispatch per-component completion. After render subscriptions, notify ordinary subscribers. Aggregate failures after all subscribers have run.

This synchronous pipeline is not a DOM transaction. Source preparation prevents avoidable partial writes within a binding; user callbacks/peer lifecycle can still fail or observe intermediate mutations. No cross-component rollback is claimed.

## Ownership and loading

Durable shells own native state. Translation regions own complete descendant markup and cannot overlap or contain child component boundaries. Parents ignore marked children. Full HTML renderers own their root contents and cannot introduce/own nested components. Sources remain inert templates, captured at bind/rescan and never moved. Reject nested templates because peer reconciliation does not preserve their content. Attribute shorthand targets content, never runtime state/ID references.

Async loaders stage data without side effects. An abort signal and request ticket identify the newest work; only that ticket may install/publish. Synchronous updates, even no-ops, invalidate pending tickets. Read current application state after loading. Explicit disposal releases subscriptions; weak root registration catches double bindings without globally retaining removed elements. No implicit unmount detection or shadow piercing.

## Shipping and proof

pkgroll builds the npm entries from `package.json#exports`: ESM, CommonJS and condition-specific declarations. esbuild bundles only internal code into the browser ESM and classic-script artifacts, because pkgroll has no IIFE output. Query/morph stay external. Ship license/version banners, maps, raw/gzip/Brotli stats and source hashes. Gate release on actual distribution browser tests with real peers, DOM-free tests, strict consumer types, packed imports and artifact freshness. Do not infer runtime behavior from compilation or claim DOM-adapter coverage from the core-only V8 report.

## Limits

No translation service, ICU message parser, fetch singleton, sanitizer, framework binding, native-state reconstruction, whole-page rollback, implicit input-state control, arbitrary attribute translation or sibling-locale negotiation. Templates/renderer HTML/URL attributes are trusted input. Native Intl depends on engine ICU data; direction has an explicit override. Contract validation cannot prove translation quality.
