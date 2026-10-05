# Episodes

<!-- Newest last. The gate appends FAIL|DONE|FINDING and keeps the last 100 entries (git keeps older ones).
Agents append `<UTC ISO> s=<session> LESSON <Signan>` only for a falsified HYPOTHESIS, a dead end, or a root cause.
A lesson recurring ≥2 → test | .agents/VERIFY.py rule | MEMORY line, then delete its lines. -->
2026-10-05T00:07:16Z s=ff0b7b23 LESSON vae verify WHEN ∅ git: toolchain flags pre-existing package-lock.json as newly introduced AND gate fingerprint is vacuous BC no history baseline → resolve by committing the lockfile in a git repo, NOT by deleting it
2026-10-05T00:11:25Z s=ff0b7b23 FAIL toolchain
2026-10-05T15:48:58Z s=ff0b7b23 FAIL prose,toolchain
2026-10-05T15:50:35Z s=ff0b7b23 FAIL toolchain
2026-10-05T17:41:06Z s=ff0b7b23 DONE fp=ef105229321b cov=100.0% paths=.github/workflows/ci.yml,AGENTS.md,ARCH.md,CHANGELOG.md(+40)
2026-10-05T17:41:06Z s=ff0b7b23 FINDING src/dom.ts:interpolatePlan learn=test: browser-suite 'raw-text interpolation slots are rejected' fails on the old dist, passes in all 4 builds
2026-10-05T17:41:06Z s=ff0b7b23 FINDING src/validate.ts:MISSING_ID_REFERENCE learn=test: browser-suite 'shadow-root ID references resolve in the shadow tree' fails on the old dist
2026-10-05T17:41:06Z s=ff0b7b23 FINDING src/validate.ts:OVERLAPPING_TARGET learn=test: browser-suite 'overlapping targets are rejected for an unmarked root' fails on the old dist
2026-10-05T17:41:06Z s=ff0b7b23 FINDING src/dom.ts:setValues learn=test: browser-suite 'values projected before an afterRender failure stay committed' fails on the old dist
2026-10-05T17:41:06Z s=ff0b7b23 FINDING tests/browser.test.mjs:launch learn=memory: launcher now throws an actionable message off Linux x64; CLI_GIST records the PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH command
2026-10-05T17:41:06Z s=ff0b7b23 FINDING src/all.ts:BrowserI18n learn=test: scripts/package-tests.mjs now emits consumer declarations for createDomI18n(df$) and df$.i18n; `satisfies Record<keyof typeof core, unknown>` makes a missing na
2026-10-05T17:41:06Z s=ff0b7b23 FINDING package.json:scripts.test:unit learn=verifier: c8 --exclude-after-remap maps dist/core.js back to src/locale.ts+attributes.ts; the gate's coverage floor would catch a regression to 0%
2026-10-05T17:41:06Z s=ff0b7b23 FINDING tests/types.mts:20 learn=verifier: oxlint now runs in lint/check; `void` keeps the type assertion (mutation: removing @ts-expect-error still fails tsc)
2026-10-05T17:41:06Z s=ff0b7b23 FINDING CHANGELOG.md:11 B02 learn=none: release-note accuracy; no mechanical check distinguishes exposed internal paths
2026-10-05T17:41:06Z s=ff0b7b23 FINDING documentation/getting-started.md:145 L03 learn=none: example consistency is judgment, not mechanically checkable
2026-10-05T17:41:06Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:3 L03 learn=none: prose consistency
2026-10-05T17:41:06Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:28 B02 learn=none: claims now match defuss-morph all.js takeUnkeyedMatch and the browser tests
2026-10-05T17:41:06Z s=ff0b7b23 FINDING documentation/lazy-loading.md:3 P07 learn=none: prose precision
2026-10-05T17:41:06Z s=ff0b7b23 FINDING documentation/security.md:15 B01 learn=none: removed unsupported claim
2026-10-05T17:41:06Z s=ff0b7b23 FINDING documentation/index.md learn=test: docs.test 'documentation index lists every documentation page' (mutation-checked)
2026-10-05T17:44:42Z s=ff0b7b23 DONE fp=98f42b90dc3c cov=100.0% paths=.github/workflows/ci.yml,AGENTS.md,ARCH.md,CHANGELOG.md(+27)
2026-10-05T17:44:42Z s=ff0b7b23 FINDING src/dom.ts:interpolatePlan learn=test: browser-suite 'raw-text interpolation slots are rejected' fails on the old dist, passes in all 4 builds
2026-10-05T17:44:42Z s=ff0b7b23 FINDING src/validate.ts:MISSING_ID_REFERENCE learn=test: browser-suite 'shadow-root ID references resolve in the shadow tree' fails on the old dist
2026-10-05T17:44:42Z s=ff0b7b23 FINDING src/validate.ts:OVERLAPPING_TARGET learn=test: browser-suite 'overlapping targets are rejected for an unmarked root' fails on the old dist
2026-10-05T17:44:42Z s=ff0b7b23 FINDING src/dom.ts:setValues learn=test: browser-suite 'values projected before an afterRender failure stay committed' fails on the old dist
2026-10-05T17:44:42Z s=ff0b7b23 FINDING tests/browser.test.mjs:launch learn=memory: launcher now throws an actionable message off Linux x64; CLI_GIST records the PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH command
2026-10-05T17:44:42Z s=ff0b7b23 FINDING src/all.ts:BrowserI18n learn=test: scripts/package-tests.mjs now emits consumer declarations for createDomI18n(df$) and df$.i18n; `satisfies Record<keyof typeof core, unknown>` makes a missing na
2026-10-05T17:44:42Z s=ff0b7b23 FINDING package.json:scripts.test:unit learn=verifier: c8 --exclude-after-remap maps dist/core.js back to src/locale.ts+attributes.ts; the gate's coverage floor would catch a regression to 0%
2026-10-05T17:44:42Z s=ff0b7b23 FINDING tests/types.mts:20 learn=verifier: oxlint now runs in lint/check; `void` keeps the type assertion (mutation: removing @ts-expect-error still fails tsc)
2026-10-05T17:44:42Z s=ff0b7b23 FINDING CHANGELOG.md:11 B02 learn=none: release-note accuracy; no mechanical check distinguishes exposed internal paths
2026-10-05T17:44:42Z s=ff0b7b23 FINDING documentation/getting-started.md:145 L03 learn=none: example consistency is judgment, not mechanically checkable
2026-10-05T17:44:42Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:3 L03 learn=none: prose consistency
2026-10-05T17:44:42Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:28 B02 learn=none: claims now match defuss-morph all.js takeUnkeyedMatch and the browser tests
2026-10-05T17:44:42Z s=ff0b7b23 FINDING documentation/lazy-loading.md:3 P07 learn=none: prose precision
2026-10-05T17:44:42Z s=ff0b7b23 FINDING documentation/security.md:15 B01 learn=none: removed unsupported claim
2026-10-05T17:44:42Z s=ff0b7b23 FINDING documentation/index.md learn=test: docs.test 'documentation index lists every documentation page' (mutation-checked)
2026-10-05T17:45:25Z s=ff0b7b23 DONE fp=df039b049189 cov=100.0% paths=.github/workflows/ci.yml,AGENTS.md,ARCH.md,CHANGELOG.md(+26)
2026-10-05T17:45:25Z s=ff0b7b23 FINDING src/dom.ts:interpolatePlan learn=test: browser-suite 'raw-text interpolation slots are rejected' fails on the old dist, passes in all 4 builds
2026-10-05T17:45:25Z s=ff0b7b23 FINDING src/validate.ts:MISSING_ID_REFERENCE learn=test: browser-suite 'shadow-root ID references resolve in the shadow tree' fails on the old dist
2026-10-05T17:45:25Z s=ff0b7b23 FINDING src/validate.ts:OVERLAPPING_TARGET learn=test: browser-suite 'overlapping targets are rejected for an unmarked root' fails on the old dist
2026-10-05T17:45:25Z s=ff0b7b23 FINDING src/dom.ts:setValues learn=test: browser-suite 'values projected before an afterRender failure stay committed' fails on the old dist
2026-10-05T17:45:25Z s=ff0b7b23 FINDING tests/browser.test.mjs:launch learn=memory: launcher now throws an actionable message off Linux x64; CLI_GIST records the PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH command
2026-10-05T17:45:25Z s=ff0b7b23 FINDING src/all.ts:BrowserI18n learn=test: scripts/package-tests.mjs now emits consumer declarations for createDomI18n(df$) and df$.i18n; `satisfies Record<keyof typeof core, unknown>` makes a missing na
2026-10-05T17:45:25Z s=ff0b7b23 FINDING package.json:scripts.test:unit learn=verifier: c8 --exclude-after-remap maps dist/core.js back to src/locale.ts+attributes.ts; the gate's coverage floor would catch a regression to 0%
2026-10-05T17:45:25Z s=ff0b7b23 FINDING tests/types.mts:20 learn=verifier: oxlint now runs in lint/check; `void` keeps the type assertion (mutation: removing @ts-expect-error still fails tsc)
2026-10-05T17:45:25Z s=ff0b7b23 FINDING CHANGELOG.md:11 B02 learn=none: release-note accuracy; no mechanical check distinguishes exposed internal paths
2026-10-05T17:45:25Z s=ff0b7b23 FINDING documentation/getting-started.md:145 L03 learn=none: example consistency is judgment, not mechanically checkable
2026-10-05T17:45:25Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:3 L03 learn=none: prose consistency
2026-10-05T17:45:25Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:28 B02 learn=none: claims now match defuss-morph all.js takeUnkeyedMatch and the browser tests
2026-10-05T17:45:25Z s=ff0b7b23 FINDING documentation/lazy-loading.md:3 P07 learn=none: prose precision
2026-10-05T17:45:25Z s=ff0b7b23 FINDING documentation/security.md:15 B01 learn=none: removed unsupported claim
2026-10-05T17:45:25Z s=ff0b7b23 FINDING documentation/index.md learn=test: docs.test 'documentation index lists every documentation page' (mutation-checked)
2026-10-05T17:45:39Z s=ff0b7b23 DONE fp=df6f963d74f7 cov=100.0% paths=.github/workflows/ci.yml,AGENTS.md,ARCH.md,CHANGELOG.md(+25)
2026-10-05T17:45:39Z s=ff0b7b23 FINDING src/dom.ts:interpolatePlan learn=test: browser-suite 'raw-text interpolation slots are rejected' fails on the old dist, passes in all 4 builds
2026-10-05T17:45:39Z s=ff0b7b23 FINDING src/validate.ts:MISSING_ID_REFERENCE learn=test: browser-suite 'shadow-root ID references resolve in the shadow tree' fails on the old dist
2026-10-05T17:45:39Z s=ff0b7b23 FINDING src/validate.ts:OVERLAPPING_TARGET learn=test: browser-suite 'overlapping targets are rejected for an unmarked root' fails on the old dist
2026-10-05T17:45:39Z s=ff0b7b23 FINDING src/dom.ts:setValues learn=test: browser-suite 'values projected before an afterRender failure stay committed' fails on the old dist
2026-10-05T17:45:39Z s=ff0b7b23 FINDING tests/browser.test.mjs:launch learn=memory: launcher now throws an actionable message off Linux x64; CLI_GIST records the PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH command
2026-10-05T17:45:39Z s=ff0b7b23 FINDING src/all.ts:BrowserI18n learn=test: scripts/package-tests.mjs now emits consumer declarations for createDomI18n(df$) and df$.i18n; `satisfies Record<keyof typeof core, unknown>` makes a missing na
2026-10-05T17:45:39Z s=ff0b7b23 FINDING package.json:scripts.test:unit learn=verifier: c8 --exclude-after-remap maps dist/core.js back to src/locale.ts+attributes.ts; the gate's coverage floor would catch a regression to 0%
2026-10-05T17:45:39Z s=ff0b7b23 FINDING tests/types.mts:20 learn=verifier: oxlint now runs in lint/check; `void` keeps the type assertion (mutation: removing @ts-expect-error still fails tsc)
2026-10-05T17:45:39Z s=ff0b7b23 FINDING CHANGELOG.md:11 B02 learn=none: release-note accuracy; no mechanical check distinguishes exposed internal paths
2026-10-05T17:45:39Z s=ff0b7b23 FINDING documentation/getting-started.md:145 L03 learn=none: example consistency is judgment, not mechanically checkable
2026-10-05T17:45:39Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:3 L03 learn=none: prose consistency
2026-10-05T17:45:39Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:28 B02 learn=none: claims now match defuss-morph all.js takeUnkeyedMatch and the browser tests
2026-10-05T17:45:39Z s=ff0b7b23 FINDING documentation/lazy-loading.md:3 P07 learn=none: prose precision
2026-10-05T17:45:39Z s=ff0b7b23 FINDING documentation/security.md:15 B01 learn=none: removed unsupported claim
2026-10-05T17:45:39Z s=ff0b7b23 FINDING documentation/index.md learn=test: docs.test 'documentation index lists every documentation page' (mutation-checked)
2026-10-05T17:46:04Z s=ff0b7b23 DONE fp=05f37d985519 cov=100.0% paths=.github/workflows/ci.yml,AGENTS.md,ARCH.md,CHANGELOG.md(+15)
2026-10-05T17:46:04Z s=ff0b7b23 FINDING src/dom.ts:interpolatePlan learn=test: browser-suite 'raw-text interpolation slots are rejected' fails on the old dist, passes in all 4 builds
2026-10-05T17:46:04Z s=ff0b7b23 FINDING src/validate.ts:MISSING_ID_REFERENCE learn=test: browser-suite 'shadow-root ID references resolve in the shadow tree' fails on the old dist
2026-10-05T17:46:04Z s=ff0b7b23 FINDING src/validate.ts:OVERLAPPING_TARGET learn=test: browser-suite 'overlapping targets are rejected for an unmarked root' fails on the old dist
2026-10-05T17:46:04Z s=ff0b7b23 FINDING src/dom.ts:setValues learn=test: browser-suite 'values projected before an afterRender failure stay committed' fails on the old dist
2026-10-05T17:46:04Z s=ff0b7b23 FINDING tests/browser.test.mjs:launch learn=memory: launcher now throws an actionable message off Linux x64; CLI_GIST records the PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH command
2026-10-05T17:46:04Z s=ff0b7b23 FINDING src/all.ts:BrowserI18n learn=test: scripts/package-tests.mjs now emits consumer declarations for createDomI18n(df$) and df$.i18n; `satisfies Record<keyof typeof core, unknown>` makes a missing na
2026-10-05T17:46:04Z s=ff0b7b23 FINDING package.json:scripts.test:unit learn=verifier: c8 --exclude-after-remap maps dist/core.js back to src/locale.ts+attributes.ts; the gate's coverage floor would catch a regression to 0%
2026-10-05T17:46:04Z s=ff0b7b23 FINDING tests/types.mts:20 learn=verifier: oxlint now runs in lint/check; `void` keeps the type assertion (mutation: removing @ts-expect-error still fails tsc)
2026-10-05T17:46:04Z s=ff0b7b23 FINDING CHANGELOG.md:11 B02 learn=none: release-note accuracy; no mechanical check distinguishes exposed internal paths
2026-10-05T17:46:04Z s=ff0b7b23 FINDING documentation/getting-started.md:145 L03 learn=none: example consistency is judgment, not mechanically checkable
2026-10-05T17:46:04Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:3 L03 learn=none: prose consistency
2026-10-05T17:46:04Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:28 B02 learn=none: claims now match defuss-morph all.js takeUnkeyedMatch and the browser tests
2026-10-05T17:46:04Z s=ff0b7b23 FINDING documentation/lazy-loading.md:3 P07 learn=none: prose precision
2026-10-05T17:46:04Z s=ff0b7b23 FINDING documentation/security.md:15 B01 learn=none: removed unsupported claim
2026-10-05T17:46:04Z s=ff0b7b23 FINDING documentation/index.md learn=test: docs.test 'documentation index lists every documentation page' (mutation-checked)
2026-10-05T17:46:21Z s=ff0b7b23 DONE fp=d3c3b03147de cov=100.0% paths=.github/workflows/ci.yml,AGENTS.md,ARCH.md,CHANGELOG.md(+14)
2026-10-05T17:46:21Z s=ff0b7b23 FINDING src/dom.ts:interpolatePlan learn=test: browser-suite 'raw-text interpolation slots are rejected' fails on the old dist, passes in all 4 builds
2026-10-05T17:46:21Z s=ff0b7b23 FINDING src/validate.ts:MISSING_ID_REFERENCE learn=test: browser-suite 'shadow-root ID references resolve in the shadow tree' fails on the old dist
2026-10-05T17:46:21Z s=ff0b7b23 FINDING src/validate.ts:OVERLAPPING_TARGET learn=test: browser-suite 'overlapping targets are rejected for an unmarked root' fails on the old dist
2026-10-05T17:46:21Z s=ff0b7b23 FINDING src/dom.ts:setValues learn=test: browser-suite 'values projected before an afterRender failure stay committed' fails on the old dist
2026-10-05T17:46:21Z s=ff0b7b23 FINDING tests/browser.test.mjs:launch learn=memory: launcher now throws an actionable message off Linux x64; CLI_GIST records the PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH command
2026-10-05T17:46:21Z s=ff0b7b23 FINDING src/all.ts:BrowserI18n learn=test: scripts/package-tests.mjs now emits consumer declarations for createDomI18n(df$) and df$.i18n; `satisfies Record<keyof typeof core, unknown>` makes a missing na
2026-10-05T17:46:21Z s=ff0b7b23 FINDING package.json:scripts.test:unit learn=verifier: c8 --exclude-after-remap maps dist/core.js back to src/locale.ts+attributes.ts; the gate's coverage floor would catch a regression to 0%
2026-10-05T17:46:21Z s=ff0b7b23 FINDING tests/types.mts:20 learn=verifier: oxlint now runs in lint/check; `void` keeps the type assertion (mutation: removing @ts-expect-error still fails tsc)
2026-10-05T17:46:21Z s=ff0b7b23 FINDING CHANGELOG.md:11 B02 learn=none: release-note accuracy; no mechanical check distinguishes exposed internal paths
2026-10-05T17:46:21Z s=ff0b7b23 FINDING documentation/getting-started.md:145 L03 learn=none: example consistency is judgment, not mechanically checkable
2026-10-05T17:46:21Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:3 L03 learn=none: prose consistency
2026-10-05T17:46:21Z s=ff0b7b23 FINDING documentation/state-and-ownership.md:28 B02 learn=none: claims now match defuss-morph all.js takeUnkeyedMatch and the browser tests
2026-10-05T17:46:21Z s=ff0b7b23 FINDING documentation/lazy-loading.md:3 P07 learn=none: prose precision
2026-10-05T17:46:21Z s=ff0b7b23 FINDING documentation/security.md:15 B01 learn=none: removed unsupported claim
2026-10-05T17:46:21Z s=ff0b7b23 FINDING documentation/index.md learn=test: docs.test 'documentation index lists every documentation page' (mutation-checked)
