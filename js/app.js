// ============================================
// LalaWord App Initialization
// ============================================

const App = (() => {

  async function init() {
    console.log('🚀 LalaWord starting...');

    // 1. Initialize Database
    DB.init();

    // 2. Initialize Speech
    if (SpeechService.isSupported()) {
      SpeechService.init();
    }

    // 3. Initialize Toast
    Toast.init();

    // 4. Register routes
    Router.register('/home', () => HomePage.render());
    Router.register('/camera', () => CameraPage.render());
    Router.register('/scan-result', (params) => ScanResultPage.render(params));
    Router.register('/vocabulary', () => VocabularyPage.render());
    Router.register('/flashcard', () => FlashcardPage.render());
    Router.register('/quiz', () => QuizPage.render());
    Router.register('/records', () => RecordsPage.render());
    Router.register('/settings', () => SettingsPage.render());
    Router.register('/parent-settings', () => ParentSettingsPage.render());

    // 5. Tab bar click handlers
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        const path = tab.dataset.path;
        if (path) Router.navigate(path);
      });
    });

    // 6. Start router
    Router.init();

    // 7. Check if first launch
    const apiKey = Store.get('apiKey');
    if (!apiKey && Router.getCurrentPath() === '/home') {
      // Show welcome hint after a short delay
      setTimeout(() => {
        Toast.info('영어 책을 스캔하려면 먼저 설정에서 API Key를 등록해주세요 🔑');
      }, 1500);
    }

    console.log('✅ LalaWord ready!');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
