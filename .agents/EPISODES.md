# Episodes

<!-- Newest last. The gate appends FAIL|DONE|FINDING and keeps the last 100 entries (git keeps older ones).
Agents append `<UTC ISO> s=<session> LESSON <Signan>` only for a falsified HYPOTHESIS, a dead end, or a root cause.
A lesson recurring ≥2 → test | .agents/VERIFY.py rule | MEMORY line, then delete its lines. -->
2026-10-05T19:21:39Z s=ff0b7b23 DONE fp=614c262d3056 cov=100.0% paths=Makefile
2026-10-05T22:32:49Z s=ff0b7b23 DONE fp=96e0062810d1 cov=100.0% paths=.github/workflows/verify.yml,ARCH.md,README.md,documentation/component-skill.md(+4)
2026-10-05T22:33:16Z s=ff0b7b23 DONE fp=7a102554ca41 cov=100.0% paths=ARCH.md,README.md,documentation/component-skill.md,documentation/getting-started.md(+2)
2026-10-08T08:01:32Z s=a7b9f95a DONE fp=d9b81e7206fd cov=100.0% paths=ARCH.md,CHANGELOG.md,README.md,documentation/getting-started.md(+7)
2026-10-08T12:22:39Z s=a7b9f95a DONE fp=9dfefee4d6be cov=100.0% paths=AGENTS.md,ARCH.md,CHANGELOG.md,README.md(+8)
2026-10-08T12:22:39Z s=a7b9f95a FINDING tests/browser.test.mjs:114 learn=test: The e2e now covers every interactive control of the demo page.
2026-10-08T12:22:39Z s=a7b9f95a FINDING scripts/verify.mjs:27 learn=verifier: scripts/verify.mjs runs in bun run check, make verify, CI and prepublishOnly, so a regression to local imports fails mechanically.
2026-10-08T12:22:39Z s=a7b9f95a FINDING README.md:42 B01; documentation/getting-started.md:11 B01 learn=none: A wording fix for a time-bound fact; nothing mechanical to check offline.
2026-10-08T12:22:39Z s=a7b9f95a FINDING examples/demo.js:52 learn=test: tests/browser.test.mjs asserts the pressed item survives a second click in both demo passes.
2026-10-08T12:22:39Z s=a7b9f95a FINDING examples/index.html:14 learn=none: Whether defuss-shadcn intends pages to bring their own base is not documented in 0.9.7; recorded in the page comment, not as a rule.
2026-10-08T12:22:39Z s=a7b9f95a FINDING README.md:5 learn=none: A one-time doc follow-up; tests/docs.test.mjs already guards README links.
2026-10-08T12:24:55Z s=a7b9f95a DONE fp=c34d8f5b3a53 cov=100.0% paths=AGENTS.md,ARCH.md,CHANGELOG.md,README.md(+11)
2026-10-08T12:24:55Z s=a7b9f95a FINDING package.json:3; src/locale.ts:2; CHANGELOG.md:3 learn=verifier: scripts/verify.mjs already fails on version disagreement between package.json, I18N_VERSION and dist.
2026-10-09T09:46:51Z s=a7b9f95a DONE fp=d74bf6f637e9 cov=100.0% paths=AGENTS.md,ARCH.md,CHANGELOG.md,README.md(+16)
2026-10-09T09:46:51Z s=a7b9f95a FINDING docs/index.html (code blocks) learn=memory: MEMORY [defuss-shadcn@0.9.8] records the hard-coded tab values; the e2e covers the Tabs panels.
2026-10-09T09:46:51Z s=a7b9f95a FINDING docs/index.html (head scripts) learn=verifier: scripts/verify.mjs requires an integrity hash on every CDN script/link tag; CLI_GIST sri records how to recompute one.
2026-10-09T09:46:51Z s=a7b9f95a FINDING tests/browser.test.mjs (no-JavaScript test) learn=test: The e2e catches default/template drift from any later hand edit of docs/index.html.
2026-10-09T09:46:51Z s=a7b9f95a FINDING docs/index.html (demo desc); README.md:28 learn=none: A wording fix; nothing mechanical to check.
2026-10-09T09:46:51Z s=a7b9f95a FINDING docs/index.html (page base, footer) learn=none: Accessibility and verbatim-markup fixes; markup-check guards the vocabulary.
2026-10-09T09:46:51Z s=a7b9f95a FINDING docs/assets/demo.js:8 learn=test: The 'opens in the visitor's language' e2e test guards negotiation.
2026-10-09T10:36:57Z s=a7b9f95a DONE fp=531e4591556b cov=100.0% paths=AGENTS.md,ARCH.md,CHANGELOG.md,README.md(+17)
2026-10-09T10:36:57Z s=a7b9f95a FINDING docs/assets/demo.js:showLocale (code-line cursor) learn=test: The site e2e asserts the cursor on code-line-en at start and on code-line-de after the switch.
2026-10-09T10:36:57Z s=a7b9f95a FINDING docs/assets/demo.js:flush (event log) learn=test: Log content is asserted in both site passes.
2026-10-09T10:36:57Z s=a7b9f95a FINDING docs/index.html (How it works) learn=none: Whether the diagram toolbar labels can be configured is not established; settle it in defuss-shadcn's diagram.ts before using it on a localized page.
2026-10-09T10:36:57Z s=a7b9f95a FINDING docs/index.html (Arabic removed) learn=none: validateI18n({ locales: ['en','de'] }) in demo.js and the no-JavaScript e2e cover the two locales.
2026-10-09T14:21:55Z s=a7b9f95a DONE fp=e0c76b8a50a2 cov=100.0% paths=AGENTS.md,ARCH.md,CHANGELOG.md,README.md(+20)
2026-10-09T14:21:55Z s=a7b9f95a FINDING site/translations.json (human prose edits) learn=verifier: scripts/verify.mjs now fails when docs/index.html differs from buildSite() (mutation: the hand-edited file fails with 'differs from its source'), so a hand edit
2026-10-09T14:21:55Z s=a7b9f95a FINDING scripts/build-site.mjs:hlJs learn=none: Cosmetic highlighting; covered by the freshness check against the committed page.
2026-10-09T14:21:55Z s=a7b9f95a FINDING tests/browser.test.mjs:108,179 learn=none: The site e2e asserts the German heading against the template text.
