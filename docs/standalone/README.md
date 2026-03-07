# Standalone Concepts

Plugin ideas and specs that are **not part of stratusHue's three-mode system**. These are either separate plugins or explorations that haven't been integrated into the product roadmap.

## Rive Preview

A standalone Figma plugin for previewing and interacting with Rive (.riv) animations.

| Document | Purpose |
|---|---|
| `rive-preview/RIVE_PREVIEW_PLUGIN_REQUIREMENTS.md` | Requirements specification |
| `rive-preview/RIVE_PREVIEW_PLUGIN_DESIGN.md` | Architecture and UI design |
| `rive-preview/RIVE_PREVIEW_PLUGIN_IMPLEMENTATION.md` | Implementation guide |

**Status**: Draft specs. Not aligned with stratusHue's architecture — uses its own CSS system, class-based state, direct postMessage calls, and requires network access for WASM runtime. Would need significant rework to integrate as a stratusHue mode.
