// ============================================
// LalaWord SM-2 Spaced Repetition
// ============================================

const SpacedRepetition = (() => {

  async function processReview(wordId, quality) {
    // quality: 0-5
    let review = await DB.getReview(wordId);

    if (!review) {
      review = { wordId, repetitions: 0, interval: 1, ease: 2.5, nextReview: Utils.today() };
    }

    let { repetitions, interval, ease } = review;

    if (quality >= 3) {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * ease);
      repetitions++;
    } else {
      repetitions = 0;
      interval = 1;
    }

    ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (ease < 1.3) ease = 1.3;

    const nextReview = Utils.addDays(new Date(), interval);

    const updated = { wordId, repetitions, interval, ease, nextReview };
    await DB.setReview(updated);

    // Update mastered status
    if (repetitions >= 5 && interval >= 21) {
      await DB.setMastered(wordId, true);
    }

    await DB.updateTodayStats({ wordsReviewed: 1 });
    return updated;
  }

  async function getDueWords() {
    const dueReviews = await DB.getDueReviews();
    const words = [];
    for (const review of dueReviews) {
      try {
        const allWords = await DB.getAllWords();
        const word = allWords.find(w => w.id === review.wordId);
        if (word) words.push({ ...word, review });
      } catch (e) { /* skip */ }
    }
    return words;
  }

  async function getNewWordsForReview(count = 10) {
    const allWords = await DB.getAllWords();
    const reviews = [];
    for (const w of allWords) {
      const r = await DB.getReview(w.id);
      if (!r) reviews.push(w);
    }
    return Utils.shuffle(reviews).slice(0, count);
  }

  return { processReview, getDueWords, getNewWordsForReview };
})();
