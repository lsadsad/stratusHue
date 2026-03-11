// Lint mode UI — Phase 2
// Populates #validate-main on first activation. Called lazily from ui.ts activateMode().

import { sendMessage } from '../shared/send-message';
import type { LintError } from '../../core/lint-types';

let _initialized = false;
const _currentErrors: LintError[] = [];
let _activeFilter = 'all';

// ── Init ──────────────────────────────────────────────────────────────────────

export function initializeLintUI(): void {
  if (_initialized) return;
  _initialized = true;

  const container = document.getElementById('validate-main');
  if (!container) return;

  container.innerHTML = '';

  const frag = document.createDocumentFragment();

  // Lint header
  const header = document.createElement('div');
  header.id = 'lint-header';
  header.className = 'lint-header';
  header.innerHTML = `
    <span class="lint-title">Design Lint</span>
    <span id="lint-error-badge" class="lint-error-badge" aria-live="polite" aria-atomic="true" hidden></span>
    <button id="lint-scan-btn" class="lint-scan-btn" aria-label="Scan current page for style errors">
      ↺ Scan
    </button>
  `;
  frag.appendChild(header);

  // Filter pills
  const pills = document.createElement('div');
  pills.id = 'lint-filter-pills';
  pills.className = 'lint-filter-pills';
  pills.setAttribute('role', 'tablist');
  pills.setAttribute('aria-label', 'Filter by error category');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'fill', label: 'Fill' },
    { id: 'text', label: 'Text' },
    { id: 'stroke', label: 'Stroke' },
    { id: 'radius', label: 'Radius' },
    { id: 'effects', label: 'Effects' },
  ];

  categories.forEach(({ id, label }) => {
    const btn = document.createElement('button');
    btn.className = 'lint-filter-pill' + (id === 'all' ? ' active' : '');
    btn.dataset.category = id;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', id === 'all' ? 'true' : 'false');
    btn.textContent = label;
    btn.addEventListener('click', () => setLintFilter(id));
    pills.appendChild(btn);
  });

  frag.appendChild(pills);

  // Error list
  const errorList = document.createElement('ul');
  errorList.id = 'lint-error-list';
  errorList.className = 'lint-error-list';
  errorList.setAttribute('role', 'list');
  errorList.setAttribute('aria-label', 'Design lint errors');
  errorList.hidden = true;
  frag.appendChild(errorList);

  // Null state
  const nullState = document.createElement('div');
  nullState.id = 'lint-null-state';
  nullState.className = 'lint-null-state';
  nullState.setAttribute('role', 'status');
  nullState.innerHTML = `
    <div class="lint-null-icon">✓</div>
    <div class="lint-null-message">No style errors found</div>
    <div class="lint-null-sub">Click Scan to check the current page</div>
  `;
  frag.appendChild(nullState);

  // Scan progress state
  const scanState = document.createElement('div');
  scanState.id = 'lint-scan-state';
  scanState.className = 'lint-scan-state';
  scanState.setAttribute('role', 'status');
  scanState.setAttribute('aria-live', 'polite');
  scanState.hidden = true;
  scanState.innerHTML = `
    <div class="lint-progress-bar"><div id="lint-progress-fill" class="lint-progress-fill"></div></div>
    <div id="lint-progress-label" class="lint-progress-label">Scanning…</div>
  `;
  frag.appendChild(scanState);

  container.appendChild(frag);

  // Scan button
  document.getElementById('lint-scan-btn')?.addEventListener('click', requestLintScan);
}

// ── Scan ──────────────────────────────────────────────────────────────────────

function requestLintScan(): void {
  // Show scanning state
  _setView('scanning');
  sendMessage('lint-run-scan');
}

// ── Filter ────────────────────────────────────────────────────────────────────

function setLintFilter(category: string): void {
  _activeFilter = category;
  document.querySelectorAll<HTMLButtonElement>('.lint-filter-pill').forEach(btn => {
    const isActive = btn.dataset.category === category;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
  _applyFilter();
}

function _applyFilter(): void {
  document.querySelectorAll<HTMLElement>('.lint-error-item').forEach(item => {
    item.hidden = _activeFilter !== 'all' && item.dataset.category !== _activeFilter;
  });
}

// ── View state ────────────────────────────────────────────────────────────────

function _setView(state: 'null' | 'scanning' | 'results'): void {
  const list = document.getElementById('lint-error-list');
  const nullS = document.getElementById('lint-null-state');
  const scanS = document.getElementById('lint-scan-state');

  if (list)  list.hidden  = state !== 'results';
  if (nullS) nullS.hidden = state !== 'null';
  if (scanS) scanS.hidden = state !== 'scanning';
}

function _updateBadge(count: number): void {
  const badge = document.getElementById('lint-error-badge');
  if (!badge) return;
  if (count === 0) {
    badge.hidden = true;
    badge.textContent = '';
  } else {
    badge.hidden = false;
    badge.textContent = `${count} error${count === 1 ? '' : 's'}`;
  }
}

// ── Public API stubs (handlers added in Phase 2 lint engine commit) ──────────
// handleLintResults, handleLintProgress, handleErrorIgnored, handleLintCancelled
// are wired here once the scan engine (lint-engine.ts) lands.
