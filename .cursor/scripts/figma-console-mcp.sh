#!/usr/bin/env bash
set -euo pipefail

# Local figma-studio checkout (figma-console-mcp). Override if you clone elsewhere.
FIGMA_STUDIO_ROOT="${FIGMA_STUDIO_ROOT:-/Users/levinsadsad/Documents/GitHub/figma-studio}"
LOCAL_ENTRY="${FIGMA_STUDIO_ROOT}/dist/local.js"

if [[ ! -f "${LOCAL_ENTRY}" ]]; then
  echo "figma-console-mcp not built: run 'npm run build:local' in ${FIGMA_STUDIO_ROOT}" >&2
  exit 1
fi

if [[ -z "${FIGMA_ACCESS_TOKEN:-}" ]]; then
  echo "FIGMA_ACCESS_TOKEN is not set. Add it to the figma-console MCP env in Cursor (or export in your shell)." >&2
  exit 1
fi

export ENABLE_MCP_APPS="${ENABLE_MCP_APPS:-true}"
exec node "${LOCAL_ENTRY}"
