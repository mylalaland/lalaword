// ============================================
// LalaWord Loading Overlay
// ============================================

const Loading = (() => {
  let overlay = null;

  function show(message = '잠시만요...') {
    hide();
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(4px);
      z-index: var(--z-modal, 50);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 16px;
      animation: fadeIn 200ms ease both;
    `;
    overlay.innerHTML = `
      <div style="width:48px;height:48px;border:3px solid #F0F0EC;border-top-color:#E8664A;border-radius:50%;animation:spin 0.8s linear infinite;"></div>
      <div style="font-size:15px;font-weight:500;color:#5A5A5A;" id="loading-message">${message}</div>
    `;
    document.body.appendChild(overlay);
  }

  function updateMessage(message) {
    const el = document.getElementById('loading-message');
    if (el) el.textContent = message;
  }

  function hide() {
    if (overlay) {
      overlay.style.animation = 'fadeOut 150ms ease both';
      setTimeout(() => { overlay?.remove(); overlay = null; }, 150);
    }
  }

  return { show, hide, updateMessage };
})();
