# npm scripts remain the source of truth; these verbs give humans, agents and CI one interface.
-include .env
export
.PHONY: setup build typecheck test test-browser test-package verify check serve clean start stop restart status log metrics bench coverage lint e2e
setup:
	npm ci
build:
	npm run build
typecheck:
	npm run typecheck
# Strict tsc (noUnused*, exactOptionalPropertyTypes) over sources and type tests is the lint; no extra linter dependency.
lint: typecheck
# Core + docs tests import dist/, so build first.
test: build
	npm run test:unit
coverage: build
	npm run test:unit
test-browser:
	npm run test:browser
test-package:
	npm run test:package
# Built artifacts in real Chromium plus a packed clean consumer; the browser report and screenshot land in output/.
e2e: build
	I18N_REPORT_DIR=output npm run test:browser
	npm run test:package
verify: lint test coverage e2e
	npm run verify
check:
	npm run check
serve:
	npm run serve
metrics:
	@cat dist/stats.json
bench: ; @echo "UNKNOWN[bench] BC no benchmark defined; measure before perf claims"; exit 2
# Library: no service.
start stop restart status log: ; @echo "∅ $@: no service"
clean:
	rm -rf dist coverage test-results output
