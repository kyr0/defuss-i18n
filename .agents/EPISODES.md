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
