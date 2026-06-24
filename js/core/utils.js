// ============================================
// LalaWord Utility Functions
// ============================================

const Utils = (() => {

  // === Date helpers ===
  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatDateKR(dateStr) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function relativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return formatDate(dateStr);
  }

  function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      days.push(addDays(new Date(), -i));
    }
    return days;
  }

  // === Level helpers ===
  const LEVELS = [
    { level: 1, name: '씨앗', emoji: '🌱', target: '유치원', color: 'green', words: 200, desc: '기초 단어 전부' },
    { level: 2, name: '새싹', emoji: '🌿', target: '초등 저학년', color: 'teal', words: 800, desc: '교과서 기초' },
    { level: 3, name: '나무', emoji: '🌳', target: '초등 고학년', color: 'sky', words: 1500, desc: '초등 심화' },
    { level: 4, name: '별', emoji: '⭐', target: '중학생', color: 'amber', words: 2500, desc: '중등 필수' },
    { level: 5, name: '로켓', emoji: '🚀', target: '고등학생', color: 'coral', words: 4000, desc: '수능 빈출' },
    { level: 6, name: '왕관', emoji: '👑', target: '고급/성인', color: 'rose', words: 6000, desc: '전문 어휘' },
  ];

  function getLevelInfo(level) {
    return LEVELS.find(l => l.level === level) || LEVELS[2];
  }

  function getLevelColor(level) {
    return `var(--color-level-${level})`;
  }

  // === String helpers ===
  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '…' : str;
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // === Array helpers ===
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      const k = typeof key === 'function' ? key(item) : item[key];
      (acc[k] = acc[k] || []).push(item);
      return acc;
    }, {});
  }

  // === Number helpers ===
  function formatNumber(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  }

  function percentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  // === Image helpers ===
  function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > maxWidth) {
            h = (h * maxWidth) / w;
            w = maxWidth;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const base64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
          resolve(base64);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function dataURLtoBase64(dataUrl) {
    return dataUrl.split(',')[1];
  }

  // === String helpers ===
  function truncate(str, maxLen = 50) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  // === Array helpers ===
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function groupBy(arr, keyFn) {
    return arr.reduce((groups, item) => {
      const key = typeof keyFn === 'string' ? item[keyFn] : keyFn(item);
      (groups[key] = groups[key] || []).push(item);
      return groups;
    }, {});
  }

  // === DOM helpers ===
  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.keys(attrs).forEach(key => {
      if (key === 'className') el.className = attrs[key];
      else if (key === 'innerHTML') el.innerHTML = attrs[key];
      else if (key === 'textContent') el.textContent = attrs[key];
      else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
      else if (key === 'style' && typeof attrs[key] === 'object') Object.assign(el.style, attrs[key]);
      else el.setAttribute(key, attrs[key]);
    });
    children.forEach(child => {
      if (typeof child === 'string') el.appendChild(document.createTextNode(child));
      else if (child) el.appendChild(child);
    });
    return el;
  }

  // === Debounce / Throttle ===
  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  function throttle(fn, ms) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn(...args);
      }
    };
  }

  // === Haptic feedback ===
  function vibrate(ms = 10) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  return {
    today, formatDate, formatDateKR, formatTime, relativeTime, addDays,
    getDaysInMonth, getFirstDayOfMonth, getLast7Days,
    LEVELS, getLevelInfo, getLevelColor,
    truncate, capitalize, escapeHTML,
    shuffle, groupBy,
    formatNumber, percentage,
    compressImage, dataURLtoBase64,
    $, $$, createElement,
    debounce, throttle, vibrate,
  };
})();
