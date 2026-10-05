# package.json scripts remain the source of truth; these verbs give humans, agents and CI one interface.
# VERIFIED: Make 3.81 execs simple recipe lines with its startup PATH and ignores `export PATH`, so resolve bun to a path:
# the one on PATH wins, else the official installer's default location (which setup fills when bun is missing).
BUN_BIN = $(shell command -v bun 2>/dev/null || echo $(HOME)/.bun/bin/bun)
# VERIFIED: bun loads the gitignored .env with dotenv semantics (quotes stripped, missing file ignored), while Make's
# include keeps literal quotes and breaks a quoted Chromium path such as ".../Google Chrome for Testing.app/...".
BUN = $(BUN_BIN) --env-file=.env
.PHONY: setup build typecheck test test-browser test-package verify check serve clean start stop restart status log metrics bench coverage lint e2e
setup:
	@command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash
	$(BUN) install --frozen-lockfile
build:
	$(BUN) run build
typecheck:
	$(BUN) run typecheck
# oxlint for JS/TS rules, then strict tsc (noUnused*, exactOptionalPropertyTypes) over sources and type tests.
lint:
	$(BUN) run lint
# Core + docs tests import dist/, so build first.
test: build
	$(BUN) run test:unit
coverage: build
	$(BUN) run test:unit
test-browser:
	$(BUN) run test:browser
test-package:
	$(BUN) run test:package
# Built artifacts in real Chromium plus a packed clean consumer; the browser report and screenshot land in output/.
e2e: build
	I18N_REPORT_DIR=output $(BUN) run test:browser
	$(BUN) run test:package
verify: lint test coverage e2e
	$(BUN) run verify
check:
	$(BUN) run check
serve:
	$(BUN) run serve
metrics:
	@cat dist/stats.json
bench: ; @echo "UNKNOWN[bench] BC no benchmark defined; measure before perf claims"; exit 2
# Library: no service.
start stop restart status log: ; @echo "∅ $@: no service"
clean:
	rm -rf dist coverage test-results output
