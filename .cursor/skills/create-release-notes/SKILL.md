---
name: create-release-notes
description: Create marketing-style release notes, determine version numbers, and publish releases for Figma plugins. Use when the user asks to draft release notes, bump version, create a release, or publish an update.
---

# Create Release Notes

Guide for creating professional release notes, determining semantic version numbers, and publishing releases for Figma plugins.

## When to Use

Use this skill when:
- User asks to draft release notes
- User wants to bump the version
- User is preparing to publish an update
- User asks what version number to use
- User wants to create a release package

## Quick Start Workflow

```
Task Progress:
- [ ] 1. Analyze changes since last release
- [ ] 2. Determine version number
- [ ] 3. Draft release notes (plain text)
- [ ] 4. Bump version in package.json
- [ ] 5. Commit with release message
- [ ] 6. Create and push git tag
- [ ] 7. Build release package (if applicable)
```

## Step 1: Analyze Changes

Check what's changed since the last release:

```bash
# Find commits since last tag
git log --oneline v[LAST_VERSION]..HEAD

# Get feature commits only
git log v[LAST_VERSION]..HEAD --grep="feat:" --oneline

# See file changes summary
git diff --stat v[LAST_VERSION]..HEAD

# Check current uncommitted changes
git status --short
```

## Step 2: Determine Version Number

Use semantic versioning: `MAJOR.MINOR.PATCH`

| Change Type | Version Bump | Examples |
|------------|--------------|----------|
| **Breaking changes** | MAJOR (2.0.0) | API changes, removed features, incompatible updates |
| **New features** | MINOR (1.3.0) | New user-facing features, significant enhancements |
| **Bug fixes & polish** | PATCH (1.2.1) | Bug fixes, minor UI tweaks, performance improvements |

**Key Decision Points:**
- New user-facing feature = MINOR bump
- Only fixes and improvements = PATCH bump
- Breaking backward compatibility = MAJOR bump

## Step 3: Draft Release Notes

### Important: Figma Community Format

Figma's plugin description form does NOT support markdown. Use plain text only:
- ❌ No `**bold**` or `*italic*`
- ❌ No `### Headers` or `#`
- ❌ No markdown links `[text](url)`
- ✅ Use emojis for visual hierarchy
- ✅ Use line breaks for structure
- ✅ Use simple text formatting (ALL CAPS for headers)

### Release Notes Template

```
🎉 [Plugin Name] Update: [Catchy Title]

✨ WHAT'S NEW

[Feature 1 Emoji] Feature Name
Brief description of what it does
• Bullet point detail
• Bullet point detail

[Feature 2 Emoji] Feature Name
Brief description
• Detail
• Detail

🎯 IMPROVEMENTS

• Improvement 1
• Improvement 2
• Improvement 3

🐛 FIXES

• Fix 1
• Fix 2

💅 POLISH & REFINEMENT

• Polish item 1
• Polish item 2

🚀 WHY THIS MATTERS

One paragraph explaining the real-world impact of these changes. Focus on user benefits, not technical details.
```

### Release Notes Best Practices

1. **Lead with benefits, not features**: "Navigate faster" not "Added keyboard shortcuts"
2. **Use visual hierarchy**: Emojis for section headers, bullets for details
3. **Keep it scannable**: Short paragraphs, clear structure
4. **Be conversational**: Write like you're explaining to a colleague
5. **Focus on impact**: Why should users care?

### Common Emoji Patterns

- ✨ New features
- 🎯 Improvements
- 🐛 Bug fixes
- 💅 Polish/UI refinements
- 🏗️ Foundation/architecture
- 🧪 Testing/quality
- 🚀 Performance
- 🎨 Visual/design
- 🧭 Navigation

## Step 4: Bump Version

```bash
# Bump version in package.json (no git tag yet)
npm version [major|minor|patch] --no-git-tag-version

# Example for minor release (1.2.0 → 1.3.0)
npm version minor --no-git-tag-version
```

## Step 5: Commit Changes

Create a comprehensive commit message:

```bash
git add -A && git commit -m "$(cat <<'EOF'
release: v[VERSION] - [Title]

Major Changes:
- Change 1
- Change 2

Features:
- Feature 1
- Feature 2

Improvements:
- Improvement 1
- Improvement 2

Fixes:
- Fix 1
- Fix 2

BREAKING: [None or list breaking changes]
Version: [VERSION]
EOF
)"
```

## Step 6: Create Git Tag

```bash
# Create tag and push to remote
git tag v[VERSION] && git push origin develop --tags

# Verify tag was created
git tag -l
git log --oneline --decorate -3
```

## Step 7: Build Release Package (Figma Plugins)

For Figma plugins with build scripts:

```bash
# Build production package and create zip
npm run ship

# Or use specific build commands
npm run build:plugin-ready:zip
```

**Verify package contents:**
- code.js (plugin backend)
- ui.html (plugin interface)
- manifest.json (metadata)
- icon.svg (plugin icon)
- assets/ (icons and images)
- README.md (documentation)

## Common Scenarios

### Scenario: Multiple Features Since Last Release

**Decision:** MINOR version bump

Example: v1.2.0 → v1.3.0

### Scenario: Only Bug Fixes and Polish

**Decision:** PATCH version bump

Example: v1.2.0 → v1.2.1

### Scenario: Major Refactor + New Feature

**Decision:** MINOR version bump

Rationale: Major refactors without breaking changes are enhancements, not breaking changes. The new feature drives the MINOR bump.

### Scenario: Removed or Changed Existing Features

**Decision:** MAJOR version bump

Example: v1.2.0 → v2.0.0

## Checklist Before Publishing

- [ ] Version number follows semantic versioning
- [ ] Release notes are in plain text (no markdown)
- [ ] Release notes include emojis for visual hierarchy
- [ ] Release notes focus on user benefits
- [ ] Git tag matches version in package.json
- [ ] Changes are committed and pushed to remote
- [ ] Build package is created and tested
- [ ] Package size is reasonable
- [ ] All files are included in package

## Quick Reference

### Check Current Version

```bash
# From package.json
cat package.json | grep "version"

# From git tags
git tag -l | tail -1
```

### View Version History

```bash
# List all tags
git tag -l

# Show commits for a specific version
git log v1.2.0..v1.3.0 --oneline
```

### Undo Version Bump (Before Push)

```bash
# Remove local tag
git tag -d v[VERSION]

# Reset version in package.json
git checkout HEAD -- package.json
```

## Summary

This workflow ensures:
1. **Accurate versioning** based on semantic versioning rules
2. **User-friendly release notes** in plain text with emojis
3. **Proper git history** with tags for each release
4. **Ready-to-ship packages** for distribution

Remember: Release notes are marketing, not changelogs. Focus on user impact, not technical implementation.
