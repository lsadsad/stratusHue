#!/usr/bin/env node
/**
 * sync-prototype.js
 *
 * Rebuilds the plugin then patches the compiled dist/ui.html with the
 * Figma mock shim and chrome wrapper to produce prototype/plugin.html.
 *
 * Usage:
 *   npm run sync:prototype          — build + patch
 *   npm run sync:prototype -- --no-build  — patch only (skip rebuild)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT     = path.resolve(__dirname, '..');
const DIST_HTML  = path.join(ROOT, 'dist', 'ui.html');
const PROTO_HTML = path.join(ROOT, 'prototype', 'plugin.html');
const SHIM_FILE  = path.join(ROOT, 'prototype', 'shim.js');
const LOGO_PNG   = path.join(ROOT, 'assets', '12.27 _ logo.png');

// ── 1. Optionally rebuild ──────────────────────────────────────────────────
const skipBuild = process.argv.includes('--no-build');
if (skipBuild) {
  console.log('⏭  Skipping build (--no-build)');
} else {
  console.log('🔨 Building plugin…');
  execSync('npm run build', { cwd: ROOT, stdio: 'inherit' });
  console.log('✓  Build complete');
}

// ── 2. Read inputs ────────────────────────────────────────────────────────
if (!fs.existsSync(DIST_HTML)) {
  console.error('✗  dist/ui.html not found — run without --no-build first');
  process.exit(1);
}

let html = fs.readFileSync(DIST_HTML, 'utf8');
const shim = fs.readFileSync(SHIM_FILE, 'utf8');
const logoB64 = 'data:image/png;base64,' + fs.readFileSync(LOGO_PNG).toString('base64');

// ── 3. Inject shim script before </head> ─────────────────────────────────
html = html.replace('</head>', `<script>\n${shim}\n</script>\n</head>`);

// ── 4. Wrap <main> … </footer> in #plugin-chrome with title bar ──────────
const titleBar = `\
  <div id="plugin-chrome">
    <div id="plugin-title-bar">
      <div style="display:flex;align-items:center;gap:7px;">
        <img src="${logoB64}" style="width:18px;height:18px;display:block;" alt="">
        <span style="font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;font-size:12px;font-weight:500;color:#1a1a1a;letter-spacing:0.1px;">stratusHue</span>
      </div>
      <button style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;background:none;border:none;cursor:pointer;border-radius:4px;font-size:14px;color:#666;line-height:1;padding:0;" title="Close">&#x2715;</button>
    </div>`;

// Insert opener + title bar immediately before the mode strip nav (if present)
// or before <main class="scrollable-content"> (legacy fallback).
if (html.includes('<nav id="mode-strip"')) {
  html = html.replace(
    /(\s*)(<nav id="mode-strip")/,
    `\n${titleBar}\n$1$2`
  );
} else {
  html = html.replace(
    /(\s*)<main class="scrollable-content">/,
    `\n${titleBar}\n$1<main class="scrollable-content">`
  );
}

// Close the chrome div right after </footer>
html = html.replace('</footer>', '</footer>\n  </div><!-- /plugin-chrome -->');

// ── 5. Write output ───────────────────────────────────────────────────────
fs.writeFileSync(PROTO_HTML, html, 'utf8');
console.log(`✅ prototype/plugin.html synced  (${(html.length / 1024).toFixed(0)} KB)`);
