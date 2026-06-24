// ============================================
// LalaWord Quiz Engine
// ============================================

const QuizEngine = (() => {

  function generateMultipleChoice(words, count = 10) {
    const selected = Utils.shuffle(words).slice(0, count);
    return selected.map(word => {
      const others = words.filter(w => w.id !== word.id);
      const distractors = Utils.shuffle(others).slice(0, 3).map(w => w.meaning);
      const options = Utils.shuffle([word.meaning, ...distractors]);
      return {
        type: 'multiple-choice',
        word: word.word,
        wordId: word.id,
        correctAnswer: word.meaning,
        options,
        pronunciation: word.pronunciation,
      };
    });
  }

  function generateFillBlank(words, count = 10) {
    const selected = Utils.shuffle(words.filter(w => w.example)).slice(0, count);
    return selected.map(word => {
      const blank = word.example.replace(
        new RegExp(`\\b${word.word}\\b`, 'gi'),
        '_____'
      );
      return {
        type: 'fill-blank',
        word: word.word,
        wordId: word.id,
        correctAnswer: word.word,
        sentence: blank,
        meaning: word.meaning,
        hint: word.word.charAt(0) + '_'.repeat(word.word.length - 1),
      };
    });
  }

  function generateMatching(words, count = 6) {
    const selected = Utils.shuffle(words).slice(0, Math.min(count, words.length));
    return [{
      type: 'matching',
      pairs: selected.map(w => ({
        wordId: w.id,
        word: w.word,
        meaning: w.meaning,
      })),
      shuffledMeanings: Utils.shuffle(selected.map(w => ({ wordId: w.id, meaning: w.meaning }))),
    }];
  }

  function generateKoreanToEnglish(words, count = 10) {
    const selected = Utils.shuffle(words).slice(0, count);
    return selected.map(word => {
      const others = words.filter(w => w.id !== word.id);
      const distractors = Utils.shuffle(others).slice(0, 3).map(w => w.word);
      const options = Utils.shuffle([word.word, ...distractors]);
      return {
        type: 'korean-to-english',
        meaning: word.meaning,
        wordId: word.id,
        correctAnswer: word.word,
        options,
      };
    });
  }

  function checkAnswer(question, answer) {
    if (question.type === 'fill-blank') {
      return answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    }
    return answer === question.correctAnswer;
  }

  function calculateScore(results) {
    const total = results.length;
    const correct = results.filter(r => r.correct).length;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { total, correct, wrong: total - correct, rate };
  }

  async function generateQuiz(type = 'mixed', count = 10) {
    const words = await DB.getWordsForQuiz(count * 3); // Get extra for variety
    if (words.length < 4) return null; // Need at least 4 words for quiz

    switch (type) {
      case 'multiple-choice':
        return generateMultipleChoice(words, count);
      case 'fill-blank':
        return generateFillBlank(words, count);
      case 'matching':
        return generateMatching(words, Math.min(count, 8));
      case 'korean-to-english':
        return generateKoreanToEnglish(words, count);
      case 'mixed':
      default: {
        const mc = generateMultipleChoice(words, Math.ceil(count / 3));
        const fb = generateFillBlank(words, Math.ceil(count / 3));
        const kr = generateKoreanToEnglish(words, Math.ceil(count / 3));
        return Utils.shuffle([...mc, ...fb, ...kr]).slice(0, count);
      }
    }
  }

  return { generateQuiz, generateMultipleChoice, generateFillBlank, generateMatching, generateKoreanToEnglish, checkAnswer, calculateScore };
})();
