// ============================================
// LalaWord Parent Settings Page
// ============================================

const ParentSettingsPage = (() => {

  async function render() {
    const page = document.getElementById('page-parent-settings');
    if (!page) return;

    const header = document.querySelector('.app-header');
    if (header) {
      header.innerHTML = `
        <button class="header-left" onclick="Router.navigate('/settings')">←</button>
        <div class="header-title">부모 설정</div>
        <div class="header-right"></div>
      `;
    }

    const parentPIN = Store.get('parentPIN');
    const levelLocked = Store.get('levelLocked');
    const level = Store.get('level');
    const levelInfo = Utils.getLevelInfo(level);
    const wordCount = await DB.getWordCount();
    const masteredInfo = await DB.getMasteredCount();
    const masteredCount = masteredInfo.total;

    // Get weekly stats for parent report
    const last7 = Utils.getLast7Days();
    const weekStats = await DB.getStatsRange(last7[0], last7[6]);
    const totalWeekWords = weekStats.reduce((sum, s) => sum + (s.wordsLearned || 0), 0);
    const totalWeekReviews = weekStats.reduce((sum, s) => sum + (s.wordsReviewed || 0), 0);
    const totalWeekScans = weekStats.reduce((sum, s) => sum + (s.scanCount || 0), 0);

    page.querySelector('.page-content').innerHTML = `
      <!-- Parent Report -->
      <div class="card-highlight mb-lg anim-slide-up">
        <div style="font-size:16px;font-weight:700;margin-bottom:12px;">📊 이번 주 학습 리포트</div>
        <div class="grid-3">
          <div class="stat-card">
            <div class="stat-value">${totalWeekWords}</div>
            <div class="stat-label">새 단어</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--color-teal)">${totalWeekReviews}</div>
            <div class="stat-label">복습</div>
          </div>
          <div class="stat-card">
            <div class="stat-value" style="color:var(--color-sky)">${totalWeekScans}</div>
            <div class="stat-label">스캔</div>
          </div>
        </div>
        <div style="margin-top:12px;padding:12px;background:var(--color-white);border-radius:10px;">
          <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:4px;">전체 진행 상황</div>
          <div class="flex-between mb-xs">
            <span style="font-size:14px;font-weight:600;">${masteredCount} / ${wordCount} 단어 완료</span>
            <span style="font-size:14px;font-weight:700;color:var(--color-coral);">${Utils.percentage(masteredCount, wordCount)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${Utils.percentage(masteredCount, wordCount)}%;"></div>
          </div>
        </div>
      </div>

      <!-- Weekly chart -->
      <div class="card mb-lg anim-slide-up" style="animation-delay:100ms;">
        <div style="font-size:14px;font-weight:600;margin-bottom:12px;">📈 주간 학습량</div>
        <canvas id="parent-chart" height="180"></canvas>
      </div>

      <!-- PIN Settings -->
      <div class="section-title mb-sm">🔐 보안 설정</div>
      <div class="card mb-lg" style="padding:0;">
        <div class="list-item" onclick="ParentSettingsPage.setupPIN()">
          <div class="list-icon" style="background:var(--color-rose-light);">🔑</div>
          <div class="list-content">
            <div class="list-title">PIN ${parentPIN ? '변경' : '설정'}</div>
            <div class="list-desc">${parentPIN ? '부모 설정 접근 시 PIN 입력 필요' : '아이가 설정을 변경하지 못하게 잠금'}</div>
          </div>
          <div class="list-right">→</div>
        </div>

        ${parentPIN ? `
          <div class="list-item" onclick="ParentSettingsPage.removePIN()">
            <div class="list-icon" style="background:var(--color-bg);">🔓</div>
            <div class="list-content">
              <div class="list-title">PIN 해제</div>
              <div class="list-desc">부모 설정 잠금 해제</div>
            </div>
            <div class="list-right">→</div>
          </div>
        ` : ''}
      </div>

      <!-- Lock Settings -->
      <div class="section-title mb-sm">🔒 기능 잠금</div>
      <div class="card mb-lg" style="padding:0;">
        <div class="list-item">
          <div class="list-icon" style="background:var(--color-amber-light);">📚</div>
          <div class="list-content">
            <div class="list-title">수준 변경 잠금</div>
            <div class="list-desc">현재: ${levelInfo.emoji} Lv.${level} ${levelInfo.name}</div>
          </div>
          <label class="switch">
            <input type="checkbox" ${levelLocked ? 'checked' : ''} onchange="ParentSettingsPage.toggleLevelLock(this.checked)">
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- Danger Zone -->
      <div class="section-title mb-sm" style="color:var(--color-rose);">⚠️ 위험 영역</div>
      <div class="card" style="padding:0;border-color:var(--color-rose-light);">
        <div class="list-item" onclick="SettingsPage.clearData()">
          <div class="list-icon" style="background:var(--color-rose-light);">🗑️</div>
          <div class="list-content">
            <div class="list-title" style="color:var(--color-rose);">전체 데이터 초기화</div>
            <div class="list-desc">모든 학습 데이터를 삭제합니다</div>
          </div>
          <div class="list-right">→</div>
        </div>
      </div>
    `;

    // Render parent chart
    renderParentChart(weekStats, last7);
  }

  function renderParentChart(weekStats, last7) {
    const canvas = document.getElementById('parent-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const weekMap = {};
    weekStats.forEach(s => { weekMap[s.date] = s; });

    new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: last7.map(d => {
          const date = new Date(d);
          return ['일','월','화','수','목','금','토'][date.getDay()];
        }),
        datasets: [
          {
            label: '새 단어',
            data: last7.map(d => weekMap[d]?.wordsLearned || 0),
            backgroundColor: '#E8664A88',
            borderColor: '#E8664A',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: '복습',
            data: last7.map(d => weekMap[d]?.wordsReviewed || 0),
            backgroundColor: '#2A9D8F88',
            borderColor: '#2A9D8F',
            borderWidth: 1,
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
        scales: {
          y: { beginAtZero: true, stacked: false },
          x: { grid: { display: false } }
        },
        animation: { duration: 800, easing: 'easeOutQuart' }
      }
    });
  }

  function setupPIN() {
    PinInput.show({
      title: 'PIN 설정',
      subtitle: '4자리 PIN을 입력해주세요',
      onComplete: (pin1) => {
        PinInput.show({
          title: 'PIN 확인',
          subtitle: '같은 PIN을 한번 더 입력해주세요',
          onComplete: (pin2) => {
            if (pin1 === pin2) {
              Store.set('parentPIN', pin1);
              Toast.success('PIN이 설정되었어요! 🔐');
              render();
            } else {
              Toast.error('PIN이 일치하지 않아요. 다시 시도해주세요');
            }
          },
        });
      },
    });
  }

  async function removePIN() {
    const confirmed = await Modal.confirm({
      title: '🔓 PIN 해제',
      message: '부모 설정 잠금을 해제하시겠어요?\n아이가 자유롭게 설정을 변경할 수 있게 됩니다.',
      confirmText: '해제',
      cancelText: '취소',
    });
    if (confirmed) {
      Store.set('parentPIN', null);
      Toast.success('PIN이 해제되었어요');
      render();
    }
  }

  function toggleLevelLock(locked) {
    Store.set('levelLocked', locked);
    Toast.info(locked ? '수준 변경이 잠겼어요 🔒' : '수준 변경 잠금이 해제되었어요 🔓');
  }

  return { render, setupPIN, removePIN, toggleLevelLock };
})();
