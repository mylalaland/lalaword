// ============================================
// LalaWord SPA Hash Router
// ============================================

const Router = (() => {
  const routes = {};
  let currentRoute = null;
  let beforeNavigateHook = null;

  function register(path, handler) {
    routes[path] = handler;
  }

  function navigate(path, params = {}) {
    if (beforeNavigateHook && !beforeNavigateHook(path)) return;
    const hash = params && Object.keys(params).length
      ? `${path}?${new URLSearchParams(params).toString()}`
      : path;
    window.location.hash = hash;
  }

  function getParams() {
    const hash = window.location.hash.slice(1);
    const qIndex = hash.indexOf('?');
    if (qIndex === -1) return {};
    return Object.fromEntries(new URLSearchParams(hash.slice(qIndex + 1)));
  }

  function getCurrentPath() {
    const hash = window.location.hash.slice(1) || '/home';
    const qIndex = hash.indexOf('?');
    return qIndex === -1 ? hash : hash.slice(0, qIndex);
  }

  function back() {
    window.history.back();
  }

  function onBeforeNavigate(hook) {
    beforeNavigateHook = hook;
  }

  async function handleRoute() {
    const path = getCurrentPath();
    const handler = routes[path];

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
    });

  if (handler) {
      currentRoute = path;

      // Determine page element ID from path
      const pageId = 'page-' + path.slice(1); // /home -> page-home, /scan-result -> page-scan-result
      const pageEl = document.getElementById(pageId);

      // Call handler to render content
      await handler(getParams());

      // Show target page
      if (pageEl) {
        pageEl.classList.add('active');
        // Scroll to top
        pageEl.scrollTop = 0;
        const content = pageEl.querySelector('.page-content');
        if (content) content.scrollTop = 0;
      }

      // Update tab bar
      updateTabBar(path);
    }
  }

  function updateTabBar(path) {
    const tabItems = document.querySelectorAll('.tab-item');
    tabItems.forEach(tab => {
      const tabPath = tab.dataset.path;
      tab.classList.toggle('active', tabPath === path);
    });

    // Show/hide tab bar on certain pages
    const tabBar = document.querySelector('.tab-bar');
    const headerEl = document.querySelector('.app-header');
    const hideTabPages = ['/splash', '/login', '/onboarding', '/api-setup', '/camera', '/flashcard', '/quiz'];
    const hideHeaderPages = ['/splash', '/login', '/camera'];

    if (tabBar) {
      tabBar.style.display = hideTabPages.includes(path) ? 'none' : 'flex';
    }
    if (headerEl) {
      headerEl.style.display = hideHeaderPages.includes(path) ? 'none' : 'flex';
    }
  }

  function init() {
    window.addEventListener('hashchange', handleRoute);
    if (!window.location.hash) {
      window.location.hash = '/home';
    } else {
      handleRoute();
    }
  }

  return { register, navigate, back, getParams, getCurrentPath, onBeforeNavigate, init };
})();
