// Lightweight startup diagnostics to help debug mobile blanking
(function() {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // Expose a diagnostics object for the console
    window.__luxDiagnostics = window.__luxDiagnostics || { logs: [] };
    const log = (msg, data) => {
      const entry = { t: new Date().toISOString(), msg, data };
      window.__luxDiagnostics.logs.push(entry);
      // Keep logs visible in console
      try { console.debug('[luxdiag]', msg, data); } catch (e) {}
    };

    // Capture runtime errors and unhandled rejections
    window.addEventListener('error', (ev) => {
      log('window.error', { message: ev.message, filename: ev.filename, lineno: ev.lineno, colno: ev.colno, error: ev.error && (ev.error.message || ev.error) });
    });
    window.addEventListener('unhandledrejection', (ev) => {
      log('unhandledrejection', { reason: ev.reason && (ev.reason.message || ev.reason) });
    });

    // Observe class and style changes on <html> and <body>
    const observeAttrs = (node, name) => {
      const mo = new MutationObserver((records) => {
        records.forEach(r => {
          if (r.type === 'attributes') {
            log(`${name}.attributeChanged`, { attributeName: r.attributeName, newValue: node.getAttribute(r.attributeName) });
          }
        });
      });
      mo.observe(node, { attributes: true, attributeFilter: ['class', 'style'] });
      return mo;
    };

    const html = document.documentElement;
    const body = document.body;
    const htmlMo = observeAttrs(html, 'html');
    const bodyMo = observeAttrs(body, 'body');

    // Observe additions/removals of top-level children under <body>
    const bodyChildrenMo = new MutationObserver((records) => {
      records.forEach(r => {
        if (r.type === 'childList') {
          log('body.childList', { added: r.addedNodes ? r.addedNodes.length : 0, removed: r.removedNodes ? r.removedNodes.length : 0 });
        }
      });
    });
    bodyChildrenMo.observe(body, { childList: true });

    // Snapshot function to check for any fullscreen overlays that might cover the page
    const snapshot = () => {
      try {
        const nodes = Array.from(document.body.querySelectorAll('*'));
        const overlays = nodes.filter(n => {
          const style = window.getComputedStyle(n);
          if (!style) return false;
          // candidate overlay: fixed or absolute, full-screen and visible
          const isFixed = style.position === 'fixed' || style.position === 'absolute';
          const isFull = (style.top === '0px' || style.top === '0') && (style.left === '0px' || style.left === '0') && (style.width === '100%' || style.width === '100vw' || n.getBoundingClientRect().width >= window.innerWidth - 2) && (style.height === '100%' || style.height === '100vh' || n.getBoundingClientRect().height >= window.innerHeight - 2);
          const isVisible = style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity || '1') > 0;
          const z = parseInt(style.zIndex || '0') || 0;
          return isFixed && isFull && isVisible && z >= 1;
        });

        log('snapshot', { totalNodes: nodes.length, overlays: overlays.map(n => ({ tag: n.tagName, id: n.id, class: n.className, z: window.getComputedStyle(n).zIndex })) });

        // Also list any nodes with display:none or visibility:hidden that are direct children of body
        const hid = Array.from(document.body.children).map(ch => ({ tag: ch.tagName, id: ch.id, class: ch.className, styles: { display: window.getComputedStyle(ch).display, visibility: window.getComputedStyle(ch).visibility, opacity: window.getComputedStyle(ch).opacity } }));
        log('body.children.styles', hid);
      } catch (e) {
        log('snapshot.error', String(e));
      }
    };

    // Run initial snapshot and schedule another after 1.5s and 3s to capture transient changes
    snapshot();
    setTimeout(snapshot, 1500);
    setTimeout(snapshot, 3000);

    // Expose snapshot on window for manual triggering
    window.__luxDiagnostics.snapshot = snapshot;

    // Keep references to observers for later inspection if needed
    window.__luxDiagnostics._internals = { htmlMo, bodyMo, bodyChildrenMo };

    log('startupDiagnostics.initialized', { userAgent: navigator.userAgent });
  } catch (err) {
    try { console.error('startupDiagnostics init failed', err); } catch (e) {}
  }
})();
