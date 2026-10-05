# CLI gist

<!-- Commands future agents need that the Makefile verbs do not cover (setup, env, data, deploy):
- VERIFIED[purpose] `cmd` — only after an observed success
- UNKNOWN[purpose] BC gap
Budget 2 KiB (`vae.py doctor --repo .`); entries are injected at session start. -->
- VERIFIED[setup] `npm ci`
- VERIFIED[check@darwin-arm64] `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="$HOME/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing" npm run check` — Sparticuz fallback is Linux x64 only; Playwright 1.58.2's own chromium-1208 is NOT installed here
- VERIFIED[docs] `node --test tests/docs.test.mjs`
- UNKNOWN[release] `npm publish` NOT executed; requires explicit human authorization
