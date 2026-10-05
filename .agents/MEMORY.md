# Agent memory

<!-- One tagged line per durable fact NOT derivable from code, git or docs:
- VERIFIED[scope] fact BC evidence
- HYPOTHESIS[scope] claim; falsifier=`cmd`
- UNKNOWN[scope] gap BC missing evidence
Replace stale lines instead of appending. Mechanizable lessons belong in tests or .agents/VERIFY.py.
Budget 4 KiB (`vae.py doctor --repo .`); entries are injected at session start. -->
- VERIFIED[repo] NOT a git repo (2026-10-05) BC `git status` fatal; `vae.py gate` fingerprint is vacuous here ("∅ code changes") → gate evidence = `npm run check` exit 0.
- VERIFIED[tests] browser suite runs unchanged against all.js|all.min.js|global.min.js|core; new DOM behavior → scenario in tests/browser-suite.js, NOT a separate runner.
- VERIFIED[docs] tests/docs.test.mjs fails IF an export|validator code|error message stem is missing from documentation/api.md|errors.md OR a relative doc link|anchor breaks → document new public surface in the same change.
- UNKNOWN[coverage.dom] src/dom.ts + src/validate.ts coverage unmeasured BC c8 covers only dist/locale.js+attributes.js; browser V8 coverage NOT collected.
