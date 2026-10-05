# CLI gist

<!-- Commands future agents need that the Makefile verbs do not cover (setup, env, data, deploy):
- VERIFIED[purpose] `cmd` — only after an observed success
- UNKNOWN[purpose] BC gap
Budget 2 KiB (`vae.py doctor --repo .`); entries are injected at session start. -->
- VERIFIED[setup] `bun install --frozen-lockfile`
- VERIFIED[check@darwin-arm64] `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" bun run check` — Sparticuz fallback is Linux x64 only; Playwright 1.58.2's own chromium-1208 is NOT installed here
- VERIFIED[verify] `make verify` (lint, test, coverage, e2e, release checks); reads PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH from gitignored `.env`
- VERIFIED[docs] `node --test tests/docs.test.mjs`
- UNKNOWN[release] `bun publish` NOT executed; requires explicit human authorization (VERIFIED in a throwaway package: `bun publish` runs prepublishOnly)
