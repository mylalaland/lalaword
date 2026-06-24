// ============================================
// LalaWord Modal / Bottom Sheet Component
// ============================================

const Modal = (() => {
  let activeModal = null;

  function show({ title, content, actions, type = 'bottom-sheet', closable = true }) {
    close(); // Close any existing

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      z-index: var(--z-modal-backdrop, 40);
      animation: modalBackdropIn 200ms ease both;
    `;

    const modal = document.createElement('div');
    modal.className = 'modal-content';

    if (type === 'bottom-sheet') {
      modal.style.cssText = `
        position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
        width: 100%; max-width: 480px;
        background: #fff; border-radius: 20px 20px 0 0;
        padding: 24px 20px calc(24px + env(safe-area-inset-bottom, 0px));
        z-index: var(--z-modal, 50);
        animation: bottomSheetIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
        max-height: 85vh; overflow-y: auto;
      `;
    } else {
      modal.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        width: calc(100% - 48px); max-width: 360px;
        background: #fff; border-radius: 20px;
        padding: 24px 20px;
        z-index: var(--z-modal, 50);
        animation: scaleIn 250ms ease both;
      `;
    }

    // Handle bar for bottom sheet
    let html = '';
    if (type === 'bottom-sheet') {
      html += '<div style="width:40px;height:4px;background:#E0E0E0;border-radius:2px;margin:0 auto 16px;"></div>';
    }

    if (title) {
      html += `<div style="font-size:18px;font-weight:700;margin-bottom:16px;color:#1A1A1A;">${title}</div>`;
    }

    if (typeof content === 'string') {
      html += `<div style="font-size:14px;color:#5A5A5A;line-height:1.7;margin-bottom:20px;">${content}</div>`;
    }

    if (actions && actions.length) {
      html += '<div style="display:flex;gap:10px;margin-top:8px;">';
      actions.forEach(action => {
        const btnClass = action.primary ? 'btn btn-primary btn-block' : 'btn btn-outline btn-block';
        html += `<button class="${btnClass}" data-action="${action.id || ''}">${action.label}</button>`;
      });
      html += '</div>';
    }

    modal.innerHTML = html;

    if (typeof content === 'object' && content instanceof HTMLElement) {
      const contentDiv = modal.querySelector('div:nth-child(2)') || modal;
      contentDiv.appendChild(content);
    }

    // Event listeners
    if (closable) {
      backdrop.addEventListener('click', close);
    }

    modal.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = actions?.find(a => a.id === btn.dataset.action);
        if (action?.onClick) action.onClick();
        if (action?.autoClose !== false) close();
      });
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    activeModal = { backdrop, modal };
    return activeModal;
  }

  function close() {
    if (!activeModal) return;
    const { backdrop, modal } = activeModal;
    backdrop.style.animation = 'fadeOut 200ms ease both';
    const isBottomSheet = modal.style.bottom === '0px';
    modal.style.animation = isBottomSheet
      ? 'bottomSheetOut 200ms ease both'
      : 'fadeOut 200ms ease both';
    setTimeout(() => {
      backdrop.remove();
      modal.remove();
      document.body.style.overflow = '';
    }, 200);
    activeModal = null;
  }

  function confirm({ title, message, confirmText = '확인', cancelText = '취소', danger = false }) {
    return new Promise((resolve) => {
      show({
        title,
        content: message,
        type: 'center',
        actions: [
          { id: 'cancel', label: cancelText, onClick: () => resolve(false) },
          { id: 'confirm', label: confirmText, primary: true, onClick: () => resolve(true) },
        ],
      });
    });
  }

  return { show, close, confirm };
})();
