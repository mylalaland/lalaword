// ============================================
// LalaWord Vocabulary Page
// ============================================

const VocabularyPage = (() => {
  let currentFilter = 'all'; // 'all' | 'favorites' | 'unmastered' | 'half' | 'mastered' | 'list-N'
  let currentSort = 'newest';
  let searchQuery = '';
  let showListManager = false;

  const MASTERY = {
    0: { label: '미암기', emoji: '📝', color: 'var(--color-text-muted)', bg: 'var(--color-bg)' },
    1: { label: '반암기', emoji: '🔶', color: 'var(--color-amber)', bg: 'var(--color-amber-light)' },
    2: { label: '완전암기', emoji: '✅', color: 'var(--color-green)', bg: 'var(--color-green-light)' },
  };

  async function render() {
    const page = document.getElementById('page-vocabulary');
    if (!page) return;

    const header = document.querySelector('.app-header');
    if (header) {
      header.innerHTML = `
        <div class="header-left"></div>
        <div class="header-title">단어장</div>
        <button class="header-right" onclick="VocabularyPage.toggleListManager()" title="리스트 관리">📁</button>
      `;
    }

    const words = await getFilteredWords();
    const lists = await DB.getWordLists();
    const totalCount = await DB.getWordCount();

    page.querySelector('.page-content').innerHTML = `
      <!-- Search -->
      <div class="card mb-sm" style="padding:10px 12px;">
        <input class="input-field" placeholder="🔍 단어 검색..." value="${searchQuery}"
          oninput="VocabularyPage.onSearch(this.value)" style="border:none;background:transparent;padding:4px 0;">
      </div>

      <!-- Filters -->
      <div style="overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch;">
        <div class="chip-group" style="flex-wrap:nowrap;min-width:max-content;">
          <button class="chip ${currentFilter === 'all' ? 'selected' : ''}" onclick="VocabularyPage.setFilter('all')">
            전체 (${totalCount})
          </button>
          <button class="chip ${currentFilter === 'favorites' ? 'selected' : ''}" onclick="VocabularyPage.setFilter('favorites')">
            ⭐ 즐겨찾기
          </button>
          <button class="chip ${currentFilter === 'unmastered' ? 'selected' : ''}" onclick="VocabularyPage.setFilter('unmastered')">
            📝 미암기
          </button>
          <button class="chip ${currentFilter === 'half' ? 'selected' : ''}" onclick="VocabularyPage.setFilter('half')">
            🔶 반암기
          </button>
          <button class="chip ${currentFilter === 'mastered' ? 'selected' : ''}" onclick="VocabularyPage.setFilter('mastered')">
            ✅ 완전암기
          </button>
          ${lists.map(l => `
            <button class="chip ${currentFilter === 'list-' + l.id ? 'selected' : ''}"
              onclick="VocabularyPage.setFilter('list-${l.id}')">
              ${l.icon || '📁'} ${l.name}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Word count & sort -->
      <div class="flex-between mb-sm" style="margin-top:8px;">
        <span style="font-size:13px;color:var(--color-text-muted);">${words.length}개 단어</span>
        <button class="btn btn-ghost btn-sm" onclick="VocabularyPage.toggleSort()"
          style="font-size:13px;font-weight:600;">
          ${currentSort === 'newest' ? '최신순' : currentSort === 'alpha' ? 'ABC순' : '레벨순'}
        </button>
      </div>

      <!-- Action buttons -->
      ${words.length >= 2 ? `
        <div class="flex-row gap-xs mb-md">
          <button class="btn btn-outline btn-sm" onclick="Router.navigate('/flashcard')" style="flex:1;">
            🃏 플래시카드
          </button>
          <button class="btn btn-outline btn-sm" onclick="Router.navigate('/quiz')" style="flex:1;">
            📝 퀴즈
          </button>
        </div>
      ` : ''}

      <!-- List Manager Panel -->
      ${showListManager ? renderListManager(lists) : ''}

      <!-- Word list -->
      <div id="word-list-container">
        ${words.length === 0 ? `
          <div class="empty-state" style="padding:24px;">
            <div class="empty-icon">📖</div>
            <div class="empty-title">${searchQuery ? '검색 결과가 없어요' : '단어가 없어요'}</div>
            <div class="empty-desc">${searchQuery ? '다른 검색어로 시도해보세요' : '영어 책을 스캔하여 단어를 추가해보세요!'}</div>
          </div>
        ` : words.map((w, i) => renderWordCard(w, i)).join('')}
      </div>
    `;
  }

  function renderWordCard(w, i) {
    const m = MASTERY[w.mastered || 0];
    return `
      <div class="card mb-xs anim-slide-up" style="animation-delay:${Math.min(i * 20, 200)}ms;">
        <!-- Header row: word + actions -->
        <div class="flex-between">
          <div class="flex-row gap-sm">
            <span class="word-display" style="font-size:18px;">${w.word}</span>
            <span class="word-pos">${w.pos || ''}</span>
          </div>
          <div class="flex-row gap-xs">
            <button class="btn-icon sm" onclick="SpeechService.speak('${w.word}')" title="발음">🔊</button>
            <button class="btn-icon sm" onclick="VocabularyPage.toggleFav(${w.id})" style="font-size:18px;">
              ${w.favorite ? '⭐' : '☆'}
            </button>
          </div>
        </div>

        <!-- Pronunciation -->
        ${w.pronunciation ? `<div class="word-pronunciation" style="margin-top:2px;">${w.pronunciation}</div>` : ''}

        <!-- Meaning -->
        <div style="font-size:15px;color:var(--color-text-primary);margin-top:6px;font-weight:500;">${w.meaning}</div>

        <!-- Example sentence (from scan or generated) -->
        ${w.example ? `
          <div style="margin-top:8px;padding:10px 12px;background:var(--color-bg-warm);border-radius:10px;border-left:3px solid var(--color-coral);">
            <div style="font-family:var(--font-en);font-size:13px;color:var(--color-text-secondary);line-height:1.6;">
              📌 ${highlightWord(w.example, w.word)}
            </div>
            ${w.exampleMeaning ? `
              <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">
                → ${w.exampleMeaning}
              </div>
            ` : ''}
          </div>
        ` : ''}

        <!-- Bottom row: level + mastery toggle + actions -->
        <div class="flex-between" style="margin-top:10px;">
          <span class="tag tag-${Utils.getLevelInfo(w.level || 3).color}">
            ${Utils.getLevelInfo(w.level || 3).emoji} Lv.${w.level || 3}
          </span>

          <div class="flex-row gap-xs">
            <!-- 3-stage mastery toggle -->
            <button onclick="VocabularyPage.cycleMastery(${w.id})"
              style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;
                border-radius:999px;font-size:11px;font-weight:600;
                background:${m.bg};color:${m.color};border:1.5px solid ${m.color};
                transition:all 150ms ease;cursor:pointer;"
              title="클릭하여 암기 상태 변경">
              ${m.emoji} ${m.label}
            </button>

            <button class="btn btn-ghost btn-sm" onclick="VocabularyPage.moveToList(${w.id})" style="font-size:11px;padding:4px 8px;">
              📁
            </button>
            <button class="btn btn-ghost btn-sm" onclick="VocabularyPage.deleteWord(${w.id})" style="font-size:11px;color:var(--color-rose);padding:4px 6px;">
              🗑
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Highlight the target word in the example sentence
  function highlightWord(sentence, word) {
    if (!sentence || !word) return sentence || '';
    const escaped = Utils.escapeHTML(sentence);
    const regex = new RegExp(`\\b(${word}[a-z]*)\\b`, 'gi');
    return escaped.replace(regex, '<strong style="color:var(--color-coral);font-weight:700;">$1</strong>');
  }

  function renderListManager(lists) {
    return `
      <div class="card mb-md anim-slide-up" style="border:1.5px solid var(--color-teal-100);background:var(--color-teal-50);">
        <div class="flex-between mb-sm">
          <div class="section-title" style="font-size:14px;">📁 단어장 리스트 관리</div>
          <button class="btn-icon sm" onclick="VocabularyPage.toggleListManager()">✕</button>
        </div>
        ${lists.map(l => `
          <div class="flex-between" style="padding:8px 0;border-bottom:1px solid var(--color-border-light);">
            <div class="flex-row gap-sm">
              <span>${l.icon || '📁'}</span>
              <span style="font-weight:600;">${l.name}</span>
            </div>
            <div class="flex-row gap-xs">
              <button class="btn btn-ghost btn-sm" onclick="VocabularyPage.renameList(${l.id}, '${Utils.escapeHTML(l.name)}')" style="font-size:11px;padding:2px 6px;">✏️</button>
              <button class="btn btn-ghost btn-sm" onclick="VocabularyPage.removeList(${l.id}, '${Utils.escapeHTML(l.name)}')" style="font-size:11px;color:var(--color-rose);padding:2px 6px;">🗑</button>
            </div>
          </div>
        `).join('')}
        <div style="display:flex;gap:8px;margin-top:12px;">
          <input id="new-vocab-list" class="input-field" placeholder="새 리스트 이름" style="flex:1;min-height:38px;">
          <button class="btn btn-secondary btn-sm" onclick="VocabularyPage.createList()">추가</button>
        </div>
      </div>
    `;
  }

  async function getFilteredWords() {
    let words;
    if (currentFilter === 'favorites') {
      words = await DB.getFavoriteWords();
    } else if (currentFilter === 'unmastered') {
      words = await DB.getUnmasteredWords();
    } else if (currentFilter === 'half') {
      words = await DB.getHalfMasteredWords();
    } else if (currentFilter === 'mastered') {
      words = await DB.getFullyMasteredWords();
    } else if (currentFilter.startsWith('list-')) {
      const listId = Number(currentFilter.split('-')[1]);
      words = await DB.getWordsByList(listId);
    } else {
      words = await DB.getAllWords();
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      words = words.filter(w =>
        w.word.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q)
      );
    }

    if (currentSort === 'alpha') {
      words.sort((a, b) => a.word.localeCompare(b.word));
    } else if (currentSort === 'level') {
      words.sort((a, b) => (a.level || 3) - (b.level || 3));
    } else {
      words.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
    }

    return words;
  }

  function setFilter(filter) {
    currentFilter = filter;
    render();
  }

  function toggleSort() {
    const sorts = ['newest', 'alpha', 'level'];
    const idx = sorts.indexOf(currentSort);
    currentSort = sorts[(idx + 1) % sorts.length];
    render();
  }

  const onSearch = Utils.debounce((val) => {
    searchQuery = val;
    render();
  }, 300);

  async function toggleFav(id) {
    await DB.toggleFavorite(id);
    render();
  }

  async function cycleMastery(id) {
    const next = await DB.cycleMastery(id);
    const m = MASTERY[next];
    Toast.info(`${m.emoji} ${m.label}`);
    render();
  }

  function toggleListManager() {
    showListManager = !showListManager;
    render();
  }

  async function createList() {
    const input = document.getElementById('new-vocab-list');
    const name = input?.value?.trim();
    if (!name) { Toast.warning('리스트 이름을 입력해주세요'); return; }
    await DB.addWordList(name);
    Toast.success(`'${name}' 리스트가 생성되었어요!`);
    render();
  }

  async function renameList(id, currentName) {
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="input-group">
        <label class="input-label">리스트 이름</label>
        <input id="rename-list-input" class="input-field" value="${currentName}">
      </div>
    `;
    Modal.show({
      title: '✏️ 리스트 이름 변경', content,
      actions: [
        { id: 'cancel', label: '취소' },
        { id: 'save', label: '변경', primary: true,
          onClick: async () => {
            const newName = document.getElementById('rename-list-input').value.trim();
            if (!newName) return;
            await DB.updateWordList(id, { name: newName });
            Toast.success('이름이 변경되었어요');
            render();
          },
        },
      ],
    });
  }

  async function removeList(id, name) {
    const confirmed = await Modal.confirm({
      title: '📁 리스트 삭제',
      message: `'${name}' 리스트를 삭제합니다.\n리스트 안의 단어는 전체 단어장으로 이동합니다.`,
      confirmText: '삭제', cancelText: '취소', danger: true,
    });
    if (confirmed) {
      await DB.deleteWordList(id);
      if (currentFilter === 'list-' + id) currentFilter = 'all';
      Toast.success('리스트가 삭제되었어요');
      render();
    }
  }

  async function moveToList(wordId) {
    const lists = await DB.getWordLists();
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="list-item" style="cursor:pointer;border-radius:8px;margin-bottom:4px;"
        onclick="VocabularyPage.doMoveToList(${wordId}, null, '전체 단어장')">
        <div class="list-icon" style="background:var(--color-bg);">📖</div>
        <div class="list-content"><div class="list-title">전체 단어장 (리스트 없음)</div></div>
      </div>
      ${lists.map(l => `
        <div class="list-item" style="cursor:pointer;border-radius:8px;margin-bottom:4px;"
          onclick="VocabularyPage.doMoveToList(${wordId}, ${l.id}, '${Utils.escapeHTML(l.name)}')">
          <div class="list-icon" style="background:var(--color-teal-light);">${l.icon || '📁'}</div>
          <div class="list-content"><div class="list-title">${l.name}</div></div>
        </div>
      `).join('')}
    `;
    Modal.show({ title: '📁 리스트로 이동', content });
  }

  async function doMoveToList(wordId, listId, listName) {
    Modal.close();
    await DB.moveWordsToList([wordId], listId);
    Toast.success(`'${listName}'으로 이동했어요`);
    render();
  }

  async function deleteWord(id) {
    const confirmed = await Modal.confirm({
      title: '🗑 단어 삭제',
      message: '이 단어를 단어장에서 삭제할까요?',
      confirmText: '삭제', cancelText: '취소', danger: true,
    });
    if (confirmed) {
      await DB.deleteWord(id);
      Toast.success('단어가 삭제되었어요');
      render();
    }
  }

  return {
    render, setFilter, toggleSort, onSearch, toggleFav, cycleMastery,
    toggleListManager, createList, renameList, removeList,
    moveToList, doMoveToList, deleteWord,
  };
})();
