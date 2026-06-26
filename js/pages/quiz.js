// ============================================
// LalaWord Quiz Page (with settings)
// ============================================

const QuizPage = (() => {
  let quizState = 'setup'; // 'setup' | 'playing' | 'result'
  let questions = [];
  let currentIndex = 0;
  let answers = [];
  let wordIdMap = {}; // word → id map for mastery updates
  let quizConfig = {
    count: 10,
    types: ['meaning', 'spelling', 'fillblank'],
    scope: 'all', // 'all' | 'unmastered' | 'half' | 'favorites'
    showHint: true,
  };

  async function render() {
    const page = document.getElementById('page-quiz');
    if (!page) return;

    const header = document.querySelector('.app-header');
    if (header) {
      header.innerHTML = `
        <button class="header-left" onclick="QuizPage.exitQuiz()">← </button>
        <div class="header-title">${quizState === 'setup' ? '퀴즈 설정' : quizState === 'result' ? '퀴즈 결과' : `${currentIndex + 1} / ${questions.length}`}</div>
        <div class="header-right"></div>
      `;
    }

    const content = page.querySelector('.page-content');
    if (!content) return;

    if (quizState === 'setup') {
      content.innerHTML = renderSetup();
    } else if (quizState === 'playing') {
      content.innerHTML = renderQuestion();
    } else {
      content.innerHTML = renderResult();
    }
  }

  function renderSetup() {
    const countOptions = [5, 10, 15, 20, 30, 50];
    const typeOptions = [
      { id: 'meaning', label: '뜻 고르기', emoji: '🔤', desc: '영어 → 한국어 뜻' },
      { id: 'spelling', label: '빈칸 채우기', emoji: '✏️', desc: '뜻 보고 영어 입력' },
      { id: 'fillblank', label: '문장 빈칸', emoji: '📝', desc: '문장에서 빈칸 채우기' },
      { id: 'reverse', label: '역방향', emoji: '🔄', desc: '한국어 → 영어 고르기' },
    ];
    const scopeOptions = [
      { id: 'all', label: '전체 단어', emoji: '📖' },
      { id: 'unmastered', label: '미암기만', emoji: '📝' },
      { id: 'half', label: '반암기만', emoji: '🔶' },
      { id: 'favorites', label: '즐겨찾기만', emoji: '⭐' },
    ];

    return `
      <div style="padding-top:8px;">
        <!-- Quiz count -->
        <div class="section-title mb-sm">📋 문제 수</div>
        <div class="card mb-md" style="padding:12px;">
          <div class="chip-group" style="justify-content:center;">
            ${countOptions.map(c => `
              <button class="chip ${quizConfig.count === c ? 'selected' : ''}"
                onclick="QuizPage.setConfig('count', ${c})"
                style="min-width:52px;justify-content:center;">${c}문제</button>
            `).join('')}
          </div>
        </div>

        <!-- Quiz types -->
        <div class="section-title mb-sm">🎯 문제 유형</div>
        <div class="card mb-md" style="padding:8px;">
          ${typeOptions.map(t => `
            <label class="list-item" style="cursor:pointer;padding:10px 8px;">
              <div style="font-size:22px;width:32px;text-align:center;">${t.emoji}</div>
              <div class="list-content">
                <div class="list-title">${t.label}</div>
                <div class="list-desc">${t.desc}</div>
              </div>
              <label class="switch">
                <input type="checkbox" ${quizConfig.types.includes(t.id) ? 'checked' : ''}
                  onchange="QuizPage.toggleType('${t.id}')">
                <span class="slider"></span>
              </label>
            </label>
          `).join('')}
        </div>

        <!-- Scope -->
        <div class="section-title mb-sm">📚 출제 범위</div>
        <div class="card mb-md" style="padding:12px;">
          <div class="chip-group" style="flex-wrap:wrap;">
            ${scopeOptions.map(s => `
              <button class="chip ${quizConfig.scope === s.id ? 'selected' : ''}"
                onclick="QuizPage.setConfig('scope', '${s.id}')"
                style="flex:1;min-width:100px;justify-content:center;">${s.emoji} ${s.label}</button>
            `).join('')}
          </div>
        </div>

        <!-- Hint toggle -->
        <div class="section-title mb-sm">💡 힌트</div>
        <div class="card mb-lg" style="padding:8px;">
          <label class="list-item" style="cursor:pointer;padding:10px 8px;">
            <div style="font-size:22px;width:32px;text-align:center;">💡</div>
            <div class="list-content">
              <div class="list-title">힌트 표시</div>
              <div class="list-desc">빈칸 문제에서 첫 글자 힌트 제공</div>
            </div>
            <label class="switch">
              <input type="checkbox" ${quizConfig.showHint ? 'checked' : ''}
                onchange="QuizPage.toggleHint()">
              <span class="slider"></span>
            </label>
          </label>
        </div>

        <!-- Start button -->
        <button class="btn btn-primary btn-block btn-lg" onclick="QuizPage.startQuiz()">
          🚀 퀴즈 시작
        </button>
      </div>
    `;
  }

  function renderQuestion() {
    if (currentIndex >= questions.length) {
      quizState = 'result';
      return renderResult();
    }

    const q = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return `
      <div>
        <!-- Progress bar -->
        <div class="progress-bar mb-md" style="height:6px;">
          <div class="progress-fill" style="width:${progress}%;transition:width 300ms ease;"></div>
        </div>

        ${q.type === 'meaning' ? renderMeaningQ(q)
          : q.type === 'reverse' ? renderReverseQ(q)
          : q.type === 'spelling' ? renderSpellingQ(q)
          : renderFillblankQ(q)}
      </div>
    `;
  }

  function renderMeaningQ(q) {
    return `
      <div style="text-align:center;padding:16px 0;">
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:8px;">이 단어의 뜻은?</div>
        <div class="word-display" style="font-size:32px;">${q.word}</div>
        ${q.pronunciation ? `<div class="word-pronunciation" style="margin-top:4px;">${q.pronunciation}</div>` : ''}
        <button class="btn-icon" onclick="SpeechService.speak('${q.word}')" style="margin-top:8px;">🔊</button>
      </div>
      <div style="margin-top:16px;">
        ${q.options.map((opt, i) => `
          <button class="card mb-xs" onclick="QuizPage.answerMC(${i})"
            style="width:100%;text-align:left;padding:14px 16px;cursor:pointer;transition:all 150ms ease;"
            onmousedown="this.style.transform='scale(0.98)'" onmouseup="this.style.transform='scale(1)'"
            id="opt-${i}">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--color-bg);font-size:13px;font-weight:700;color:var(--color-text-muted);margin-right:10px;">${String.fromCharCode(65 + i)}</span>
            ${opt}
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderReverseQ(q) {
    return `
      <div style="text-align:center;padding:16px 0;">
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:8px;">이 뜻의 영어 단어는?</div>
        <div style="font-size:28px;font-weight:700;">${q.meaning}</div>
        <div class="word-pos" style="margin-top:4px;">${q.pos || ''}</div>
      </div>
      <div style="margin-top:16px;">
        ${q.options.map((opt, i) => `
          <button class="card mb-xs" onclick="QuizPage.answerMC(${i})"
            style="width:100%;text-align:left;padding:14px 16px;cursor:pointer;font-family:var(--font-en);font-size:16px;font-weight:600;"
            id="opt-${i}">
            <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--color-bg);font-size:13px;font-weight:700;color:var(--color-text-muted);margin-right:10px;">${String.fromCharCode(65 + i)}</span>
            ${opt}
          </button>
        `).join('')}
      </div>
    `;
  }

  function renderSpellingQ(q) {
    const hint = quizConfig.showHint ? q.word.charAt(0) + '_'.repeat(q.word.length - 1) : '';
    return `
      <div style="text-align:center;padding:16px 0;">
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:8px;">빈칸에 들어갈 단어는?</div>
        ${q.example ? `
          <div style="font-family:var(--font-en);font-size:16px;color:var(--color-text-secondary);line-height:1.6;margin:8px 0;">
            ${q.example.replace(new RegExp(q.word, 'gi'), '<span style="border-bottom:2px dashed var(--color-coral);font-weight:700;color:var(--color-coral);">_____</span>')}
          </div>
        ` : ''}
        <div style="margin:12px 0;">
          <span style="font-size:14px;">💡 뜻: ${q.meaning}</span>
        </div>
        ${hint ? `<div style="font-family:var(--font-mono);font-size:14px;color:var(--color-text-hint);margin-top:4px;">힌트: ${hint}</div>` : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <input id="spelling-input" class="input-field" placeholder="영어 단어를 입력하세요"
          style="flex:1;font-family:var(--font-en);font-size:16px;text-align:center;"
          onkeydown="if(event.key==='Enter')QuizPage.answerSpelling()">
        <button class="btn btn-primary" onclick="QuizPage.answerSpelling()">확인</button>
      </div>
    `;
  }

  function renderFillblankQ(q) {
    const hint = quizConfig.showHint ? q.word.charAt(0) + '_'.repeat(q.word.length - 1) : '';
    const blankSentence = q.example
      ? q.example.replace(new RegExp(`\\b${q.word}\\b`, 'gi'), '_____')
      : `_____ means "${q.meaning}"`;

    return `
      <div style="text-align:center;padding:16px 0;">
        <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:8px;">빈칸에 들어갈 단어는?</div>
        <div style="font-family:var(--font-en);font-size:17px;color:var(--color-text-primary);line-height:1.7;margin:12px 0;font-weight:500;">
          ${blankSentence}
        </div>
        <div style="margin:12px 0;">
          <span style="font-size:14px;">💡 뜻: ${q.meaning}</span>
        </div>
        ${hint ? `<div style="font-family:var(--font-mono);font-size:14px;color:var(--color-text-hint);">힌트: ${hint}</div>` : ''}
      </div>
      <div style="display:flex;gap:8px;margin-top:16px;">
        <input id="spelling-input" class="input-field" placeholder="영어 단어를 입력하세요"
          style="flex:1;font-family:var(--font-en);font-size:16px;text-align:center;"
          onkeydown="if(event.key==='Enter')QuizPage.answerSpelling()">
        <button class="btn btn-primary" onclick="QuizPage.answerSpelling()">확인</button>
      </div>
    `;
  }

  function renderResult() {
    const correct = answers.filter(a => a.correct).length;
    const total = answers.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const circumference = 2 * Math.PI * 44;
    const offset = circumference - (pct / 100) * circumference;

    const color = pct >= 80 ? 'var(--color-green)' : pct >= 50 ? 'var(--color-amber)' : 'var(--color-rose)';
    const message = pct === 100 ? '완벽해요! 🎉' : pct >= 80 ? '잘 했어요! 👏' : pct >= 50 ? '조금만 더! 💪' : '다시 도전해봐요! 📖';

    return `
      <div style="text-align:center;padding:24px 0;">
        <!-- Score circle -->
        <div class="progress-circle" style="margin:0 auto 16px;">
          <svg width="100" height="100">
            <circle class="progress-bg" cx="50" cy="50" r="44" stroke-width="6"/>
            <circle class="progress-value" cx="50" cy="50" r="44" stroke-width="6"
              style="stroke:${color};stroke-dasharray:${circumference};stroke-dashoffset:${offset};" />
          </svg>
          <div class="progress-text" style="font-size:24px;">${pct}%</div>
        </div>
        <div style="font-size:20px;font-weight:700;margin-bottom:4px;">${message}</div>
        <div style="font-size:14px;color:var(--color-text-muted);">
          ${total}문제 중 ${correct}개 정답
        </div>
      </div>

      <!-- Stats -->
      <div class="grid-2 gap-xs mb-lg" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <div class="stat-card">
          <div class="stat-value" style="color:var(--color-green);">${correct}</div>
          <div class="stat-label">정답</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color:var(--color-rose);">${total - correct}</div>
          <div class="stat-label">오답</div>
        </div>
      </div>

      <!-- Wrong answers review -->
      ${answers.some(a => !a.correct) ? `
        <div class="section-title mb-sm">❌ 틀린 단어</div>
        ${answers.filter(a => !a.correct).map(a => `
          <div class="card mb-xs" style="border-left:3px solid var(--color-rose);">
            <div class="flex-between">
              <div>
                <div class="word-display" style="font-size:16px;">${a.word}</div>
                <div style="font-size:13px;color:var(--color-text-muted);margin-top:2px;">${a.meaning}</div>
              </div>
              <button class="btn-icon sm" onclick="SpeechService.speak('${a.word}')">🔊</button>
            </div>
            ${a.example ? `<div style="font-size:12px;color:var(--color-text-hint);margin-top:6px;font-family:var(--font-en);">📌 ${a.example}</div>` : ''}
          </div>
        `).join('')}
      ` : ''}

      <!-- Action buttons -->
      <div style="margin-top:16px;display:flex;gap:8px;">
        <button class="btn btn-outline btn-block" onclick="QuizPage.restart()">🔄 다시 풀기</button>
        <button class="btn btn-primary btn-block" onclick="QuizPage.exitQuiz()">✅ 완료</button>
      </div>
    `;
  }

  // === Config setters ===
  function setConfig(key, value) {
    quizConfig[key] = value;
    render();
  }

  function toggleType(typeId) {
    const idx = quizConfig.types.indexOf(typeId);
    if (idx >= 0) {
      if (quizConfig.types.length > 1) {
        quizConfig.types.splice(idx, 1);
      } else {
        Toast.warning('최소 1개 유형을 선택해주세요');
      }
    } else {
      quizConfig.types.push(typeId);
    }
  }

  function toggleHint() {
    quizConfig.showHint = !quizConfig.showHint;
  }

  // === Quiz lifecycle ===
  async function startQuiz() {
    if (quizConfig.types.length === 0) {
      Toast.warning('문제 유형을 선택해주세요');
      return;
    }

    let words;
    if (quizConfig.scope === 'unmastered') words = await DB.getUnmasteredWords();
    else if (quizConfig.scope === 'half') words = await DB.getHalfMasteredWords();
    else if (quizConfig.scope === 'favorites') words = await DB.getFavoriteWords();
    else words = await DB.getAllWords();

    if (words.length < 2) {
      Toast.warning('퀴즈를 풀려면 최소 2개 단어가 필요해요');
      return;
    }

    const shuffled = Utils.shuffle(words);
    const selected = shuffled.slice(0, Math.min(quizConfig.count, shuffled.length));
    const allWords = words; // full pool for generating distractors

    questions = selected.map(w => {
      const type = quizConfig.types[Math.floor(Math.random() * quizConfig.types.length)];
      return generateQuestion(w, type, allWords);
    });

    // Store word ID map for mastery updates
    wordIdMap = {};
    selected.forEach(w => { wordIdMap[w.word.toLowerCase()] = w.id; });

    currentIndex = 0;
    answers = [];
    quizState = 'playing';
    render();
  }

  function generateQuestion(word, type, allWords) {
    const base = {
      word: word.word,
      meaning: word.meaning,
      pos: word.pos,
      pronunciation: word.pronunciation,
      example: word.example || '',
      exampleMeaning: word.exampleMeaning || '',
      type,
      correctAnswer: type === 'meaning' ? word.meaning : type === 'reverse' ? word.word : word.word,
    };

    if (type === 'meaning') {
      // Generate 4 options (1 correct + 3 distractors)
      const distractors = allWords
        .filter(w => w.word !== word.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.meaning);
      const options = Utils.shuffle([word.meaning, ...distractors]);
      base.options = options;
      base.correctIndex = options.indexOf(word.meaning);
    } else if (type === 'reverse') {
      const distractors = allWords
        .filter(w => w.word !== word.word)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.word);
      const options = Utils.shuffle([word.word, ...distractors]);
      base.options = options;
      base.correctIndex = options.indexOf(word.word);
    }

    return base;
  }

  function answerMC(idx) {
    const q = questions[currentIndex];
    const correct = idx === q.correctIndex;

    // Visual feedback
    const btn = document.getElementById(`opt-${idx}`);
    const correctBtn = document.getElementById(`opt-${q.correctIndex}`);

    if (correct) {
      if (btn) btn.style.cssText += ';background:var(--color-green-light);border-color:var(--color-green);';
    } else {
      if (btn) btn.style.cssText += ';background:var(--color-rose-light);border-color:var(--color-rose);';
      if (correctBtn) correctBtn.style.cssText += ';background:var(--color-green-light);border-color:var(--color-green);';
    }

    Utils.vibrate(correct ? 10 : 50);

    answers.push({
      word: q.word,
      meaning: q.meaning,
      example: q.example,
      correct,
      userAnswer: q.options[idx],
    });

    // Reset mastery on wrong answer
    if (!correct) {
      const wId = wordIdMap[q.word.toLowerCase()];
      if (wId) DB.setMastered(wId, 0);
    }

    // Disable all buttons
    document.querySelectorAll('[id^="opt-"]').forEach(b => {
      b.style.pointerEvents = 'none';
    });

    setTimeout(() => {
      currentIndex++;
      if (currentIndex >= questions.length) {
        quizState = 'result';
        saveQuizResult();
      }
      render();
    }, correct ? 600 : 1200);
  }

  function answerSpelling() {
    const input = document.getElementById('spelling-input');
    const userAnswer = input?.value?.trim().toLowerCase() || '';
    const q = questions[currentIndex];
    const correct = userAnswer === q.word.toLowerCase();

    Utils.vibrate(correct ? 10 : 50);

    if (correct) {
      Toast.success('정답! 🎉');
    } else {
      Toast.error(`오답! 정답: ${q.word}`);
    }

    answers.push({
      word: q.word,
      meaning: q.meaning,
      example: q.example,
      correct,
      userAnswer,
    });

    // Reset mastery on wrong answer
    if (!correct) {
      const wId = wordIdMap[q.word.toLowerCase()];
      if (wId) DB.setMastered(wId, 0);
    }

    setTimeout(() => {
      currentIndex++;
      if (currentIndex >= questions.length) {
        quizState = 'result';
        saveQuizResult();
      }
      render();
    }, correct ? 600 : 1500);
  }

  async function saveQuizResult() {
    const correct = answers.filter(a => a.correct).length;
    await DB.addQuizResult({
      total: answers.length,
      correct,
      types: quizConfig.types.join(','),
      scope: quizConfig.scope,
      answers: answers.map(a => ({
        word: a.word,
        meaning: a.meaning,
        correct: a.correct,
        userAnswer: a.userAnswer || null,
      })),
    });
    await DB.updateTodayStats({ wordsReviewed: answers.length });
  }

  function restart() {
    quizState = 'setup';
    render();
  }

  function exitQuiz() {
    quizState = 'setup';
    Router.navigate('/vocabulary');
  }

  return { render, setConfig, toggleType, toggleHint, startQuiz, answerMC, answerSpelling, restart, exitQuiz };
})();
