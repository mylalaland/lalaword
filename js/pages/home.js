// ============================================
// LalaWord Home Page
// ============================================

const HomePage = (() => {

  async function render() {
    const page = document.getElementById('page-home');
    if (!page) return;

    const level = Store.get('level');
    const levelInfo = Utils.getLevelInfo(level);
    const todayStats = await DB.getTodayStats();
    const wordCount = await DB.getWordCount();
    const masteredInfo = await DB.getMasteredCount();
    const masteredCount = masteredInfo.total;
    const streak = await DB.getStreak();
    const dueWords = await SpacedRepetition.getDueWords();
    const recentScans = await DB.getScans(3);
    const dailyGoal = Store.get('dailyGoal');
    const goalProgress = Math.min(100, Utils.percentage(todayStats.wordsLearned, dailyGoal));

    Store.set('streak', streak);

    page.querySelector('.page-content').innerHTML = `
      <!-- Greeting -->
      <div class="home-greeting anim-slide-up">
        <div class="flex-between mb-md">
          <div>
            <div style="font-size:24px;font-weight:800;color:var(--color-text-primary);">
              안녕하세요! 👋
            </div>
            <div style="font-size:14px;color:var(--color-text-muted);margin-top:4px;">
              오늘도 영어 공부 화이팅!
            </div>
          </div>
          <div class="tag tag-${levelInfo.color}" style="font-size:13px;padding:6px 14px;">
            ${levelInfo.emoji} ${levelInfo.name}
          </div>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="grid-3 mb-lg stagger" style="animation-delay:100ms;">
        <div class="stat-card anim-scale-in">
          <div class="stat-value">${wordCount}</div>
          <div class="stat-label">총 단어</div>
        </div>
        <div class="stat-card anim-scale-in">
          <div class="stat-value" style="color:var(--color-teal)">${todayStats.wordsLearned}</div>
          <div class="stat-label">오늘 학습</div>
        </div>
        <div class="stat-card anim-scale-in">
          <div class="streak-badge" style="margin:0 auto;">
            🔥 ${streak}일
          </div>
          <div class="stat-label" style="margin-top:6px;">연속 학습</div>
        </div>
      </div>

      <!-- Daily Goal -->
      <div class="card mb-md anim-slide-up" style="animation-delay:150ms;">
        <div class="flex-between mb-xs">
          <div style="font-size:14px;font-weight:600;">📎 오늘의 목표</div>
          <div style="font-size:13px;color:var(--color-text-muted);">${todayStats.wordsLearned} / ${dailyGoal}단어</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${goalProgress}%;"></div>
        </div>
        ${goalProgress >= 100 ? '<div style="font-size:13px;color:var(--color-green);margin-top:8px;text-align:center;">🎉 목표 달성! 대단해요!</div>' : ''}
      </div>

      <!-- Quick Actions -->
      <div class="grid-2 mb-lg stagger" style="animation-delay:200ms;">
        <button class="card anim-scale-in" onclick="Router.navigate('/camera')" style="text-align:center;cursor:pointer;border:2px solid var(--color-coral-100);">
          <div style="font-size:32px;margin-bottom:8px;">📷</div>
          <div style="font-size:15px;font-weight:700;color:var(--color-coral);">책 스캔하기</div>
          <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">카메라로 영어책 촬영</div>
        </button>
        <button class="card anim-scale-in" onclick="Router.navigate('/flashcard')" style="text-align:center;cursor:pointer;border:2px solid var(--color-teal-100);">
          <div style="font-size:32px;margin-bottom:8px;">🃏</div>
          <div style="font-size:15px;font-weight:700;color:var(--color-teal);">플래시카드</div>
          <div style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">단어 암기 연습</div>
        </button>
      </div>

      <!-- Due Reviews -->
      ${dueWords.length > 0 ? `
      <div class="mb-lg anim-slide-up" style="animation-delay:250ms;">
        <div class="flex-between mb-sm">
          <div class="section-title">📝 복습할 단어</div>
          <span class="badge">${dueWords.length}</span>
        </div>
        <div class="card" style="padding:0;">
          ${dueWords.slice(0, 5).map(w => `
            <div class="list-item" onclick="SpeechService.speak('${w.word}')">
              <div class="list-icon" style="background:var(--color-${Utils.getLevelInfo(w.level).color}-light);">
                ${Utils.getLevelInfo(w.level).emoji}
              </div>
              <div class="list-content">
                <div class="list-title" style="font-family:var(--font-en);">${w.word}</div>
                <div class="list-desc">${w.meaning}</div>
              </div>
              <div class="list-right">🔊</div>
            </div>
          `).join('')}
          ${dueWords.length > 5 ? `
            <button class="list-item" onclick="Router.navigate('/vocabulary')" style="justify-content:center;color:var(--color-coral);font-weight:600;font-size:14px;">
              +${dueWords.length - 5}개 더보기
            </button>
          ` : ''}
        </div>
      </div>
      ` : ''}

      <!-- Recent Scans -->
      ${recentScans.length > 0 ? `
      <div class="mb-lg anim-slide-up" style="animation-delay:300ms;">
        <div class="section-title mb-sm">📚 최근 스캔</div>
        ${recentScans.map(scan => `
          <div class="card mb-xs" onclick="Router.navigate('/scan-result', {id:'${scan.id}'})" style="cursor:pointer;">
            <div class="flex-between">
              <div>
                <div style="font-size:14px;font-weight:600;">${scan.bookTitle || '스캔 기록'}</div>
                <div style="font-size:12px;color:var(--color-text-muted);">${Utils.relativeTime(scan.createdAt)} · ${scan.wordCount || 0}단어</div>
              </div>
              <div style="font-size:18px;color:var(--color-text-muted);">→</div>
            </div>
          </div>
        `).join('')}
      </div>
      ` : `
      <div class="empty-state anim-slide-up" style="animation-delay:300ms;padding:32px;">
        <div class="empty-icon">📚</div>
        <div class="empty-title">아직 스캔 기록이 없어요</div>
        <div class="empty-desc">영어 책을 카메라로 촬영하면<br>단어를 알려드려요!</div>
        <button class="btn btn-primary mt-lg" onclick="Router.navigate('/camera')">📷 책 스캔 시작하기</button>
      </div>
      `}

      <!-- Mastery Progress -->
      ${wordCount > 0 ? `
      <div class="card mb-lg anim-slide-up" style="animation-delay:350ms;text-align:center;">
        <div style="font-size:14px;font-weight:600;margin-bottom:12px;">📈 단어 암기 진행률</div>
        <div class="progress-circle" style="margin:0 auto;">
          <svg width="100" height="100">
            <circle class="progress-bg" cx="50" cy="50" r="42"></circle>
            <circle class="progress-value" cx="50" cy="50" r="42"
              stroke-dasharray="${2 * Math.PI * 42}"
              stroke-dashoffset="${2 * Math.PI * 42 * (1 - masteredCount / Math.max(wordCount, 1))}">
            </circle>
          </svg>
          <div class="progress-text">${Utils.percentage(masteredCount, wordCount)}%</div>
        </div>
        <div style="display:flex;justify-content:center;gap:16px;margin-top:12px;font-size:12px;color:var(--color-text-muted);">
          <span>📝 미암기 ${wordCount - masteredCount}</span>
          <span>🔶 반암기 ${masteredInfo.half}</span>
          <span>✅ 완전 ${masteredInfo.full}</span>
        </div>
      </div>
      ` : ''}
    `;

    // Update header
    const header = document.querySelector('.app-header');
    if (header) {
      header.innerHTML = `
        <div class="header-left"></div>
        <div class="header-title" style="font-family:var(--font-en);color:var(--color-coral);font-weight:800;letter-spacing:-0.5px;">
          Lala<span style="color:var(--color-text-primary);font-weight:600;">Word</span>
        </div>
        <button class="header-right" onclick="Router.navigate('/settings')">⚙️</button>
      `;
    }
  }

  return { render };
})();
