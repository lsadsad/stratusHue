#!/usr/bin/env bash
# ─────────────────────────────────────────────
# fp-obsidian-link.sh — symlink repos into an Obsidian vault
# ─────────────────────────────────────────────
#
# Creates a finePrint/ directory inside your Obsidian vault with
# symlinked .issues/ and .memory/ directories from each repo.
# Dataview can then query across all projects.
#
# Usage:
#   bash fp-obsidian-link.sh <vault-path> <repo-path> [<repo-path> ...]
#
# Example:
#   bash fp-obsidian-link.sh ~/obsidian-vault ~/code/stratusHue ~/code/shortHand
#
# Result:
#   ~/obsidian-vault/finePrint/
#     stratusHue/
#       issues  → ~/code/stratusHue/.issues
#       memory  → ~/code/stratusHue/.memory
#     shortHand/
#       issues  → ~/code/shortHand/.issues
#       memory  → ~/code/shortHand/.memory
#
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage: fp-obsidian-link.sh <vault-path> <repo-path> [<repo-path> ...]"
  echo ""
  echo "Example:"
  echo "  fp-obsidian-link.sh ~/obsidian-vault ~/code/project-a ~/code/project-b"
  exit 1
fi

VAULT="$1"
shift

# Verify vault exists
if [ ! -d "$VAULT" ]; then
  echo "Creating Obsidian vault directory: $VAULT"
  mkdir -p "$VAULT"
fi

FP_DIR="$VAULT/finePrint"
mkdir -p "$FP_DIR"

for REPO in "$@"; do
  # Resolve to absolute path
  REPO="$(cd "$REPO" && pwd)"
  REPO_NAME="$(basename "$REPO")"

  echo "Linking $REPO_NAME..."

  DEST="$FP_DIR/$REPO_NAME"
  mkdir -p "$DEST"

  # Link .issues/
  if [ -d "$REPO/.issues" ]; then
    if [ -L "$DEST/issues" ]; then
      rm "$DEST/issues"
    fi
    ln -s "$REPO/.issues" "$DEST/issues"
    echo "  issues → $REPO/.issues"
  else
    echo "  Skipping issues (no .issues/ directory in $REPO_NAME)"
  fi

  # Link .memory/
  if [ -d "$REPO/.memory" ]; then
    if [ -L "$DEST/memory" ]; then
      rm "$DEST/memory"
    fi
    ln -s "$REPO/.memory" "$DEST/memory"
    echo "  memory → $REPO/.memory"
  else
    echo "  Skipping memory (no .memory/ directory in $REPO_NAME)"
  fi
done

echo ""
echo "Done! Open $VAULT in Obsidian."
echo ""
echo "Dataview query for all issues across repos:"
echo ""
echo '  ```dataview'
echo '  TABLE title, category, priority, status, depends_on'
echo '  FROM "finePrint"'
echo '  WHERE status = "open"'
echo '  SORT file.folder ASC, priority ASC'
echo '  ```'
echo ""
echo "Dataview query for all memories:"
echo ""
echo '  ```dataview'
echo '  TABLE type, tags, created'
echo '  FROM "finePrint"'
echo '  WHERE type'
echo '  SORT created DESC'
echo '  ```'
echo ""
echo "  ┌────────────────────────────────────┐"
echo "  │   finePrint Obsidian vault ready   │"
echo "  └────────────────────────────────────┘"
