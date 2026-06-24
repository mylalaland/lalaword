// ============================================
// LalaWord Toast Component
// ============================================

const Toast = (() => {
  let container = null;

  function init() {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translateX(-50%);
      z-index: var(--z-toast, 60);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: calc(100% - 32px);
      max-width: 400px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  function show(message, type = 'info', duration = 3000) {
    if (!container) init();

    const toast = document.createElement('div');
    const colors = {
      success: { bg: '#EFF8EF', border: '#5CB85C', icon: '✅' },
      error: { bg: '#FCEEF1', border: '#D4637A', icon: '❌' },
      warning: { bg: '#FFF6E5', border: '#E9A23B', icon: '⚠️' },
      info: { bg: '#EBF3FC', border: '#4A90D9', icon: 'ℹ️' },
    };
    const c = colors[type] || colors.info;

    toast.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: ${c.bg};
      border: 1px solid ${c.border}22;
      border-left: 3px solid ${c.border};
      border-radius: 12px;
      font-size: 14px;
      color: #1A1A1A;
      box-shadow: 0 4px 16px rgba(0,0,0,0.08);
      animation: toastIn 300ms ease both;
      pointer-events: auto;
      width: 100%;
    `;

    toast.innerHTML = `<span style="font-size:16px;flex-shrink:0">${c.icon}</span><span style="flex:1;line-height:1.4">${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastOut 300ms ease both';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function success(msg, dur) { show(msg, 'success', dur); }
  function error(msg, dur) { show(msg, 'error', dur); }
  function warning(msg, dur) { show(msg, 'warning', dur); }
  function info(msg, dur) { show(msg, 'info', dur); }

  return { init, show, success, error, warning, info };
})();
