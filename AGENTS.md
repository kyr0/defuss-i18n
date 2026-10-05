# Engineering contract

Read README.md and ARCH.md. Keep pure TypeScript/HTML/CSS and actual defuss-query/morph peers; never vendor an engine, create another reconciler or weaken tests silently.

Run `npm run check` after behavioral changes: build, strict source/consumer types, core tests with measured coverage, real-browser tests of shipping formats, packed-consumer tests and release verification. New behavior needs meaningful adversarial cases. Keep imports DOM-free/side-effect-free, browser peers external, immutable sources, explicit ownership/cleanup and latest-request loading. Update docs, MDX, authoring contract, demo and type tests with public changes. Regenerate dist; never edit it manually. Do not claim unexecuted tests or whole-package coverage from the core report.

Publish only when explicitly authorized. prepublishOnly gates npm publish. Release ZIPs include complete sources/lockfile/dist/scripts/tests/docs/demo assets; exclude node_modules, git internals, caches and coverage.
