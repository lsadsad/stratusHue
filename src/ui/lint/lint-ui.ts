// Lint mode UI — Phase 2
// Populates #validate-main on first activation. Called lazily from ui.ts activateMode().

import { sendMessage } from '../shared/send-message';
import type { LintError, LintScope } from '../../core/lint-types';

let _initialized = false;
let _currentErrors: LintError[] = [];
let _activeFilter = 'all';
/** errorId of the most recently navigated-to item — drives the active highlight. */
let _activeErrorId: string | null = null;
/** Active scan scope — mirrors LintSettings.lintScope, restored on settings load. */
let _currentScope: LintScope = 'selection';
/** Emoji used in "tagged" scope mode — shown in the null-state hint. */
let _currentScopeEmoji: string = '✅';

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

  // Scope selector — opt-in model: Selected | Tagged | Page
  const scopeBar = document.createElement('div');
  scopeBar.id = 'lint-scope-bar';
  scopeBar.className = 'lint-scope-bar';
  scopeBar.setAttribute('role', 'group');
  scopeBar.setAttribute('aria-label', 'Scan scope');

  const scopeOptions: Array<{ id: LintScope; label: string; title: string }> = [
    { id: 'selection', label: 'Selected', title: 'Scan only selected frames and layers' },
    { id: 'tagged',    label: 'Tagged',   title: `Scan only frames tagged with the scope emoji` },
    { id: 'page',      label: 'Page',     title: 'Scan all layers on the current page' },
  ];

  scopeOptions.forEach(({ id, label, title }) => {
    const btn = document.createElement('button');
    btn.className = 'lint-scope-btn' + (id === _currentScope ? ' active' : '');
    btn.dataset.scope = id;
    btn.title = title;
    btn.textContent = label;
    btn.addEventListener('click', () => _setScope(id));
    scopeBar.appendChild(btn);
  });

  frag.appendChild(scopeBar);

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

  // Batch action bar
  const batchBar = document.createElement('div');
  batchBar.id = 'lint-batch-bar';
  batchBar.className = 'lint-batch-bar';
  batchBar.hidden = true;
  batchBar.innerHTML = `
    <button id="lint-select-all-btn" class="lint-batch-btn" aria-label="Select all visible error nodes in canvas">Select All</button>
    <button id="lint-fix-all-btn" class="lint-batch-btn lint-batch-btn--primary" aria-label="Fix all auto-fixable errors">Fix All</button>
    <button id="lint-ignore-all-btn" class="lint-batch-btn lint-batch-btn--danger" aria-label="Ignore all visible errors">Ignore All</button>
  `;
  frag.appendChild(batchBar);

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
    <button id="lint-cancel-btn" class="lint-cancel-btn" aria-label="Cancel scan">Cancel</button>
  `;
  frag.appendChild(scanState);

  container.appendChild(frag);

  // Scan button
  document.getElementById('lint-scan-btn')?.addEventListener('click', requestLintScan);

  // Cancel button — visible only during scanning state
  document.getElementById('lint-cancel-btn')?.addEventListener('click', () => {
    sendMessage('lint-cancel-scan');
  });

  // Batch action bar buttons
  document.getElementById('lint-select-all-btn')?.addEventListener('click', _onSelectAll);
  document.getElementById('lint-fix-all-btn')?.addEventListener('click', _onFixAll);
  document.getElementById('lint-ignore-all-btn')?.addEventListener('click', _onIgnoreAll);

  // Settings panel wiring
  _setupLintSettings();

  // Request current settings from sandbox so form reflects persisted state
  sendMessage('lint-get-settings');
}

// ── Scan ──────────────────────────────────────────────────────────────────────

function requestLintScan(): void {
  _setView('scanning');
  sendMessage('lint-run-scan');
}

// ── Scope ─────────────────────────────────────────────────────────────────────

/**
 * Change the active scan scope.
 * Updates the segmented control, persists via sandbox, and triggers a scan.
 */
function _setScope(scope: LintScope): void {
  if (_currentScope === scope) return;
  _currentScope = scope;
  document.querySelectorAll<HTMLButtonElement>('.lint-scope-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.scope === scope);
  });
  _setView('scanning');
  sendMessage('lint-set-scope', { scope });
}

// ── Null state (scope-aware) ──────────────────────────────────────────────────

/**
 * Show the null/empty state with messaging appropriate to the current scope.
 * @param nodeCount — number of nodes that were actually scanned (from lint-results payload)
 */
function _setNullState(nodeCount: number): void {
  const nullIcon = document.querySelector<HTMLElement>('.lint-null-icon');
  const nullMsg  = document.querySelector<HTMLElement>('.lint-null-message');
  const nullSub  = document.querySelector<HTMLElement>('.lint-null-sub');

  if (nodeCount === 0 && _currentScope === 'selection') {
    if (nullIcon) nullIcon.textContent = '↖';
    if (nullMsg)  nullMsg.textContent  = 'Nothing selected';
    if (nullSub)  nullSub.textContent  = 'Select a frame or layer on the canvas to scan';
  } else if (nodeCount === 0 && _currentScope === 'tagged') {
    if (nullIcon) nullIcon.textContent = '🏷';
    if (nullMsg)  nullMsg.textContent  = 'No tagged frames';
    if (nullSub)  nullSub.textContent  = `Add ${_currentScopeEmoji} to a frame name to include it`;
  } else {
    // nodeCount > 0 with no errors, or page scope with nothing
    if (nullIcon) nullIcon.textContent = '✓';
    if (nullMsg)  nullMsg.textContent  = 'No style errors found';
    if (nullSub)  nullSub.textContent  = 'Click Scan to check again';
  }

  _setView('null');
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

function _setView(state: 'null' | 'scanning' | 'results' | 'large-file'): void {
  const list = document.getElementById('lint-error-list');
  const nullS = document.getElementById('lint-null-state');
  const scanS = document.getElementById('lint-scan-state');
  const batchBar = document.getElementById('lint-batch-bar');

  if (list)     list.hidden     = state !== 'results';
  if (nullS)    nullS.hidden    = state !== 'null' && state !== 'large-file';
  if (scanS)    scanS.hidden    = state !== 'scanning';
  if (batchBar) batchBar.hidden = state !== 'results';
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

// ── Error list rendering ──────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  fill: 'FILL', stroke: 'STROKE', text: 'TEXT', effects: 'EFFECTS', radius: 'RADIUS',
};

function _renderErrors(errors: LintError[]): void {
  const list = document.getElementById('lint-error-list');
  if (!list) return;

  list.innerHTML = '';

  // If the previously active error no longer exists in the new list, clear it
  if (_activeErrorId && !errors.find(e => e.id === _activeErrorId)) {
    _activeErrorId = null;
  }

  errors.forEach(err => {
    const li = document.createElement('li');
    li.className = 'lint-error-item';
    li.dataset.errorId = err.id;
    li.dataset.category = err.category;

    const catLabel = CATEGORY_LABELS[err.category] ?? err.category.toUpperCase();
    const hasFix = Boolean(err.suggestedStyleId);

    li.innerHTML = `
      <div class="lint-item-row" aria-label="Select ${err.nodeName} in canvas">
        <span class="lint-cat-badge lint-cat-${err.category}">${catLabel}</span>
        <span class="lint-item-name">${_esc(err.nodeName)}</span>
      </div>
      <div class="lint-item-detail">${_esc(err.message)}</div>
      <div class="lint-item-actions">
        ${hasFix ? `<button class="lint-action-btn lint-fix-btn" data-error-id="${err.id}" data-node-id="${err.nodeId}" data-category="${err.category}" data-style-id="${err.suggestedStyleId}" title="Apply suggested style: ${_esc(err.suggestedStyleName ?? '')}">Fix</button>` : ''}
        <button class="lint-action-btn lint-ignore-btn" data-error-id="${err.id}" title="Ignore this error">Ignore</button>
      </div>
    `;

    // Clicking anywhere on the card navigates to the node and marks it active.
    // Fix/Ignore buttons call e.stopPropagation() so they don't trigger this.
    li.addEventListener('click', () => {
      _setActiveItem(err.id);
      sendMessage('lint-select-node', { nodeId: err.nodeId });
    });

    // Fix button
    li.querySelector('.lint-fix-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget as HTMLButtonElement;
      sendMessage('lint-apply-fix', {
        nodeId: btn.dataset.nodeId ?? '',
        category: btn.dataset.category ?? '',
        styleId: btn.dataset.styleId ?? '',
      });
    });

    // Ignore button
    li.querySelector('.lint-ignore-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget as HTMLButtonElement;
      const errorId = btn.dataset.errorId ?? '';
      sendMessage('lint-ignore-error', { errorId });
    });

    list.appendChild(li);
  });

  // Restore active highlight if the previously selected item is still present
  if (_activeErrorId) {
    document.querySelector<HTMLElement>(`[data-error-id="${_activeErrorId}"]`)
      ?.classList.add('lint-item--active');
  }
}

function _esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Mark errorId as active (last navigated). Clears any previous active item. */
function _setActiveItem(errorId: string): void {
  if (_activeErrorId) {
    document.querySelector<HTMLElement>(`[data-error-id="${_activeErrorId}"]`)
      ?.classList.remove('lint-item--active');
  }
  _activeErrorId = errorId;
  document.querySelector<HTMLElement>(`[data-error-id="${errorId}"]`)
    ?.classList.add('lint-item--active');
}

// ── Batch action handlers ─────────────────────────────────────────────────────

function _getVisibleErrors(): LintError[] {
  if (_activeFilter === 'all') return _currentErrors;
  return _currentErrors.filter(e => e.category === _activeFilter);
}

function _onSelectAll(): void {
  const nodeIds = [...new Set(_getVisibleErrors().map(e => e.nodeId))];
  if (nodeIds.length === 0) return;
  sendMessage('lint-select-all', { nodeIds });
}

function _onFixAll(): void {
  const fixes = _getVisibleErrors()
    .filter(e => e.suggestedStyleId)
    .map(e => ({ nodeId: e.nodeId, category: e.category, styleId: e.suggestedStyleId! }));
  if (fixes.length === 0) {
    return; // no fixable errors
  }
  _setView('scanning');
  sendMessage('lint-fix-all', { fixes });
}

function _onIgnoreAll(): void {
  const errorIds = _getVisibleErrors().map(e => e.id);
  if (errorIds.length === 0) return;
  sendMessage('lint-ignore-all', { errorIds });
}

// ── Public API (called from ui.ts message handler) ────────────────────────────

export function handleLintResults(errors: unknown[], nodeCount: number): void {
  _currentErrors = errors as LintError[];
  _renderErrors(_currentErrors);
  _updateBadge(_currentErrors.length);
  if (_currentErrors.length === 0) {
    _setNullState(nodeCount);
  } else {
    _setView('results');
  }
  _applyFilter();
}

export function handleLintProgress(scanned: number, total: number): void {
  _setView('scanning');
  const fill = document.getElementById('lint-progress-fill');
  const label = document.getElementById('lint-progress-label');
  const pct = total > 0 ? Math.round((scanned / total) * 100) : 0;
  if (fill) fill.style.width = `${pct}%`;
  if (label) label.textContent = `Scanning… ${scanned} / ${total}`;
}

export function handleErrorIgnored(errorId: string): void {
  // Remove the item immediately from the DOM
  const item = document.querySelector<HTMLElement>(`[data-error-id="${errorId}"]`);
  if (item) {
    item.remove();
    _currentErrors = _currentErrors.filter(e => e.id !== errorId);
    if (_activeErrorId === errorId) _activeErrorId = null;
    _updateBadge(_currentErrors.length);
    if (_currentErrors.length === 0) _setView('null');
  }
}

export function handleIgnoredAll(errorIds: string[]): void {
  for (const id of errorIds) {
    const item = document.querySelector<HTMLElement>(`[data-error-id="${id}"]`);
    item?.remove();
  }
  _currentErrors = _currentErrors.filter(e => !errorIds.includes(e.id));
  _updateBadge(_currentErrors.length);
  if (_currentErrors.length === 0) _setView('null');
}

export function handleLintLargeFile(nodeCount: number): void {
  const nullMsg = document.querySelector<HTMLElement>('.lint-null-message');
  const nullSub = document.querySelector<HTMLElement>('.lint-null-sub');
  if (nullMsg) nullMsg.textContent = 'Large file detected';
  if (nullSub) nullSub.textContent = `${nodeCount.toLocaleString()} nodes — click Scan to begin`;
  _setView('large-file');
}

export function handleLintCancelled(): void {
  _setView('null');
}

// ── Lint settings wiring ──────────────────────────────────────────────────────

function _setupLintSettings(): void {
  const categoryIds = ['fill', 'stroke', 'text', 'effects', 'radius'] as const;

  // Category toggles — send update + re-scan on every change
  categoryIds.forEach(cat => {
    document.getElementById(`lint-toggle-${cat}`)?.addEventListener('change', () => {
      _flushLintSettings();
    });
  });

  // Border radius input — update on blur or Enter
  const radiiInput = document.getElementById('lint-allowed-radii') as HTMLInputElement | null;
  radiiInput?.addEventListener('blur', () => _flushLintSettings());
  radiiInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLInputElement).blur();
    }
  });

  // Skip layer names input — update on blur or Enter
  const skipInput = document.getElementById('lint-skip-names') as HTMLInputElement | null;
  skipInput?.addEventListener('blur', () => _flushLintSettings());
  skipInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLInputElement).blur();
    }
  });

  // Tagged scope emoji — update on blur or Enter
  const emojiInput = document.getElementById('lint-scope-emoji') as HTMLInputElement | null;
  emojiInput?.addEventListener('blur', () => _flushLintSettings());
  emojiInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      (e.currentTarget as HTMLInputElement).blur();
    }
  });
}

function _flushLintSettings(): void {
  const enabled = (id: string) =>
    (document.getElementById(id) as HTMLInputElement | null)?.checked ?? true;

  const radiiRaw = (document.getElementById('lint-allowed-radii') as HTMLInputElement | null)?.value ?? '';
  const allowedRadii = radiiRaw
    .split(',')
    .map(s => parseFloat(s.trim()))
    .filter(n => !isNaN(n));

  const skipRaw = (document.getElementById('lint-skip-names') as HTMLInputElement | null)?.value ?? '';
  const skipLayerNames = skipRaw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const lintScopeEmoji = ((document.getElementById('lint-scope-emoji') as HTMLInputElement | null)?.value ?? '✅').trim() || '✅';
  // Sync local emoji state so null-state messages stay current
  _currentScopeEmoji = lintScopeEmoji;

  sendMessage('lint-update-settings', {
    settings: {
      enableFill:    enabled('lint-toggle-fill'),
      enableStroke:  enabled('lint-toggle-stroke'),
      enableText:    enabled('lint-toggle-text'),
      enableEffects: enabled('lint-toggle-effects'),
      enableRadius:  enabled('lint-toggle-radius'),
      allowedRadii:  allowedRadii.length > 0 ? allowedRadii : [0, 2, 4, 8, 16, 24, 100],
      skipLayerNames,
      lintScopeEmoji,
    },
  });
}

export function handleLintSettingsLoaded(settings: Record<string, unknown>): void {
  const setCheck = (id: string, val: unknown) => {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el) el.checked = val !== false;
  };

  setCheck('lint-toggle-fill',    settings.enableFill);
  setCheck('lint-toggle-stroke',  settings.enableStroke);
  setCheck('lint-toggle-text',    settings.enableText);
  setCheck('lint-toggle-effects', settings.enableEffects);
  setCheck('lint-toggle-radius',  settings.enableRadius);

  if (Array.isArray(settings.allowedRadii) && settings.allowedRadii.length > 0) {
    const radiiInput = document.getElementById('lint-allowed-radii') as HTMLInputElement | null;
    if (radiiInput) radiiInput.value = (settings.allowedRadii as number[]).join(', ');
  }

  if (Array.isArray(settings.skipLayerNames)) {
    const skipInput = document.getElementById('lint-skip-names') as HTMLInputElement | null;
    if (skipInput) skipInput.value = (settings.skipLayerNames as string[]).join(', ');
  }

  // Restore scope selector
  if (typeof settings.lintScope === 'string') {
    const scope = settings.lintScope as LintScope;
    _currentScope = scope;
    document.querySelectorAll<HTMLButtonElement>('.lint-scope-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scope === scope);
    });
  }

  // Restore tagged emoji
  if (typeof settings.lintScopeEmoji === 'string' && settings.lintScopeEmoji) {
    _currentScopeEmoji = settings.lintScopeEmoji as string;
    const emojiInput = document.getElementById('lint-scope-emoji') as HTMLInputElement | null;
    if (emojiInput) emojiInput.value = _currentScopeEmoji;
  }
}
