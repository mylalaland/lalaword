// ============================================
// LalaWord Scan Result Page
// ============================================

const ScanResultPage = (() => {
  let currentTab = 'words';
  let extractMode = 'level'; // 'level' or 'all'

  async function render(params = {}) {
    const page = document.getElementById('page-scan-result');
    if (!page) return;

    let scanData = Store.get('currentScan');

    if (params.id && (!scanData || scanData.id != params.id)) {
      const scan = await DB.getScanById(Number(params.id));
      if (scan) {
        const allWords = await DB.getAllWords();
        scanData = {
          id: scan.id,
          text: scan.extractedText,
          paragraphs: scan.paragraphs || [],
          words: allWords.filter(w => w.scanId === scan.id),
          bookTitle: scan.bookTitle,
        };
        Store.set('currentScan', scanData);
      }
    }

    if (!scanData) {
      page.querySelector('.page-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">스캔 결과가 없어요</div>
          <button class="btn btn-primary mt-md" onclick="Router.navigate('/camera')">스캔하러 가기</button>
        </div>
      `;
      return;
    }

    const header = document.querySelector('.app-header');
    if (header) {
      header.innerHTML = `
        <button class="header-left" onclick="Router.navigate('/home')">←</button>
        <div class="header-title">스캔 결과</div>
        <div class="header-right"></div>
      `;
    }

    const words = scanData.words || [];

    page.querySelector('.page-content').innerHTML = `
      <!-- Summary -->
      <div class="card-highlight mb-md anim-slide-up">
        <div class="flex-between">
          <div>
            <div style="font-size:16px;font-weight:700;">
              ${words.length}개 단어를 찾았어요! 🎉
            </div>
            <div style="font-size:13px;color:var(--color-text-muted);margin-top:4px;">
              ${scanData.paragraphs?.length || 0}개 문단에서 추출
              ${extractMode === 'all' ? '(전체 모드)' : `(Lv.${Store.get('level')} 기준)`}
            </div>
          </div>
        </div>
        <!-- Extract mode toggle -->
        <div style="display:flex;gap:8px;margin-top:12px;">
          <button class="chip ${extractMode === 'level' ? 'selected' : ''}"
            onclick="ScanResultPage.setExtractMode('level')" style="flex:1;justify-content:center;">
            🎯 수준별 추출
          </button>
          <button class="chip ${extractMode === 'all' ? 'selected' : ''}"
            onclick="ScanResultPage.setExtractMode('all')" style="flex:1;justify-content:center;">
            📋 전체 단어 추출
          </button>
        </div>
      </div>

      <!-- Bulk actions -->
      <div class="card mb-md" style="padding:10px 12px;">
        <div style="display:flex;gap:8px;align-items:center;">
          <button class="btn btn-primary btn-sm" onclick="ScanResultPage.saveToVocab()" style="flex:1;">
            📚 단어장에 전체 저장
          </button>
          <button class="btn btn-outline btn-sm" onclick="ScanResultPage.saveToList()" style="flex:1;">
            📁 리스트에 저장
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex-row gap-xs mb-md">
        <button class="chip ${currentTab === 'words' ? 'selected' : ''}" onclick="ScanResultPage.switchTab('words')">
          📖 단어 (${words.length})
        </button>
        <button class="chip ${currentTab === 'text' ? 'selected' : ''}" onclick="ScanResultPage.switchTab('text')">
          📄 원문
        </button>
        <button class="chip ${currentTab === 'translate' ? 'selected' : ''}" onclick="ScanResultPage.switchTab('translate')">
          🔄 해석
        </button>
      </div>

      <!-- Tab content -->
      <div id="scan-tab-content">
        ${currentTab === 'words' ? renderWordsTab(words) : currentTab === 'text' ? renderTextTab(scanData) : renderTranslateTab(scanData)}
      </div>
    `;
  }

  function renderWordsTab(words) {
    if (words.length === 0) {
      return `
        <div class="empty-state" style="padding:24px;">
          <div class="empty-icon">📝</div>
          <div class="empty-title">단어가 없어요</div>
          <div class="empty-desc">위에서 '전체 단어 추출'을 눌러보세요</div>
        </div>
      `;
    }

    return `<div class="stagger">${words.map((w, i) => `
      <div class="card mb-xs anim-slide-up" style="animation-delay:${Math.min(i * 30, 300)}ms;">
        <div class="flex-between mb-xs">
          <div class="flex-row gap-sm">
            <span class="word-display" style="font-size:18px;">${w.word}</span>
            <span class="word-pos">${w.pos || ''}</span>
          </div>
          <div class="flex-row gap-xs">
            <button class="btn-icon sm" onclick="SpeechService.speak('${w.word}')" title="발음 듣기">🔊</button>
            <button class="btn-icon sm" onclick="SpeechService.speakSlow('${w.word}')" title="천천히 듣기">🐢</button>
          </div>
        </div>
        ${w.pronunciation ? `<div class="word-pronunciation mb-xs">${w.pronunciation}</div>` : ''}
        <div class="word-meaning mb-xs">${w.meaning}</div>
        ${w.example ? `
          <div class="card-flat" style="font-size:13px;padding:10px 12px;">
            <div style="color:var(--color-text-secondary);margin-bottom:4px;">📌 ${w.example}</div>
            ${w.exampleMeaning ? `<div style="color:var(--color-text-muted);">→ ${w.exampleMeaning}</div>` : ''}
          </div>
        ` : ''}
        <div style="display:flex;gap:8px;margin-top:10px;">
          <span class="tag tag-${Utils.getLevelInfo(w.level || 3).color}">
            ${Utils.getLevelInfo(w.level || 3).emoji} Lv.${w.level || 3}
          </span>
        </div>
      </div>
    `).join('')}</div>`;
  }

  function renderTextTab(scanData) {
    return `
      <div class="card">
        <div style="font-family:var(--font-en);font-size:15px;line-height:1.9;color:var(--color-text-secondary);white-space:pre-wrap;">
          ${Utils.escapeHTML(scanData.text || '')}
        </div>
      </div>
    `;
  }

  function renderTranslateTab(scanData) {
    const paragraphs = scanData.paragraphs || [];
    if (paragraphs.length === 0) {
      return `<div class="card"><p style="color:var(--color-text-muted);">번역할 문단이 없어요.</p></div>`;
    }

    return `
      <div id="translation-content">
        <div style="text-align:center;padding:24px;">
          <button class="btn btn-secondary" onclick="ScanResultPage.translateAll()">
            🔄 전체 해석하기
          </button>
          <div style="font-size:12px;color:var(--color-text-muted);margin-top:8px;">
            Gemini API를 사용하여 해석합니다
          </div>
        </div>
        ${paragraphs.map((p, i) => `
          <div class="card mb-xs" id="para-${i}">
            <div style="font-family:var(--font-en);font-size:14px;color:var(--color-text-secondary);line-height:1.7;">
              ${Utils.escapeHTML(p)}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function switchTab(tab) {
    currentTab = tab;
    const scanData = Store.get('currentScan');
    if (!scanData) return;

    const content = document.getElementById('scan-tab-content');
    if (!content) return;

    document.querySelectorAll('#page-scan-result .chip').forEach((c, i) => {
      if (i > 1) c.classList.remove('selected'); // Skip extract mode chips
    });
    const tabChips = document.querySelectorAll('#page-scan-result .flex-row.gap-xs .chip');
    tabChips.forEach(c => c.classList.remove('selected'));
    const idx = ['words', 'text', 'translate'].indexOf(tab);
    if (tabChips[idx]) tabChips[idx].classList.add('selected');

    if (tab === 'words') content.innerHTML = renderWordsTab(scanData.words || []);
    else if (tab === 'text') content.innerHTML = renderTextTab(scanData);
    else content.innerHTML = renderTranslateTab(scanData);
  }

  async function setExtractMode(mode) {
    const scanData = Store.get('currentScan');
    if (!scanData?.text) return;

    extractMode = mode;

    if (mode === 'all') {
      Loading.show('📋 모든 단어를 추출하고 있어요...');
      try {
        const result = await GeminiAPI.analyzeWords(scanData.text, Store.get('level'), { extractAll: true });
        Loading.hide();
        if (result?.words) {
          // Deduplicate
          const seen = new Set();
          const unique = result.words.filter(w => {
            const key = w.word.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          scanData.words = unique;
          Store.set('currentScan', scanData);
          currentTab = 'words';
          render({ id: scanData.id });
          Toast.success(`${unique.length}개 단어를 모두 추출했어요!`);
        }
      } catch (err) {
        Loading.hide();
        Toast.error('단어 추출에 실패했어요. 다시 시도해주세요.');
      }
    } else {
      Loading.show('🎯 수준에 맞는 단어를 분석하고 있어요...');
      try {
        const result = await GeminiAPI.analyzeWords(scanData.text, Store.get('level'));
        Loading.hide();
        if (result?.words) {
          scanData.words = result.words;
          Store.set('currentScan', scanData);
          currentTab = 'words';
          render({ id: scanData.id });
          Toast.success(`${result.words.length}개 학습 단어를 찾았어요!`);
        }
      } catch (err) {
        Loading.hide();
        Toast.error('단어 분석에 실패했어요. 다시 시도해주세요.');
      }
    }
  }

  async function saveToVocab() {
    const scanData = Store.get('currentScan');
    if (!scanData?.words?.length) {
      Toast.warning('저장할 단어가 없어요');
      return;
    }

    const wordsToSave = scanData.words.map(w => ({
      word: w.word,
      meaning: w.meaning,
      pos: w.pos,
      pronunciation: w.pronunciation || '',
      level: w.level || Store.get('level'),
      example: w.example || '',
      exampleMeaning: w.exampleMeaning || '',
      scanId: scanData.id,
    }));

    const newCount = await DB.addWords(wordsToSave);
    await DB.updateTodayStats({ wordsLearned: newCount });
    Toast.success(`${newCount}개 단어가 단어장에 저장되었어요! 📚 (중복 ${scanData.words.length - newCount}개 제외)`);
  }

  async function saveToList() {
    const scanData = Store.get('currentScan');
    if (!scanData?.words?.length) {
      Toast.warning('저장할 단어가 없어요');
      return;
    }

    const lists = await DB.getWordLists();

    const content = document.createElement('div');
    content.innerHTML = `
      <!-- Existing lists -->
      ${lists.length > 0 ? lists.map(l => `
        <div class="list-item" style="cursor:pointer;border-radius:8px;margin-bottom:4px;"
          onclick="ScanResultPage.doSaveToList(${l.id}, '${Utils.escapeHTML(l.name)}')">
          <div class="list-icon" style="background:var(--color-teal-light);">${l.icon || '📁'}</div>
          <div class="list-content">
            <div class="list-title">${l.name}</div>
          </div>
          <div class="list-right">→</div>
        </div>
      `).join('') : ''}
      <!-- New list -->
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--color-border-light);">
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">📁 새 리스트 만들기</div>
        <div style="display:flex;gap:8px;">
          <input id="new-list-name" class="input-field" placeholder="리스트 이름 (예: Harry Potter)" style="flex:1;">
          <button class="btn btn-primary btn-sm" onclick="ScanResultPage.createAndSaveToList()">만들기</button>
        </div>
      </div>
    `;

    Modal.show({
      title: '📁 단어장 리스트에 저장',
      content,
    });
  }

  async function doSaveToList(listId, listName) {
    Modal.close();
    const scanData = Store.get('currentScan');
    if (!scanData?.words?.length) return;

    const wordsToSave = scanData.words.map(w => ({
      word: w.word,
      meaning: w.meaning,
      pos: w.pos,
      pronunciation: w.pronunciation || '',
      level: w.level || Store.get('level'),
      example: w.example || '',
      exampleMeaning: w.exampleMeaning || '',
      scanId: scanData.id,
      listId: listId,
    }));

    const newCount = await DB.addWords(wordsToSave);
    await DB.updateTodayStats({ wordsLearned: newCount });
    Toast.success(`${newCount}개 단어가 '${listName}'에 저장되었어요! 📁`);
  }

  async function createAndSaveToList() {
    const nameInput = document.getElementById('new-list-name');
    const name = nameInput?.value?.trim();
    if (!name) {
      Toast.warning('리스트 이름을 입력해주세요');
      return;
    }

    const listId = await DB.addWordList(name);
    await doSaveToList(listId, name);
  }

  async function translateAll() {
    const scanData = Store.get('currentScan');
    if (!scanData?.paragraphs?.length) return;

    Loading.show('🔄 문장을 해석하고 있어요...');

    try {
      const mode = Store.get('translationMode');
      const result = await GeminiAPI.translateSentences(scanData.paragraphs, mode);

      Loading.hide();

      if (result?.translations) {
        const container = document.getElementById('translation-content');
        if (container) {
          container.innerHTML = result.translations.map((t, i) => `
            <div class="card mb-xs anim-slide-up" style="animation-delay:${i * 40}ms;">
              <div style="font-family:var(--font-en);font-size:14px;color:var(--color-text-secondary);line-height:1.7;margin-bottom:8px;">
                ${Utils.escapeHTML(t.original)}
              </div>
              <div class="divider"></div>
              <div style="font-size:14px;color:var(--color-text-primary);line-height:1.7;">
                ${Utils.escapeHTML(t.translation)}
              </div>
              ${t.grammarPoints?.length ? `
                <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;">
                  ${t.grammarPoints.map(g => `<span class="tag tag-sky">${g}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          `).join('');
        }
      }
    } catch (err) {
      Loading.hide();
      Toast.error('해석에 실패했어요. 다시 시도해주세요.');
    }
  }

  return { render, switchTab, setExtractMode, saveToVocab, saveToList, doSaveToList, createAndSaveToList, translateAll };
})();
