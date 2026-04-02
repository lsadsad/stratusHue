#!/usr/bin/env bash
# ─────────────────────────────────────────────
# fp-init.sh — install finePrint into a git repo
# ─────────────────────────────────────────────
#
# Usage:
#   bash fp-init.sh              # install into current directory
#   bash fp-init.sh /path/to/repo  # install into target repo
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$SCRIPT_DIR/../template"
TARGET="${1:-.}"

# Resolve to absolute path
TARGET="$(cd "$TARGET" && pwd)"

# Verify target is a git repo
if [ ! -d "$TARGET/.git" ]; then
  echo "Error: $TARGET is not a git repository."
  echo "Run 'git init' first, or pass a path to an existing repo."
  exit 1
fi

echo "Installing finePrint into $TARGET"
echo ""

# Copy .issues/ structure
if [ -d "$TARGET/.issues" ]; then
  echo "  .issues/ already exists — skipping directory creation"
  echo "  (check .issues/README.md is up to date)"
else
  cp -r "$TEMPLATE_DIR/.issues" "$TARGET/.issues"
  echo "  Created .issues/open/ and .issues/closed/"
fi

# Copy .memory/ structure
if [ -d "$TARGET/.memory" ]; then
  echo "  .memory/ already exists — skipping directory creation"
  echo "  (check .memory/README.md is up to date)"
else
  cp -r "$TEMPLATE_DIR/.memory" "$TARGET/.memory"
  echo "  Created .memory/"
fi

# Remind about CLAUDE.md
echo ""
if [ -f "$TARGET/CLAUDE.md" ]; then
  echo "  CLAUDE.md exists. Paste the contents of:"
  echo "    $TEMPLATE_DIR/CLAUDE-SNIPPET.md"
  echo "  into your CLAUDE.md to enable AI agent integration."
else
  echo "  No CLAUDE.md found. To enable AI agent integration:"
  echo "  1. Create CLAUDE.md in your repo root"
  echo "  2. Paste the contents of:"
  echo "     $TEMPLATE_DIR/CLAUDE-SNIPPET.md"
fi

echo ""
echo "Done! Next steps:"
echo "  1. Add the CLAUDE-SNIPPET.md contents to your CLAUDE.md"
echo "  2. Update the category table to match your project"
echo "  3. git add .issues/ .memory/ && git commit -m 'chore: add finePrint tracking'"
echo ""
echo "  ┌────────────────────────────────┐"
echo "  │   finePrint installed          │"
echo "  └────────────────────────────────┘"
