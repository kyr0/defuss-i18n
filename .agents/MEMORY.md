# Agent memory

<!-- One tagged line per durable fact NOT derivable from code, git or docs:
- VERIFIED[scope] fact BC evidence
- HYPOTHESIS[scope] claim; falsifier=`cmd`
- UNKNOWN[scope] gap BC missing evidence
Replace stale lines instead of appending. Mechanizable lessons belong in tests or .agents/VERIFY.py.
Budget 4 KiB (`vae.py doctor --repo .`); entries are injected at session start. -->
- VERIFIED[toolchain] human approved migrating npm → bun + oxlint + pkgroll (2026-10-05); Node still runs tests (`node --test`) because consumers run Node; esbuild stays BC pkgroll 2.28 has no IIFE output.
- VERIFIED[types] NOT `typeof <namespace import>` in exported types BC pkgroll's dts bundler emitted invalid `declare const X: typeof <Type>` chunks (TS2693); scripts/package-tests.mjs emits consumer declarations to catch it.
- VERIFIED[tests] browser suite runs unchanged against all.js|all.min.js|global.min.js|core; new DOM behavior → scenario in tests/browser-suite.js, NOT a separate runner.
- VERIFIED[docs] tests/docs.test.mjs fails IF an export|validator code|error message stem is missing from documentation/api.md|errors.md OR a relative doc link|anchor breaks → document new public surface in the same change.
- UNKNOWN[coverage.dom] src/dom.ts + src/validate.ts coverage unmeasured BC c8 remaps only src/locale.ts+attributes.ts from dist/core.js; browser V8 coverage NOT collected. Branch % after the pkgroll remap (100) is NOT comparable to the tsc-era 96.8.
