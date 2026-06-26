// ============================================
// LalaWord Settings Page (Tabbed)
// ============================================

const SettingsPage = (() => {
  let activeTab = 'general'; // 'general' | 'learning' | 'quiz' | 'data'

  async function render() {
    const page = document.getElementById('page-settings');
    if (!page) return;

    const header = document.querySelector('.app-header');
    if (header) {
      header.innerHTML = `
        <div class="header-left"></div>
        <div class="header-title">설정</div>
        <div class="header-right"></div>
      `;
    }

    const level = Store.get('level');
    const levelInfo = Utils.getLevelInfo(level);
    const apiKey = Store.get('apiKey');

    page.querySelector('.page-content').innerHTML = `
      <!-- Profile area -->
      <div class="flex-row gap-md mb-md" style="padding:8px 0;">
        <div class="avatar lg" style="background:var(--color-coral-light);">
          ${levelInfo.emoji}
        </div>
        <div>
          <div style="font-size:18px;font-weight:700;">LalaWord 학습자</div>
          <div class="tag tag-${levelInfo.color}" style="margin-top:4px;">
            ${levelInfo.emoji} ${levelInfo.name} (${levelInfo.target})
          </div>
        </div>
      </div>

      <!-- Settings Tabs -->
      <div style="display:flex;gap:4px;margin-bottom:16px;overflow-x:auto;-webkit-overflow-scrolling:touch;">
        ${['general', 'learning', 'quiz', 'data'].map(tab => {
          const labels = { general: '⚙️ 일반', learning: '📚 학습', quiz: '📝 퀴즈', data: '💾 데이터' };
          return `<button class="chip ${activeTab === tab ? 'selected' : ''}" onclick="SettingsPage.switchTab('${tab}')" style="flex:1;justify-content:center;white-space:nowrap;">${labels[tab]}</button>`;
        }).join('')}
      </div>

      <!-- Tab content -->
      <div id="settings-tab-content">
        ${activeTab === 'general' ? renderGeneralTab(apiKey, levelInfo, level)
          : activeTab === 'learning' ? renderLearningTab()
          : activeTab === 'quiz' ? renderQuizTab()
          : renderDataTab()}
      </div>
    `;
  }

  function renderGeneralTab(apiKey, levelInfo, level) {
    const hasParentPIN = !!Store.get('parentPIN');
    return `
      <!-- API Key -->
      <div class="section-title mb-sm">🔑 API 설정</div>
      <div class="card mb-lg">
        <div class="list-item" style="padding:12px 0;">
          <div class="list-content">
            <div class="list-title">Gemini API Key</div>
            <div class="list-desc">${apiKey ? '✅ 등록됨 (' + apiKey.slice(0, 8) + '...)' : '❌ 미등록'}</div>
          </div>
          <button class="btn btn-sm btn-outline" onclick="SettingsPage.showApiKeyInput()">
            ${apiKey ? '변경' : '등록'}
          </button>
        </div>
        <div style="font-size:12px;color:var(--color-text-hint);padding:4px 0;">
          Google AI Studio에서 무료 API Key를 발급받으세요
        </div>

        <!-- Model Selection -->
        ${apiKey ? `
        <div class="list-item" onclick="SettingsPage.showModelPicker()" style="margin-top:4px;padding:12px 0;">
          <div class="list-content">
            <div class="list-title">AI 모델</div>
            <div class="list-desc" style="font-family:var(--font-mono);font-size:11px;">
              ${Store.get('geminiModel') || 'gemini-2.0-flash'}
            </div>
          </div>
          <button class="btn btn-sm btn-outline">변경</button>
        </div>
        ` : ''}
      </div>

      <!-- Parent Settings -->
      <div class="section-title mb-sm">👨‍👩‍👧 부모 설정</div>
      <div class="card mb-lg" style="padding:0;">
        <div class="list-item" onclick="SettingsPage.openParentSettings()">
          <div class="list-icon" style="background:var(--color-rose-light);">🔐</div>
          <div class="list-content">
            <div class="list-title">부모 설정</div>
            <div class="list-desc">${hasParentPIN ? 'PIN 설정됨' : 'PIN 미설정'}</div>
          </div>
          <div class="list-right">→</div>
        </div>
      </div>

      <!-- App info -->
      <div style="text-align:center;padding:16px 0;font-size:12px;color:var(--color-text-hint);">
        LalaWord v1.1.0<br>
        Made with ❤️ for English learners
      </div>
    `;
  }

  function renderLearningTab() {
    const level = Store.get('level');
    const levelInfo = Utils.getLevelInfo(level);
    const translationMode = Store.get('translationMode');
    const dailyGoal = Store.get('dailyGoal');
    const levelLocked = Store.get('levelLocked');

    return `
      <div class="section-title mb-sm">🎯 학습 설정</div>
      <div class="card mb-lg" style="padding:0;">
        <!-- Level -->
        <div class="list-item" onclick="${levelLocked ? 'Toast.warning(\'부모님이 수준을 고정했어요\')' : 'SettingsPage.showLevelPicker()'}">
          <div class="list-icon" style="background:var(--color-${levelInfo.color}-light);">
            ${levelInfo.emoji}
          </div>
          <div class="list-content">
            <div class="list-title">영어 수준 ${levelLocked ? '🔒' : ''}</div>
            <div class="list-desc">Lv.${level} ${levelInfo.name} (${levelInfo.target})</div>
          </div>
          <div class="list-right">${levelLocked ? '🔒' : '→'}</div>
        </div>

        <!-- Daily goal -->
        <div class="list-item" onclick="SettingsPage.showDailyGoalPicker()">
          <div class="list-icon" style="background:var(--color-amber-light);">📎</div>
          <div class="list-content">
            <div class="list-title">일일 목표</div>
            <div class="list-desc">${dailyGoal}단어</div>
          </div>
          <div class="list-right">→</div>
        </div>

        <!-- Translation mode -->
        <div class="list-item" onclick="SettingsPage.toggleTranslation()">
          <div class="list-icon" style="background:var(--color-sky-light);">🔄</div>
          <div class="list-content">
            <div class="list-title">해석 모드</div>
            <div class="list-desc">${translationMode === 'natural' ? '의역 (자연스러운 한국어)' : '직역 (영어 어순 그대로)'}</div>
          </div>
          <div class="list-right">→</div>
        </div>
      </div>

      <!-- Extract mode default -->
      <div class="section-title mb-sm">📋 스캔 설정</div>
      <div class="card mb-lg" style="padding:0;">
        <div class="list-item" onclick="SettingsPage.toggleExtractMode()">
          <div class="list-icon" style="background:var(--color-teal-light);">📋</div>
          <div class="list-content">
            <div class="list-title">기본 추출 모드</div>
            <div class="list-desc">${Store.get('defaultExtractAll') ? '전체 단어 추출' : '수준별 단어 추출'}</div>
          </div>
          <div class="list-right">→</div>
        </div>
      </div>
    `;
  }

  function renderQuizTab() {
    const quizCount = Store.get('quizDefaultCount') || 10;
    const showHint = Store.get('quizShowHint') !== false;

    return `
      <div class="section-title mb-sm">📝 퀴즈 기본 설정</div>
      <div class="card mb-lg" style="padding:0;">
        <!-- Default question count -->
        <div class="list-item" onclick="SettingsPage.showQuizCountPicker()">
          <div class="list-icon" style="background:var(--color-coral-light);">📋</div>
          <div class="list-content">
            <div class="list-title">기본 문제 수</div>
            <div class="list-desc">${quizCount}문제</div>
          </div>
          <div class="list-right">→</div>
        </div>

        <!-- Hint -->
        <label class="list-item" style="cursor:pointer;">
          <div class="list-icon" style="background:var(--color-amber-light);">💡</div>
          <div class="list-content">
            <div class="list-title">힌트 표시</div>
            <div class="list-desc">빈칸 문제에서 첫 글자 힌트</div>
          </div>
          <label class="switch">
            <input type="checkbox" ${showHint ? 'checked' : ''}
              onchange="SettingsPage.toggleQuizHint()">
            <span class="slider"></span>
          </label>
        </label>
      </div>

      <div class="section-title mb-sm">🎯 문제 유형</div>
      <div class="card mb-lg" style="padding:12px;">
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:8px;">
          퀴즈 시작 시 매번 설정할 수 있어요
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="card-flat" style="text-align:center;padding:12px;">
            <div style="font-size:24px;">🔤</div>
            <div style="font-size:12px;font-weight:600;margin-top:4px;">뜻 고르기</div>
          </div>
          <div class="card-flat" style="text-align:center;padding:12px;">
            <div style="font-size:24px;">✏️</div>
            <div style="font-size:12px;font-weight:600;margin-top:4px;">단어 입력</div>
          </div>
          <div class="card-flat" style="text-align:center;padding:12px;">
            <div style="font-size:24px;">📝</div>
            <div style="font-size:12px;font-weight:600;margin-top:4px;">문장 빈칸</div>
          </div>
          <div class="card-flat" style="text-align:center;padding:12px;">
            <div style="font-size:24px;">🔄</div>
            <div style="font-size:12px;font-weight:600;margin-top:4px;">역방향</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderDataTab() {
    return `
      <div class="section-title mb-sm">💾 데이터 관리</div>
      <div class="card mb-lg" style="padding:0;">
        <div class="list-item" onclick="SettingsPage.exportData()">
          <div class="list-icon" style="background:var(--color-teal-light);">📤</div>
          <div class="list-content">
            <div class="list-title">데이터 내보내기</div>
            <div class="list-desc">학습 데이터를 JSON 파일로 저장</div>
          </div>
          <div class="list-right">→</div>
        </div>

        <div class="list-item" onclick="SettingsPage.importData()">
          <div class="list-icon" style="background:var(--color-teal-light);">📥</div>
          <div class="list-content">
            <div class="list-title">데이터 가져오기</div>
            <div class="list-desc">저장된 JSON 파일에서 복원</div>
          </div>
          <div class="list-right">→</div>
        </div>

        <div class="list-item" onclick="SettingsPage.clearData()">
          <div class="list-icon" style="background:var(--color-rose-light);">🗑️</div>
          <div class="list-content">
            <div class="list-title" style="color:var(--color-rose);">전체 데이터 삭제</div>
            <div class="list-desc">모든 학습 기록을 삭제합니다</div>
          </div>
          <div class="list-right">→</div>
        </div>
      </div>
    `;
  }

  function switchTab(tab) {
    activeTab = tab;
    render();
  }

  // === API Key ===
  function showApiKeyInput() {
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="input-group">
        <label class="input-label">Gemini API Key</label>
        <input id="api-key-input" class="input-field" type="password"
          placeholder="API Key를 붙여넣으세요" value="${Store.get('apiKey') || ''}"
          style="font-family:var(--font-mono);font-size:13px;">
        <div class="input-hint">
          <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--color-coral);text-decoration:underline;">
            Google AI Studio에서 무료 발급 →
          </a>
        </div>
      </div>
    `;

    Modal.show({
      title: '🔑 API Key 설정',
      content,
      actions: [
        { id: 'cancel', label: '취소' },
        {
          id: 'save', label: '저장', primary: true,
          onClick: async () => {
            const key = document.getElementById('api-key-input').value.trim();
            if (!key) { Toast.warning('API Key를 입력해주세요'); return; }
            if (key.length < 10) { Toast.error('API Key가 너무 짧아요'); return; }

            Loading.show('API Key 확인 중...');
            const valid = await GeminiAPI.testApiKey(key);
            Loading.hide();

            if (valid) {
              Store.set('apiKey', key);
              Toast.success('API Key가 등록되었어요! 🎉');
              render();
            } else {
              Toast.error('API Key가 유효하지 않아요. 다시 확인해주세요');
            }
          },
          autoClose: false,
        },
      ],
    });
  }

  // === Level Picker ===
  function showLevelPicker() {
    const content = document.createElement('div');
    const currentLevel = Store.get('level');

    content.innerHTML = Utils.LEVELS.map(l => `
      <div class="list-item" style="cursor:pointer;border-radius:10px;margin-bottom:4px;
        ${l.level === currentLevel ? 'background:var(--color-coral-50);border:1px solid var(--color-coral-100);' : ''}"
        onclick="Store.set('level',${l.level});Modal.close();SettingsPage.render();Toast.success('수준이 변경되었어요');">
        <div style="font-size:28px;width:40px;text-align:center;">${l.emoji}</div>
        <div class="list-content">
          <div class="list-title">Lv.${l.level} ${l.name}</div>
          <div class="list-desc">${l.target} · ${l.desc}</div>
        </div>
        ${l.level === currentLevel ? '<div style="color:var(--color-coral);">✓</div>' : ''}
      </div>
    `).join('');

    Modal.show({ title: '📚 영어 수준 선택', content });
  }

  // === Daily Goal ===
  function showDailyGoalPicker() {
    const goals = [5, 10, 15, 20, 30, 50];
    const current = Store.get('dailyGoal');

    const content = document.createElement('div');
    content.innerHTML = `
      <div class="chip-group" style="justify-content:center;">
        ${goals.map(g => `
          <button class="chip ${g === current ? 'selected' : ''}"
            onclick="Store.set('dailyGoal',${g});Modal.close();SettingsPage.render();Toast.success('목표가 변경되었어요');"
            style="min-width:64px;justify-content:center;">${g}단어</button>
        `).join('')}
      </div>
    `;

    Modal.show({ title: '📎 일일 목표 설정', content });
  }

  // === Quiz Count ===
  function showQuizCountPicker() {
    const counts = [5, 10, 15, 20, 30, 50];
    const current = Store.get('quizDefaultCount') || 10;

    const content = document.createElement('div');
    content.innerHTML = `
      <div class="chip-group" style="justify-content:center;">
        ${counts.map(c => `
          <button class="chip ${c === current ? 'selected' : ''}"
            onclick="Store.set('quizDefaultCount',${c});Modal.close();SettingsPage.render();Toast.success('기본 문제 수가 변경되었어요');"
            style="min-width:64px;justify-content:center;">${c}문제</button>
        `).join('')}
      </div>
    `;

    Modal.show({ title: '📋 기본 문제 수', content });
  }

  function toggleTranslation() {
    const current = Store.get('translationMode');
    Store.set('translationMode', current === 'natural' ? 'literal' : 'natural');
    Toast.info(`해석 모드: ${Store.get('translationMode') === 'natural' ? '의역' : '직역'}`);
    render();
  }

  function toggleExtractMode() {
    const current = Store.get('defaultExtractAll');
    Store.set('defaultExtractAll', !current);
    Toast.info(`기본 추출: ${!current ? '전체 단어' : '수준별'}`);
    render();
  }

  function toggleQuizHint() {
    const current = Store.get('quizShowHint') !== false;
    Store.set('quizShowHint', !current);
  }

  function openParentSettings() {
    const pin = Store.get('parentPIN');
    if (pin) {
      PinInput.show({
        title: '부모 인증',
        subtitle: 'PIN 4자리를 입력해주세요',
        onComplete: (entered) => {
          if (entered === pin) {
            Router.navigate('/parent-settings');
          } else {
            Toast.error('PIN이 일치하지 않아요');
          }
        },
      });
    } else {
      Router.navigate('/parent-settings');
    }
  }

  async function exportData() {
    try {
      Loading.show('데이터 준비 중...');
      const data = await DB.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lalaword_backup_${Utils.today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      Loading.hide();
      Toast.success('데이터가 내보내졌어요! 📤');
    } catch (e) {
      Loading.hide();
      Toast.error('내보내기에 실패했어요');
    }
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        Loading.show('데이터 복원 중...');
        const text = await file.text();
        const data = JSON.parse(text);
        await DB.importAll(data);
        Loading.hide();
        Toast.success('데이터가 복원되었어요! 📥');
        render();
      } catch (e) {
        Loading.hide();
        Toast.error('파일 형식이 올바르지 않아요');
      }
    };
    input.click();
  }

  async function clearData() {
    const confirmed = await Modal.confirm({
      title: '⚠️ 전체 데이터 삭제',
      message: '모든 학습 기록, 단어장, 퀴즈 결과가 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      danger: true,
    });

    if (confirmed) {
      await DB.clearAll();
      Toast.success('모든 데이터가 삭제되었어요');
      render();
    }
  }

  async function showModelPicker() {
    const apiKey = Store.get('apiKey');
    if (!apiKey) { Toast.warning('먼저 API Key를 등록해주세요'); return; }

    Loading.show('모델 목록을 가져오는 중...');
    const models = await GeminiAPI.listModels(apiKey);
    Loading.hide();

    if (models.length === 0) {
      Toast.error('모델 목록을 가져올 수 없어요. API Key를 확인해주세요');
      return;
    }

    const currentModel = Store.get('geminiModel') || 'gemini-2.0-flash';

    const content = document.createElement('div');
    content.innerHTML = `
      <input class="input-field mb-sm" placeholder="🔍 모델 검색..." id="model-search"
        oninput="SettingsPage.filterModels(this.value)"
        style="margin-bottom:12px;">
      <div style="font-size:11px;color:var(--text-tertiary);margin-bottom:8px;padding:0 4px;">
        ⭐ 추천 모델은 안정적으로 작동이 확인된 모델이에요. 클릭하면 테스트 후 변경돼요.
      </div>
      <div id="model-list-container" style="max-height:360px;overflow-y:auto;">
        ${models.map(m => `
          <div class="model-item list-item" data-id="${m.id}" data-name="${m.name.toLowerCase()}"
            onclick="SettingsPage.selectModel('${m.id}')"
            style="cursor:pointer;border-radius:10px;margin-bottom:4px;padding:10px 8px;
              ${m.id === currentModel ? 'background:var(--color-coral-50);border:1.5px solid var(--color-coral-100);' : ''}">
            <div class="list-content" style="min-width:0;">
              <div class="list-title" style="font-size:13px;font-family:var(--font-mono);word-break:break-all;">
                ${m.id}
                ${m.recommended ? '<span style="display:inline-block;background:var(--color-coral);color:#fff;font-size:10px;padding:1px 6px;border-radius:8px;margin-left:6px;font-family:var(--font-primary);vertical-align:middle;">⭐ 추천</span>' : ''}
              </div>
              <div class="list-desc" style="font-size:11px;">${m.name}</div>
            </div>
            ${m.id === currentModel ? '<div style="color:var(--color-coral);font-weight:700;">✓</div>' : ''}
          </div>
        `).join('')}
      </div>
    `;

    Modal.show({ title: '🤖 AI 모델 선택', content });
    window._geminiModels = models;
  }

  function filterModels(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.model-item').forEach(item => {
      const name = item.dataset.name || '';
      const id = item.dataset.id || '';
      item.style.display = (name.includes(q) || id.includes(q)) ? '' : 'none';
    });
  }

  async function selectModel(modelId) {
    const apiKey = Store.get('apiKey');
    const currentModel = Store.get('geminiModel') || 'gemini-2.0-flash';
    if (modelId === currentModel) {
      Modal.close();
      return;
    }

    // Visually mark the clicked item
    document.querySelectorAll('.model-item').forEach(item => {
      if (item.dataset.id === modelId) {
        item.style.opacity = '0.6';
        item.style.pointerEvents = 'none';
      }
    });

    Loading.show(`${modelId} 테스트 중...`);
    const result = await GeminiAPI.testModel(apiKey, modelId);
    Loading.hide();

    if (result.ok) {
      Store.set('geminiModel', modelId);
      Modal.close();
      Toast.success(`모델 변경 완료! → ${modelId} ✅`);
      render();
    } else {
      // Restore item
      document.querySelectorAll('.model-item').forEach(item => {
        if (item.dataset.id === modelId) {
          item.style.opacity = '1';
          item.style.pointerEvents = '';
        }
      });

      let reason = '알 수 없는 오류';
      if (result.status === 404) reason = '이 모델은 존재하지 않아요';
      else if (result.status === 400) reason = '이 모델은 현재 요청을 지원하지 않아요';
      else if (result.status === 403) reason = '이 모델에 대한 접근 권한이 없어요';
      else if (result.status === 429) reason = '요청 한도 초과 — 잠시 후 다시 시도해주세요';
      else if (result.status === 503) reason = '모델이 일시적으로 사용 불가해요';

      Toast.error(`${modelId} 사용 불가 ❌ — ${reason}`);
    }
  }

  return {
    render, switchTab,
    showApiKeyInput, showLevelPicker, showDailyGoalPicker, showQuizCountPicker,
    showModelPicker, filterModels, selectModel,
    toggleTranslation, toggleExtractMode, toggleQuizHint,
    openParentSettings, exportData, importData, clearData,
  };
})();
