# defuss-i18n documentation

defuss-i18n localizes plain HTML. Each locale's markup lives next to the default markup in inert `<template>` elements. On a language switch, defuss-morph patches only the regions a component owns, so open dialogs, focus, edited inputs and event listeners survive.

| Read this | When you want to |
| --- | --- |
| [Getting started](getting-started.md) | install, localize a first component, add a language switcher |
| [State and ownership](state-and-ownership.md) | understand what is preserved, what a region owns, nesting, renderers and lifecycle |
| [Lazy loading](lazy-loading.md) | ship one locale and fetch others on demand |
| [Security model](security.md) | know what is trusted input and how values stay literal |
| [API reference](api.md) | look up every export, option, HTML attribute and event |
| [Errors and diagnostics](errors.md) | fix a thrown error or a `validateI18n` diagnostic |
| [Design rationale](design.md) | see why the library works this way and what it deliberately leaves out |
| [Authoring contract](component-skill.md) | give an agent or reviewer the condensed rules for writing components |
| [Docs-site page (MDX)](i18n.mdx) | embed the overview in the defuss-shadcn docs |

The [README](../README.md) is the compact overview, and [ARCH.md](../ARCH.md) is the module map for contributors. To see the library running, run `bun install --frozen-lockfile && bun run build && bun run serve` and open <http://127.0.0.1:8080/examples/>.
