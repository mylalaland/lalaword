// ============================================
// LalaWord Global State Store (Pub/Sub)
// ============================================

const Store = (() => {
  const state = {
    user: null,
    isLoggedIn: false,
    apiKey: '',
    geminiModel: 'gemini-2.0-flash',
    level: 3,             // 1-6
    levelLocked: false,
    translationMode: 'natural', // 'literal' | 'natural'
    showGrammar: true,
    dailyGoal: 10,
    parentPIN: null,
    currentScan: null,
    streak: 0,
    todayStats: { wordsLearned: 0, wordsReviewed: 0, scanCount: 0, studyMinutes: 0 },
    // Quiz defaults
    quizDefaultCount: 10,
    quizShowHint: true,
    // Scan defaults
    defaultExtractAll: false,
  };

  const listeners = {};

  function get(key) {
    return key ? state[key] : { ...state };
  }

  function set(key, value) {
    const old = state[key];
    state[key] = value;
    emit(key, value, old);
  }

  function update(partial) {
    Object.keys(partial).forEach(key => {
      const old = state[key];
      state[key] = partial[key];
      emit(key, partial[key], old);
    });
  }

  function on(key, callback) {
    if (!listeners[key]) listeners[key] = [];
    listeners[key].push(callback);
    return () => off(key, callback);
  }

  function off(key, callback) {
    if (!listeners[key]) return;
    listeners[key] = listeners[key].filter(cb => cb !== callback);
  }

  function emit(key, value, old) {
    if (!listeners[key]) return;
    listeners[key].forEach(cb => {
      try { cb(value, old); } catch (e) { console.error('Store listener error:', e); }
    });
  }

  // Load persisted settings from localStorage (fast) and IndexedDB (later)
  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('lalaword_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach(key => {
          if (key in state) state[key] = parsed[key];
        });
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  function saveToStorage() {
    try {
      const toSave = {
        apiKey: state.apiKey,
        geminiModel: state.geminiModel,
        level: state.level,
        levelLocked: state.levelLocked,
        translationMode: state.translationMode,
        showGrammar: state.showGrammar,
        dailyGoal: state.dailyGoal,
        parentPIN: state.parentPIN,
        streak: state.streak,
        quizDefaultCount: state.quizDefaultCount,
        quizShowHint: state.quizShowHint,
        defaultExtractAll: state.defaultExtractAll,
      };
      localStorage.setItem('lalaword_settings', JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  // Auto-save on any state change
  ['apiKey', 'geminiModel', 'level', 'levelLocked', 'translationMode', 'showGrammar', 'dailyGoal', 'parentPIN', 'streak', 'quizDefaultCount', 'quizShowHint', 'defaultExtractAll'].forEach(key => {
    on(key, () => saveToStorage());
  });

  loadFromStorage();

  return { get, set, update, on, off };
})();
