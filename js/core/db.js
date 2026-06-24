// ============================================
// LalaWord IndexedDB (Dexie.js) Database
// ============================================

const DB = (() => {
  let db = null;

  function init() {
    db = new Dexie('LalaWordDB');
    db.version(1).stores({
      scans: '++id, date, bookTitle, createdAt',
      words: '++id, word, level, favorite, mastered, scanId, addedAt',
      reviews: 'wordId, nextReview',
      dailyStats: 'date',
      quizResults: '++id, date, quizType',
      books: '++id, title, createdAt',
    });
    db.version(2).stores({
      scans: '++id, date, bookTitle, createdAt',
      words: '++id, word, level, favorite, mastered, scanId, listId, addedAt',
      reviews: 'wordId, nextReview',
      dailyStats: 'date',
      quizResults: '++id, date, quizType',
      books: '++id, title, createdAt',
      wordLists: '++id, name, createdAt',
    });
    return db;
  }

  // === Scans ===
  async function addScan(scan) {
    return db.scans.add({
      ...scan,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().slice(0, 10),
    });
  }

  async function getScans(limit = 20) {
    return db.scans.orderBy('createdAt').reverse().limit(limit).toArray();
  }

  async function getScanById(id) {
    return db.scans.get(id);
  }

  async function getScansByDate(date) {
    return db.scans.where('date').equals(date).toArray();
  }

  async function deleteScan(id) {
    await db.scans.delete(id);
    await db.words.where('scanId').equals(id).delete();
  }

  // === Words ===
  async function addWords(words) {
    const existing = await db.words.toArray();
    const existingSet = new Set(existing.map(w => w.word.toLowerCase()));
    const newWords = words.filter(w => !existingSet.has(w.word.toLowerCase()));
    if (newWords.length > 0) {
      await db.words.bulkAdd(newWords.map(w => ({
        ...w,
        favorite: w.favorite ?? 0,
        mastered: w.mastered ?? 0,
        listId: w.listId ?? null,
        addedAt: new Date().toISOString(),
      })));
    }
    return newWords.length;
  }

  async function getAllWords() {
    return db.words.orderBy('addedAt').reverse().toArray();
  }

  async function getWordsByLevel(level) {
    return db.words.where('level').equals(level).toArray();
  }

  async function getFavoriteWords() {
    return db.words.where('favorite').equals(1).toArray();
  }

  async function getUnmasteredWords() {
    return db.words.where('mastered').equals(0).toArray();
  }

  async function getHalfMasteredWords() {
    return db.words.where('mastered').equals(1).toArray();
  }

  async function getFullyMasteredWords() {
    return db.words.where('mastered').equals(2).toArray();
  }

  async function updateWord(id, changes) {
    return db.words.update(id, changes);
  }

  async function toggleFavorite(id) {
    const word = await db.words.get(id);
    if (word) {
      await db.words.update(id, { favorite: word.favorite ? 0 : 1 });
    }
  }

  async function cycleMastery(id) {
    const word = await db.words.get(id);
    if (word) {
      const next = ((word.mastered || 0) + 1) % 3; // 0→1→2→0
      await db.words.update(id, { mastered: next });
      return next;
    }
    return 0;
  }

  async function setMastered(id, mastered) {
    return db.words.update(id, { mastered });
  }

  async function getWordCount() {
    return db.words.count();
  }

  async function getMasteredCount() {
    // Count both half-mastered and fully-mastered
    const half = await db.words.where('mastered').equals(1).count();
    const full = await db.words.where('mastered').equals(2).count();
    return { half, full, total: half + full };
  }

  async function getWordsForQuiz(count = 10) {
    const words = await db.words.where('mastered').equals(0).toArray();
    return shuffleArray(words).slice(0, count);
  }

  async function searchWords(query) {
    const q = query.toLowerCase();
    const all = await db.words.toArray();
    return all.filter(w =>
      w.word.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q)
    );
  }

  async function deleteWord(id) {
    await db.words.delete(id);
    await db.reviews.delete(id);
  }

  async function getWordsByList(listId) {
    return db.words.where('listId').equals(listId).toArray();
  }

  async function moveWordsToList(wordIds, listId) {
    await db.transaction('rw', db.words, async () => {
      for (const id of wordIds) {
        await db.words.update(id, { listId });
      }
    });
  }

  // === Word Lists ===
  async function addWordList(name, icon = '📁') {
    return db.wordLists.add({ name, icon, createdAt: new Date().toISOString() });
  }

  async function getWordLists() {
    return db.wordLists.orderBy('createdAt').reverse().toArray();
  }

  async function updateWordList(id, changes) {
    return db.wordLists.update(id, changes);
  }

  async function deleteWordList(id) {
    await db.wordLists.delete(id);
    // Move words in this list back to "no list"
    const wordsInList = await db.words.where('listId').equals(id).toArray();
    for (const w of wordsInList) {
      await db.words.update(w.id, { listId: null });
    }
  }

  async function getWordListCount(listId) {
    return db.words.where('listId').equals(listId).count();
  }

  // === Reviews (SM-2) ===
  async function getReview(wordId) {
    return db.reviews.get(wordId);
  }

  async function setReview(review) {
    return db.reviews.put(review);
  }

  async function getDueReviews() {
    const today = new Date().toISOString().slice(0, 10);
    return db.reviews.where('nextReview').belowOrEqual(today).toArray();
  }

  // === Daily Stats ===
  async function getTodayStats() {
    const today = new Date().toISOString().slice(0, 10);
    let stats = await db.dailyStats.get(today);
    if (!stats) {
      stats = { date: today, wordsLearned: 0, wordsReviewed: 0, scanCount: 0, studyMinutes: 0 };
      await db.dailyStats.put(stats);
    }
    return stats;
  }

  async function updateTodayStats(changes) {
    const today = new Date().toISOString().slice(0, 10);
    let stats = await db.dailyStats.get(today);
    if (!stats) {
      stats = { date: today, wordsLearned: 0, wordsReviewed: 0, scanCount: 0, studyMinutes: 0 };
    }
    Object.keys(changes).forEach(k => {
      if (typeof changes[k] === 'number' && typeof stats[k] === 'number') {
        stats[k] += changes[k];
      } else {
        stats[k] = changes[k];
      }
    });
    return db.dailyStats.put(stats);
  }

  async function getStatsRange(startDate, endDate) {
    return db.dailyStats
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async function getStreak() {
    const stats = await db.dailyStats.orderBy('date').reverse().toArray();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < stats.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toISOString().slice(0, 10);
      if (stats[i].date === expectedStr && stats[i].wordsLearned > 0) {
        streak++;
      } else if (i === 0 && stats[i].date !== expectedStr) {
        // Today hasn't been recorded yet, check yesterday
        expected.setDate(expected.getDate() - 1);
        const yesterdayStr = expected.toISOString().slice(0, 10);
        if (stats[i].date === yesterdayStr && stats[i].wordsLearned > 0) {
          streak++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return streak;
  }

  // === Quiz Results ===
  async function addQuizResult(result) {
    return db.quizResults.add({
      ...result,
      date: new Date().toISOString().slice(0, 10),
    });
  }

  async function getQuizResults(limit = 20) {
    return db.quizResults.orderBy('id').reverse().limit(limit).toArray();
  }

  // === Books ===
  async function addBook(title) {
    const existing = await db.books.where('title').equals(title).first();
    if (existing) return existing.id;
    return db.books.add({ title, createdAt: new Date().toISOString() });
  }

  async function getBooks() {
    return db.books.orderBy('createdAt').reverse().toArray();
  }

  // === Export / Import ===
  async function exportAll() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      scans: await db.scans.toArray(),
      words: await db.words.toArray(),
      reviews: await db.reviews.toArray(),
      dailyStats: await db.dailyStats.toArray(),
      quizResults: await db.quizResults.toArray(),
      books: await db.books.toArray(),
      settings: localStorage.getItem('lalaword_settings'),
    };
  }

  async function importAll(data) {
    if (data.version !== 1) throw new Error('Unsupported data version');
    await db.transaction('rw', db.scans, db.words, db.reviews, db.dailyStats, db.quizResults, db.books, async () => {
      await db.scans.clear();
      await db.words.clear();
      await db.reviews.clear();
      await db.dailyStats.clear();
      await db.quizResults.clear();
      await db.books.clear();
      if (data.scans?.length) await db.scans.bulkAdd(data.scans);
      if (data.words?.length) await db.words.bulkAdd(data.words);
      if (data.reviews?.length) await db.reviews.bulkAdd(data.reviews);
      if (data.dailyStats?.length) await db.dailyStats.bulkAdd(data.dailyStats);
      if (data.quizResults?.length) await db.quizResults.bulkAdd(data.quizResults);
      if (data.books?.length) await db.books.bulkAdd(data.books);
    });
    if (data.settings) localStorage.setItem('lalaword_settings', data.settings);
  }

  async function clearAll() {
    await db.scans.clear();
    await db.words.clear();
    await db.reviews.clear();
    await db.dailyStats.clear();
    await db.quizResults.clear();
    await db.books.clear();
  }

  // Utility
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  return {
    init, addScan, getScans, getScanById, getScansByDate, deleteScan,
    addWords, getAllWords, getWordsByLevel, getFavoriteWords,
    getUnmasteredWords, getHalfMasteredWords, getFullyMasteredWords,
    updateWord, toggleFavorite, setMastered, cycleMastery, getWordCount, getMasteredCount,
    getWordsForQuiz, searchWords, deleteWord, getWordsByList, moveWordsToList,
    addWordList, getWordLists, updateWordList, deleteWordList, getWordListCount,
    getReview, setReview, getDueReviews,
    getTodayStats, updateTodayStats, getStatsRange, getStreak,
    addQuizResult, getQuizResults,
    addBook, getBooks,
    exportAll, importAll, clearAll,
  };
})();
