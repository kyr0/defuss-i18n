# package.json scripts remain the source of truth; these verbs give humans, agents and CI one interface.
-include .env
export
.PHONY: setup build typecheck test test-browser test-package verify check serve clean start stop restart status log metrics bench coverage lint e2e
setup:
	bun install --frozen-lockfile
build:
	bun run build
typecheck:
	bun run typecheck
# oxlint for JS/TS rules, then strict tsc (noUnused*, exactOptionalPropertyTypes) over sources and type tests.
lint:
	bun run lint
# Core + docs tests import dist/, so build first.
test: build
	bun run test:unit
coverage: build
	bun run test:unit
test-browser:
	bun run test:browser
test-package:
	bun run test:package
# Built artifacts in real Chromium plus a packed clean consumer; the browser report and screenshot land in output/.
e2e: build
	I18N_REPORT_DIR=output bun run test:browser
	bun run test:package
verify: lint test coverage e2e
	bun run verify
check:
	bun run check
serve:
	bun run serve
metrics:
	@cat dist/stats.json
bench: ; @echo "UNKNOWN[bench] BC no benchmark defined; measure before perf claims"; exit 2
# Library: no service.
start stop restart status log: ; @echo "∅ $@: no service"
clean:
	rm -rf dist coverage test-results output
