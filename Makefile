.PHONY: setup build typecheck test test-browser test-package verify check serve clean
setup:
	npm ci
build:
	npm run build
typecheck:
	npm run typecheck
test:
	npm test
test-browser:
	npm run test:browser
test-package:
	npm run test:package
verify:
	npm run verify
check:
	npm run check
serve:
	npm run serve
clean:
	rm -rf dist coverage test-results
