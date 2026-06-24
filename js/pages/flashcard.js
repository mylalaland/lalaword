// ============================================
// LalaWord Flashcard Page
// ============================================

const FlashcardPage = (() => {
  let words = [];
  let currentIndex = 0;
  let isFlipped = false;
  let results = [];

  async function render() {
    const page = document.getElementById('page-flashcard');
    if (!page) return;

    words = await DB.getWordsForQuiz(20);
    if (words.length === 0) {
      words = await DB.getAllWords();
    }
    words = Utils.shuffle(words);
    currentIndex = 0;
    isFlipped = false;
    results = [];

    renderCard();
  }

  function renderCard() {
    const page = document.getElementById('page-flashcard');
    if (!page) return;

    if (currentIndex >= words.length || words.length === 0) {
      renderComplete();
      return;
    }

    const w = words[currentIndex];
    const levelInfo = Utils.getLevelInfo(w.level || 3);

    page.querySelector('.page-content').innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;background:var(--color-bg);">
        <!-- Top bar -->
        <div style="padding:16px;display:flex;justify-content:space-between;align-items:center;">
          <button onclick="Router.navigate('/vocabulary')" style="font-size:18px;">←</button>
          <div style="font-size:13px;color:var(--color-text-muted);">
            ${currentIndex + 1} / ${words.length}
          </div>
          <div></div>
        </div>

        <!-- Progress -->
        <div class="progress-bar" style="margin:0 16px;height:4px;">
          <div class="progress-fill" style="width:${Utils.percentage(currentIndex + 1, words.length)}%;transition:width 300ms;"></div>
        </div>

        <!-- Card -->
        <div style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;">
          <div id="flashcard" onclick="FlashcardPage.flip()"
            style="width:100%;max-width:340px;min-height:280px;background:var(--color-white);
            border-radius:20px;box-shadow:0 8px 32px rgba(0,0,0,0.08);padding:32px;
            display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;
            cursor:pointer;transition:transform 300ms ease;
            ${isFlipped ? 'transform:rotateY(0deg);' : ''}">

            ${!isFlipped ? `
              <!-- Front: Word -->
              <div class="tag tag-${levelInfo.color}" style="margin-bottom:16px;">
                ${levelInfo.emoji} Lv.${w.level || 3}
              </div>
              <div style="font-family:var(--font-en);font-size:32px;font-weight:800;color:var(--color-text-primary);margin-bottom:12px;">
                ${w.word}
              </div>
              ${w.pronunciation ? `<div class="word-pronunciation" style="font-size:14px;margin-bottom:16px;">${w.pronunciation}</div>` : ''}
              <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();SpeechService.speak('${w.word}')">
                🔊 발음 듣기
              </button>
              <div style="margin-top:24px;font-size:12px;color:var(--color-text-hint);">탭하면 뜻이 보여요</div>
            ` : `
              <!-- Back: Meaning -->
              <div style="font-family:var(--font-en);font-size:22px;font-weight:700;color:var(--color-text-muted);margin-bottom:12px;">
                ${w.word}
              </div>
              <div style="font-size:22px;font-weight:700;color:var(--color-text-primary);margin-bottom:8px;">
                ${w.meaning}
              </div>
              <div class="word-pos" style="margin-bottom:12px;">${w.pos || ''}</div>
              ${w.example ? `
                <div style="background:var(--color-bg);padding:12px;border-radius:10px;font-size:13px;width:100%;text-align:left;">
                  <div style="color:var(--color-text-secondary);">📌 ${w.example}</div>
                  ${w.exampleMeaning ? `<div style="color:var(--color-text-muted);margin-top:4px;">→ ${w.exampleMeaning}</div>` : ''}
                </div>
              ` : ''}
            `}
          </div>
        </div>

        <!-- Rating buttons (only when flipped) -->
        ${isFlipped ? `
          <div style="padding:16px 24px 32px;display:flex;gap:10px;">
            <button onclick="FlashcardPage.rate(1)" class="btn btn-block"
              style="background:var(--color-rose-light);color:var(--color-rose);flex:1;">
              ❌ 몰라요
            </button>
            <button onclick="FlashcardPage.rate(3)" class="btn btn-block"
              style="background:var(--color-amber-light);color:var(--color-amber);flex:1;">
              🤔 헷갈려요
            </button>
            <button onclick="FlashcardPage.rate(4)" class="btn btn-block"
              style="background:var(--color-teal-light);color:var(--color-teal);flex:1;">
              😊 알아요
            </button>
            <button onclick="FlashcardPage.rate(5)" class="btn btn-block"
              style="background:var(--color-sky-light);color:var(--color-sky);flex:1;">
              ⭐ 완벽!
            </button>
          </div>
        ` : `
          <div style="padding:16px 24px 32px;text-align:center;">
            <div style="font-size:13px;color:var(--color-text-hint);">카드를 탭해서 뜻을 확인하세요</div>
          </div>
        `}
      </div>
    `;
  }

  function flip() {
    isFlipped = !isFlipped;
    Utils.vibrate(5);
    renderCard();
  }

  async function rate(quality) {
    const w = words[currentIndex];
    results.push({ wordId: w.id, quality, word: w.word });

    // Process SM-2
    await SpacedRepetition.processReview(w.id, quality);

    // Update mastery: 몰라요(1)→미암기(0), 헷갈려요(3)/알아요(4)→반암기(1), 완벽(5)→완전암기(2)
    const masteryMap = { 1: 0, 3: 1, 4: 1, 5: 2 };
    if (masteryMap[quality] !== undefined) {
      await DB.setMastered(w.id, masteryMap[quality]);
    }

    Utils.vibrate(10);
    currentIndex++;
    isFlipped = false;
    renderCard();
  }

  function renderComplete() {
    const page = document.getElementById('page-flashcard');
    if (!page) return;

    const known = results.filter(r => r.quality >= 4).length;
    const unsure = results.filter(r => r.quality === 3).length;
    const unknown = results.filter(r => r.quality < 3).length;

    page.querySelector('.page-content').innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;background:var(--color-bg);">
        <div style="font-size:64px;margin-bottom:16px;" class="anim-pop-in">🎉</div>
        <div style="font-size:24px;font-weight:800;margin-bottom:8px;" class="anim-slide-up">학습 완료!</div>
        <div style="font-size:14px;color:var(--color-text-muted);margin-bottom:32px;" class="anim-slide-up">${results.length}개 단어를 복습했어요</div>

        <div class="grid-3" style="width:100%;max-width:300px;margin-bottom:32px;" class="anim-slide-up">
          <div class="stat-card">
            <div class="stat-value" style="color:var(--color-teal)">${known}</div>
            <div class="stat-label">알아요</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--color-amber)">${unsure}</div>
            <div class="stat-label">헷갈려요</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--color-rose)">${unknown}</div>
            <div class="stat-label">몰라요</div>
          </div>
        </div>

        <button class="btn btn-primary btn-lg btn-block" onclick="FlashcardPage.render()" style="max-width:300px;">
          🔄 다시 연습하기
        </button>
        <button class="btn btn-ghost mt-sm" onclick="Router.navigate('/vocabulary')">단어장으로 돌아가기</button>
      </div>
    `;
  }

  return { render, flip, rate };
})();
