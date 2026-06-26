// ============================================
// LalaWord Records / Stats Page
// ============================================

const RecordsPage = (() => {
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let chartTab = 'daily'; // daily, cumulative, level

  async function render() {
    const page = document.getElementById('page-records');
    if (!page) return;

    const header = document.querySelector('.app-header');
    if (header) {
      header.innerHTML = `
        <div class="header-left"></div>
        <div class="header-title">학습 기록</div>
        <div class="header-right"></div>
      `;
    }

    const wordCount = await DB.getWordCount();
    const masteredInfo = await DB.getMasteredCount();
    const masteredCount = masteredInfo.total;
    const streak = await DB.getStreak();
    const todayStats = await DB.getTodayStats();

    // Get stats for calendar
    const startDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const endDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${Utils.getDaysInMonth(currentYear, currentMonth)}`;
    const monthStats = await DB.getStatsRange(startDate, endDate);
    const statsMap = {};
    monthStats.forEach(s => { statsMap[s.date] = s; });

    // Get last 7 days for chart
    const last7 = Utils.getLast7Days();
    const weekStats = await DB.getStatsRange(last7[0], last7[6]);
    const weekMap = {};
    weekStats.forEach(s => { weekMap[s.date] = s; });

    page.querySelector('.page-content').innerHTML = `
      <!-- Summary cards -->
      <div class="grid-2 mb-lg stagger">
        <div class="stat-card anim-scale-in">
          <div class="stat-value">${wordCount}</div>
          <div class="stat-label">총 단어</div>
        </div>
        <div class="stat-card anim-scale-in">
          <div class="stat-value" style="color:var(--color-teal);">${masteredCount}</div>
          <div class="stat-label">완료 단어</div>
        </div>
        <div class="stat-card anim-scale-in">
          <div class="stat-value" style="color:var(--color-amber);">
            🔥 ${streak}
          </div>
          <div class="stat-label">연속 학습일</div>
        </div>
        <div class="stat-card anim-scale-in">
          <div class="stat-value" style="color:var(--color-sky);">${todayStats.scanCount}</div>
          <div class="stat-label">오늘 스캔</div>
        </div>
      </div>

      <!-- Calendar -->
      <div class="card mb-lg anim-slide-up">
        <div class="flex-between mb-md">
          <button onclick="RecordsPage.prevMonth()" style="font-size:18px;padding:4px 8px;">←</button>
          <div style="font-size:16px;font-weight:700;">${currentYear}년 ${currentMonth + 1}월</div>
          <button onclick="RecordsPage.nextMonth()" style="font-size:18px;padding:4px 8px;">→</button>
        </div>

        <!-- Day headers -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);text-align:center;margin-bottom:8px;">
          ${['일','월','화','수','목','금','토'].map(d =>
            `<div style="font-size:12px;font-weight:600;color:var(--color-text-muted);padding:4px;">${d}</div>`
          ).join('')}
        </div>

        <!-- Calendar grid -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">
          ${generateCalendarDays(statsMap)}
        </div>

        <div style="display:flex;gap:12px;justify-content:center;margin-top:12px;">
          <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--color-text-muted);">
            <div style="width:10px;height:10px;border-radius:2px;background:var(--color-coral-light);"></div> 1-5단어
          </div>
          <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--color-text-muted);">
            <div style="width:10px;height:10px;border-radius:2px;background:var(--color-coral-200);"></div> 6-15단어
          </div>
          <div style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--color-text-muted);">
            <div style="width:10px;height:10px;border-radius:2px;background:var(--color-coral);"></div> 16+단어
          </div>
        </div>
      </div>

      <!-- Chart tabs -->
      <div class="flex-row gap-xs mb-md">
        <button class="chip ${chartTab === 'daily' ? 'selected' : ''}" onclick="RecordsPage.setChartTab('daily')">📊 일별</button>
        <button class="chip ${chartTab === 'cumulative' ? 'selected' : ''}" onclick="RecordsPage.setChartTab('cumulative')">📈 누적</button>
        <button class="chip ${chartTab === 'level' ? 'selected' : ''}" onclick="RecordsPage.setChartTab('level')">🎯 수준별</button>
      </div>

      <!-- Chart -->
      <div class="card mb-lg">
        <canvas id="stats-chart" height="200"></canvas>
        ${wordCount === 0 ? `
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
            font-size:14px;color:var(--color-text-muted);">
            아직 학습 기록이 없어요! 📚
          </div>
        ` : ''}
      </div>

      <!-- Recent quiz results -->
      <div class="section-title mb-sm">📝 최근 퀴즈 결과</div>
      <div id="quiz-history"></div>
    `;

    // Render chart
    if (wordCount > 0) {
      await renderChart(weekMap, last7);
    }

    // Load quiz history
    await renderQuizHistory();
  }

  function generateCalendarDays(statsMap) {
    const daysInMonth = Utils.getDaysInMonth(currentYear, currentMonth);
    const firstDay = Utils.getFirstDayOfMonth(currentYear, currentMonth);
    const today = Utils.today();
    let html = '';

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += '<div style="padding:6px;"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const stat = statsMap[dateStr];
      const words = stat?.wordsLearned || 0;
      const isToday = dateStr === today;

      let bg = 'transparent';
      if (words >= 16) bg = 'var(--color-coral)';
      else if (words >= 6) bg = 'var(--color-coral-200)';
      else if (words >= 1) bg = 'var(--color-coral-light)';

      const textColor = words >= 16 ? '#fff' : words >= 6 ? 'var(--color-coral)' : 'var(--color-text-primary)';

      html += `
        <div style="padding:6px;text-align:center;border-radius:8px;background:${bg};
          ${isToday ? 'outline:2px solid var(--color-coral);outline-offset:-2px;' : ''}
          font-size:13px;font-weight:${isToday ? '700' : '400'};color:${textColor};
          cursor:pointer;" onclick="RecordsPage.showDayDetail('${dateStr}')">
          ${day}
        </div>
      `;
    }

    return html;
  }

  async function renderChart(weekMap, last7) {
    const canvas = document.getElementById('stats-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');

    if (chartTab === 'daily') {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: last7.map(d => {
            const date = new Date(d);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }),
          datasets: [{
            label: '학습 단어',
            data: last7.map(d => weekMap[d]?.wordsLearned || 0),
            backgroundColor: '#E8664A88',
            borderColor: '#E8664A',
            borderWidth: 1,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 5 } },
            x: { grid: { display: false } }
          },
          animation: { duration: 800, easing: 'easeOutQuart' }
        }
      });
    } else if (chartTab === 'cumulative') {
      const allStats = await DB.getStatsRange('2020-01-01', Utils.today());
      let cumulative = 0;
      const data = allStats.map(s => {
        cumulative += s.wordsLearned || 0;
        return { x: s.date, y: cumulative };
      });

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => {
            const date = new Date(d.x);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }),
          datasets: [{
            label: '누적 단어',
            data: data.map(d => d.y),
            borderColor: '#2A9D8F',
            backgroundColor: '#2A9D8F22',
            fill: true,
            tension: 0.3,
            pointRadius: 2,
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true },
            x: { grid: { display: false } }
          },
          animation: { duration: 800, easing: 'easeOutQuart' }
        }
      });
    } else if (chartTab === 'level') {
      const words = await DB.getAllWords();
      const levelCounts = [0, 0, 0, 0, 0, 0];
      words.forEach(w => {
        const l = (w.level || 3) - 1;
        if (l >= 0 && l < 6) levelCounts[l]++;
      });

      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: Utils.LEVELS.map(l => `${l.emoji} ${l.name}`),
          datasets: [{
            data: levelCounts,
            backgroundColor: [
              '#5CB85C', '#2A9D8F', '#4A90D9', '#E9A23B', '#E8664A', '#D4637A'
            ],
            borderWidth: 2,
            borderColor: '#fff',
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 12 } }
          },
          animation: { duration: 800, easing: 'easeOutQuart' }
        }
      });
    }
  }

  async function renderQuizHistory() {
    const container = document.getElementById('quiz-history');
    if (!container) return;

    const results = await DB.getQuizResults(5);
    if (results.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align:center;color:var(--color-text-muted);font-size:14px;padding:24px;">
          아직 퀴즈 기록이 없어요
        </div>
      `;
      return;
    }

    container.innerHTML = results.map(r => {
      const correct = r.correct ?? r.correctCount ?? 0;
      const total = r.total ?? r.totalQuestions ?? 1;
      const pct = Utils.percentage(correct, total);
      return `
        <div class="card mb-xs">
          <div class="flex-between">
            <div>
              <div style="font-size:14px;font-weight:600;">
                ${correct}/${total} 정답
                ${correct === total ? ' 🎉' : ''}
              </div>
              <div style="font-size:12px;color:var(--color-text-muted);">${Utils.formatDate(r.date)}</div>
            </div>
            <div style="font-family:var(--font-en);font-size:18px;font-weight:800;
              color:${pct >= 80 ? 'var(--color-green)' : 'var(--color-amber)'};">
              ${pct}%
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function prevMonth() {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    render();
  }

  function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    render();
  }

  function setChartTab(tab) {
    chartTab = tab;
    render();
  }

  async function showDayDetail(date) {
    const stats = await DB.getStatsRange(date, date);
    const s = stats[0];
    if (!s || s.wordsLearned === 0) {
      Toast.info(`${Utils.formatDateKR(date)}에는 학습 기록이 없어요`);
      return;
    }
    Modal.show({
      title: `📅 ${Utils.formatDateKR(date)}`,
      content: `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="stat-card"><div class="stat-value">${s.wordsLearned}</div><div class="stat-label">학습 단어</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--color-teal)">${s.wordsReviewed}</div><div class="stat-label">복습 단어</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--color-sky)">${s.scanCount}</div><div class="stat-label">스캔 횟수</div></div>
          <div class="stat-card"><div class="stat-value" style="color:var(--color-amber)">${s.studyMinutes || 0}</div><div class="stat-label">학습(분)</div></div>
        </div>
      `,
      actions: [{ id: 'close', label: '닫기', primary: true }],
    });
  }

  return { render, prevMonth, nextMonth, setChartTab, showDayDetail };
})();
