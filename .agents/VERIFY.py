"""Project-local verifier policy. Agents MAY extend it; every gate executes it fail-closed."""

CONFIG = {
    "coverage_min": 60,
    "lint_command": None,          # None → `make lint` (uv run ruff check . | bunx oxlint --deny-warnings).
    "test_command": None,          # None → `make test`. Commands run in the repo root.
    "coverage_command": None,      # None → `make coverage`; output needs `TOTAL <n>%` or an `All files |…|` table.
    "integration_commands": [],    # [] → `make integration` if present.
    "e2e_commands": [],            # [] → `make e2e`: build + consume the publishable artifact.
    "timeout_s": 180,
    "layout": True,                # Makefile verbs + gitignored var/log/ and tmp/.
    "toolchain": True,             # new (sub)projects start on bun (JS/TS) / uv (Python): newly added npm/yarn/pnpm/poetry/pipenv/pdm/pip lockfiles fail.
}

# Deterministic invariants only; no semantic guesses.
# kinds: command | file_exists | contains | regex | not_regex
# scope: "path" = one exact file; "glob" = every changed code file matching (fnmatch).
RULES = [{
    "id": "tests.no-mocks",
    "kind": "not_regex",
    "glob": "*",
    # Every alternative contains an escape, so this file never matches its own pattern.
    "pattern": r"unittest\.mock|from\s+unittest\s+import\s+mock|MagicMock\(|mock\.patch|mocker\.|"
               r"jest\.(?:mock|fn|spyOn)\(|vi\.(?:mock|fn|spyOn)\(|sinon\.|gomock\.|mock\.Mock\b|Mockito\.|@Mock\s|mockk\(",
    "claim": "tests exercise real subsystems, not mock frameworks",
}, {
    "id": "docs.state.publish-diagram",
    "kind": "contains",
    "path": "documentation/state-and-ownership.md",
    "text": "```mermaid",
    "claim": "the setLocale render/notify order stays a rendered diagram, not prose only",
}, {
    "id": "docs.lazy.supersede-diagram",
    "kind": "contains",
    "path": "documentation/lazy-loading.md",
    "text": "```mermaid",
    "claim": "latest-request-wins loading stays a rendered sequence diagram",
}, {
    "id": "make.env-dotenv",
    "kind": "not_regex",
    "path": "Makefile",
    "pattern": r"^-?include\s+\.env",
    "claim": "Makefile never parses .env as Makefile syntax (keeps literal quotes); recipes load it via bun --env-file",
}, {
    "id": "make.setup-bootstraps-bun",
    "kind": "contains",
    "path": "Makefile",
    "text": "command -v bun >/dev/null 2>&1 || curl -fsSL https://bun.sh/install | bash",
    "claim": "make setup installs a missing bun with the official installer (AGENTS.md toolchain contract)",
}, {
    "id": "site.released-runtime",
    "kind": "contains",
    "path": "docs/index.html",
    "text": "https://cdn.jsdelivr.net/npm/defuss-i18n@",
    "claim": "the project site runs on the released defuss-i18n from jsDelivr, never on dist/ or node_modules/ (human decision 2026-10-08)",
}]
