// ============================================
// LalaWord PIN Input Component
// ============================================

const PinInput = (() => {

  function show({ title = 'PIN 입력', subtitle = '', length = 4, onComplete, onCancel }) {
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      z-index: 50; animation: fadeIn 200ms ease both;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed; inset: 0;
      z-index: 51;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: 32px;
    `;

    let pin = '';

    function render() {
      container.innerHTML = `
        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px;">${title}</div>
          ${subtitle ? `<div style="font-size:14px;color:rgba(255,255,255,0.7);">${subtitle}</div>` : ''}
        </div>
        <div style="display:flex;gap:16px;margin-bottom:40px;">
          ${Array.from({ length }, (_, i) => `
            <div style="width:16px;height:16px;border-radius:50%;
              background:${i < pin.length ? '#E8664A' : 'rgba(255,255,255,0.3)'};
              transition:all 150ms ease;
              ${i < pin.length ? 'transform:scale(1.2);' : ''}
            "></div>
          `).join('')}
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;max-width:280px;width:100%;">
          ${[1,2,3,4,5,6,7,8,9,'cancel',0,'del'].map(key => {
            if (key === 'cancel') return `<button class="pin-key" data-key="cancel" style="font-size:14px;color:rgba(255,255,255,0.6);">취소</button>`;
            if (key === 'del') return `<button class="pin-key" data-key="del" style="font-size:20px;">⌫</button>`;
            return `<button class="pin-key" data-key="${key}">${key}</button>`;
          }).join('')}
        </div>
      `;

      // Style keys
      container.querySelectorAll('.pin-key').forEach(btn => {
        btn.style.cssText = `
          width: 72px; height: 72px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          font-size: 24px; font-weight: 600;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 150ms ease;
          margin: 0 auto;
        `;
      });
    }

    function handleKey(key) {
      if (key === 'cancel') {
        destroy();
        if (onCancel) onCancel();
        return;
      }
      if (key === 'del') {
        pin = pin.slice(0, -1);
        render();
        return;
      }
      if (pin.length < length) {
        pin += key;
        Utils.vibrate(10);
        render();
        if (pin.length === length) {
          setTimeout(() => {
            destroy();
            if (onComplete) onComplete(pin);
          }, 200);
        }
      }
    }

    container.addEventListener('click', (e) => {
      const key = e.target.closest('[data-key]');
      if (key) handleKey(key.dataset.key);
    });

    function destroy() {
      backdrop.style.animation = 'fadeOut 200ms ease both';
      container.style.animation = 'fadeOut 200ms ease both';
      setTimeout(() => {
        backdrop.remove();
        container.remove();
      }, 200);
    }

    render();
    document.body.appendChild(backdrop);
    document.body.appendChild(container);

    return { destroy };
  }

  return { show };
})();
