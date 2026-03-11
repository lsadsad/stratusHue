/* =====================================================
   FIGMA SANDBOX MOCK SHIM
   Intercepts all parent.postMessage calls silently and
   fires realistic sandbox→UI response messages so the
   plugin UI renders fully in a plain browser tab.
   ===================================================== */
(function () {
  // 1. Intercept outbound messages — silence most, but handle toggle-width
  var protoIsCompact = false;
  Object.defineProperty(window, 'parent', {
    get: function () {
      return {
        postMessage: function (data) {
          if (!data || !data.pluginMessage) return;
          var msg = data.pluginMessage;
          if (msg.type === 'toggle-controls') {
            // Echo back so ui.ts updates controls visibility
            sendPluginMsg({ type: 'controls-setting', enabled: msg.enabled });
          }
          if (msg.type === 'toggle-width') {
            protoIsCompact = !protoIsCompact;
            var w = protoIsCompact ? '188px' : '240px';
            var chrome = document.getElementById('plugin-chrome');
            if (chrome) {
              chrome.style.setProperty('width', w, 'important');
              var main = chrome.querySelector('main.scrollable-content');
              var footer = chrome.querySelector('footer');
              [main, footer].forEach(function (el) {
                if (!el) return;
                el.style.setProperty('width', w, 'important');
                el.style.setProperty('min-width', w, 'important');
                el.style.setProperty('max-width', w, 'important');
              });
            }
          }
        }
      };
    },
    configurable: true
  });

  // 2. Inject styles for chrome card + centering — must override app's own body/html styles
  const shimStyle = document.createElement('style');
  shimStyle.textContent = `
    html, body {
      height: auto !important;
      overflow: visible !important;
    }
    html {
      background: #e8e8e8 !important;
    }
    body {
      background: transparent !important;
      display: flex !important;
      flex-direction: row !important;
      justify-content: center !important;
      align-items: flex-start !important;
      min-height: 100vh !important;
      padding: 40px 24px !important;
      margin: 0 !important;
      gap: 16px !important;
    }

    /* Plugin chrome card — simulates the Figma plugin window */
    #plugin-chrome {
      width: 240px !important;
      display: flex !important;
      flex-direction: column !important;
      border-radius: 10px !important;
      overflow: hidden !important;
      box-shadow: 0 8px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.18) !important;
      flex-shrink: 0 !important;
      /* No background — the main element's theme background provides it */
    }

    /* Figma-style title bar — always white (Figma chrome convention) */
    #plugin-title-bar {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 0 10px !important;
      height: 40px !important;
      min-height: 40px !important;
      background: #ffffff !important;
      flex-shrink: 0 !important;
    }

    /* Main content — use the theme's own background variable so every theme
       (figma-dark, figma-light, boilerplate, cybertron) paints the correct bg */
    #plugin-chrome main.scrollable-content {
      width: 240px !important;
      min-width: 240px !important;
      max-width: 240px !important;
      height: auto !important;
      max-height: none !important;
      border-radius: 0 !important;
      overflow-y: visible !important;
      overflow-x: hidden !important;
      flex-shrink: 0 !important;
      background: var(--color-background-main, var(--theme-bg-primary, #1e1e1e)) !important;
    }

    /* Footer attached to card — same background as main */
    #plugin-chrome footer {
      width: 240px !important;
      min-width: 240px !important;
      max-width: 240px !important;
      position: static !important;
      flex-shrink: 0 !important;
      background: var(--color-background-main, var(--theme-bg-primary, #1e1e1e)) !important;
    }
  `;
  document.head.appendChild(shimStyle);

  // 3. Helper: dispatch a fake plugin message into the UI
  function sendPluginMsg(payload) {
    window.dispatchEvent(new MessageEvent('message', {
      data: { pluginMessage: payload },
      origin: '*'
    }));
  }

  // 4. Fire all mock responses after the UI has fully initialised
  window.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {

      // Theme — use "dark" (matches the mockup)
      sendPluginMsg({
        type: 'theme-preference',
        theme: { mode: 'dark', systemTheme: 'dark', effectiveTheme: 'figma-dark' },
        storageInfo: { success: true, usedFallback: false }
      });

      // UI section states — Tags open, Anchors open, Controls open
      sendPluginMsg({
        type: 'ui-section-states',
        states: {
          'tags-header':     { expanded: true  },
          'anchors-header':  { expanded: true  },
          'controls-header': { expanded: true  }
        }
      });

      // Selection state — page "🟠 02.11 : Home", no layer selected
      sendPluginMsg({
        type: 'selection-state',
        hasLayerSelected: false,
        pageName: '🟠 02.11 : Home',
        selectedLayerName: null,
        pageEmojis: ['🔴','🟠','🟡','🟢','🔵','🟣','⚫️','⚪️'],
        layerEmojis: ['🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜'],
        selectionVisible: true,
        selectionLocked: false
      });

      // Emoji set indicator
      sendPluginMsg({
        type: 'emoji-navigation-state',
        setName: 'Colors',
        currentSetIndex: 0,
        totalSets: 4
      });

      // Bookmarks — populated for the "with anchors" state
      sendPluginMsg({
        type: 'bookmarks',
        bookmarks: [
          { id: 'bm1', name: '01.11 : Next Up',                       pageName: '10.01 : Page 3' },
          { id: 'bm2', name: 'Resources',                              pageName: '🟡 01.31 : CTX ECC' },
          { id: 'bm3', name: 'Consumer Technology Experience ...',     pageName: '🟡 01.31 : CTX ECC' },
          { id: 'bm4', name: '✨ 02.11 : [domain_feature]',            pageName: '🟠 02.11 : Rive FINAL Delivery Files' }
        ],
        currentAnchorId: null,
        previousBookmarkId: 'bm1',
        isInsideAnchor: false
      });

      // Navigation back/forward state
      sendPluginMsg({ type: 'navigation-state', canGoBack: false, canGoForward: false });

      // Controls enabled
      sendPluginMsg({ type: 'controls-setting', enabled: true });

      // All control groups visible
      sendPluginMsg({
        type: 'controls-group-settings',
        groups: { movementZoom: true, hierarchy: true, sizingModes: true, styledText: true }
      });

      // Navigation context (page mode — no layer selected)
      sendPluginMsg({
        type: 'navigation-context-update',
        context: {
          hasSelection: false,
          canEnter: true,
          canExit: false,
          canNavigateSiblings: true,
          containerCount: 0,
          siblingContainerCount: 0,
          hasCollapsibleSiblings: false,
          hasComponentInstance: false
        }
      });

      // Nudge defaults
      sendPluginMsg({ type: 'nudge-settings', smallNudge: 1, bigNudge: 8 });

      // Layout sizing state
      sendPluginMsg({ type: 'update-layout-state', horizontal: null, vertical: null });

      // ── Build control panel ────────────────────────────────────────────
      buildControlPanel(sendPluginMsg);

      // ── Settings overlay: confine to plugin chrome card ───────────────
      var settingsOverlay = document.getElementById('settings-overlay');
      var pluginChrome   = document.getElementById('plugin-chrome');
      if (settingsOverlay && pluginChrome) {
        new MutationObserver(function () {
          var isOpen = settingsOverlay.classList.contains('open');
          if (isOpen) {
            var rect = pluginChrome.getBoundingClientRect();
            settingsOverlay.style.setProperty('top',    rect.top    + 'px', 'important');
            settingsOverlay.style.setProperty('left',   rect.left   + 'px', 'important');
            settingsOverlay.style.setProperty('right',  'auto',              'important');
            settingsOverlay.style.setProperty('bottom', 'auto',              'important');
            settingsOverlay.style.setProperty('width',  rect.width  + 'px', 'important');
            settingsOverlay.style.setProperty('height', rect.height + 'px', 'important');
            settingsOverlay.style.setProperty('border-radius', '10px',       'important');
            settingsOverlay.style.setProperty('overflow', 'hidden',          'important');
          }
        }).observe(settingsOverlay, { attributes: true, attributeFilter: ['class'] });
      }

      // ── Sync ctrl-panel theme buttons when data-theme changes ─────────
      var THEME_SWATCHES = {
        'figma-dark':  '#1e1e1e',
        'figma-light': '#ffffff',
        'boilerplate': '#23201c',
        'cybertron':   '#0d0f1a'
      };
      new MutationObserver(function () {
        var theme = document.documentElement.getAttribute('data-theme') || '';
        document.querySelectorAll('#ctrl-panel [data-theme-key]').forEach(function (btn) {
          var key    = btn.dataset.themeKey;
          var active = key === theme;
          var swatch = THEME_SWATCHES[key] || 'transparent';
          btn.style.background   = active ? 'rgba(255,255,255,0.08)' : 'transparent';
          btn.style.borderLeft   = '2px solid ' + (active ? swatch : 'transparent');
        });
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    }, 300); // 300ms — after UI init + Lottie setup completes
  });

  // ── Control Panel ────────────────────────────────────────────────────────
  function buildControlPanel(sendMsg) {
    var STATES = {
      'Layer Selected': function() {
        sendMsg({ type: 'selection-state', hasLayerSelected: true, pageName: '🟠 02.11 : Home', selectedLayerName: '🟧 CTA Button / Primary', pageEmojis: ['🔴','🟠','🟡','🟢','🔵','🟣','⚫️','⚪️'], layerEmojis: ['🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜'], selectionVisible: true, selectionLocked: false });
        sendMsg({ type: 'navigation-context-update', context: { hasSelection: true, canEnter: true, canExit: true, canNavigateSiblings: true, containerCount: 2, siblingContainerCount: 3, hasCollapsibleSiblings: true, hasComponentInstance: true } });
        sendMsg({ type: 'update-layout-state', horizontal: 'FIXED', vertical: 'HUG' });
        sendMsg({ type: 'navigation-state', canGoBack: true, canGoForward: false });
      },
      'No Selection': function() {
        sendMsg({ type: 'selection-state', hasLayerSelected: false, pageName: '🟠 02.11 : Home', selectedLayerName: null, pageEmojis: ['🔴','🟠','🟡','🟢','🔵','🟣','⚫️','⚪️'], layerEmojis: ['🟥','🟧','🟨','🟩','🟦','🟪','⬛','⬜'], selectionVisible: true, selectionLocked: false });
        sendMsg({ type: 'navigation-context-update', context: { hasSelection: false, canEnter: true, canExit: false, canNavigateSiblings: true, containerCount: 0, siblingContainerCount: 0, hasCollapsibleSiblings: false, hasComponentInstance: false } });
        sendMsg({ type: 'update-layout-state', horizontal: null, vertical: null });
        sendMsg({ type: 'navigation-state', canGoBack: false, canGoForward: false });
      }
    };

    var THEMES = [
      { key: 'figma-dark',  label: 'Figma Dark',  swatch: '#1e1e1e', text: '#fff' },
      { key: 'figma-light', label: 'Figma Light', swatch: '#ffffff', text: '#111' },
      { key: 'boilerplate', label: 'Boilerplate', swatch: '#23201c', text: '#e8b96a' },
      { key: 'cybertron',   label: 'Cybertron',   swatch: '#0d0f1a', text: '#00ffe0' }
    ];

    var panel = document.createElement('div');
    panel.id = 'ctrl-panel';
    panel.style.cssText = [
      'width:160px', 'flex-shrink:0', 'display:flex', 'flex-direction:column', 'gap:12px',
      'margin-top:40px',
      'font-family:-apple-system,BlinkMacSystemFont,"Inter",sans-serif'
    ].join(';');

    function section(title, content) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'background:#1a1a1a;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)';
      var hdr = document.createElement('div');
      hdr.textContent = title;
      hdr.style.cssText = 'font-size:9px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.35);padding:8px 10px 6px;border-bottom:1px solid rgba(255,255,255,0.06)';
      wrap.appendChild(hdr);
      wrap.appendChild(content);
      return wrap;
    }

    // ── Theme buttons ────────────────────────────
    var themeContent = document.createElement('div');
    themeContent.style.cssText = 'display:flex;flex-direction:column;gap:0';
    var activeTheme = document.documentElement.getAttribute('data-theme') || 'figma-dark';
    THEMES.forEach(function(t) {
      var btn = document.createElement('button');
      btn.dataset.themeKey = t.key;
      var isActive = t.key === activeTheme;
      btn.style.cssText = [
        'display:flex', 'align-items:center', 'gap:8px',
        'padding:7px 10px', 'border:none', 'cursor:pointer', 'width:100%', 'text-align:left',
        'background:' + (isActive ? 'rgba(255,255,255,0.08)' : 'transparent'),
        'border-left:2px solid ' + (isActive ? t.swatch : 'transparent'),
        'transition:background 0.12s'
      ].join(';');
      btn.innerHTML = '<span style="width:10px;height:10px;border-radius:50%;display:inline-block;flex-shrink:0;background:' + t.swatch + ';border:1px solid rgba(255,255,255,0.18);"></span>' +
        '<span style="font-size:11px;color:rgba(255,255,255,0.7);white-space:nowrap;">' + t.label + '</span>';
      btn.addEventListener('mouseover', function() { if (btn.dataset.themeKey !== activeTheme) btn.style.background = 'rgba(255,255,255,0.04)'; });
      btn.addEventListener('mouseout', function() { if (btn.dataset.themeKey !== activeTheme) btn.style.background = 'transparent'; });
      btn.addEventListener('click', function() {
        activeTheme = t.key;
        document.documentElement.setAttribute('data-theme', t.key);
        document.querySelectorAll('#ctrl-panel [data-theme-key]').forEach(function(b) {
          var bkey = b.dataset.themeKey;
          var match = THEMES.find(function(x) { return x.key === bkey; });
          var active = bkey === activeTheme;
          b.style.background = active ? 'rgba(255,255,255,0.08)' : 'transparent';
          b.style.borderLeft = '2px solid ' + (active ? match.swatch : 'transparent');
        });
      });
      themeContent.appendChild(btn);
    });
    panel.appendChild(section('Theme', themeContent));

    // ── State buttons ────────────────────────────
    var stateContent = document.createElement('div');
    stateContent.style.cssText = 'display:flex;flex-direction:column;gap:0';
    var stateNames = Object.keys(STATES);
    var activeState = 'No Selection';
    stateNames.forEach(function(name) {
      var btn = document.createElement('button');
      btn.dataset.stateName = name;
      var isActive = name === activeState;
      btn.style.cssText = [
        'display:flex', 'align-items:center', 'gap:8px',
        'padding:7px 10px', 'border:none', 'cursor:pointer', 'width:100%', 'text-align:left',
        'background:' + (isActive ? 'rgba(255,255,255,0.08)' : 'transparent'),
        'border-left:2px solid ' + (isActive ? 'rgba(255,255,255,0.4)' : 'transparent'),
        'transition:background 0.12s'
      ].join(';');
      btn.innerHTML = '<span style="font-size:11px;color:rgba(255,255,255,0.7);white-space:nowrap;">' + name + '</span>';
      btn.addEventListener('mouseover', function() { if (btn.dataset.stateName !== activeState) btn.style.background = 'rgba(255,255,255,0.04)'; });
      btn.addEventListener('mouseout', function() { if (btn.dataset.stateName !== activeState) btn.style.background = 'transparent'; });
      btn.addEventListener('click', function() {
        activeState = name;
        STATES[name]();
        document.querySelectorAll('#ctrl-panel [data-state-name]').forEach(function(b) {
          var bname = b.dataset.stateName;
          var active = bname === activeState;
          b.style.background = active ? 'rgba(255,255,255,0.08)' : 'transparent';
          b.style.borderLeft = '2px solid ' + (active ? 'rgba(255,255,255,0.4)' : 'transparent');
        });
      });
      stateContent.appendChild(btn);
    });
    panel.appendChild(section('State', stateContent));

    // ── Label ────────────────────────────────────
    var label = document.createElement('div');
    label.textContent = 'prototype controls';
    label.style.cssText = 'font-size:9px;color:rgba(255,255,255,0.2);text-align:center;letter-spacing:0.08em;padding-top:2px';
    panel.appendChild(label);

    document.body.appendChild(panel);
  }

})();
