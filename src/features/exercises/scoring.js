export function normalizeAnswer(value) {
  return String(value).normalize('NFKC').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
}

export function gradeExercise(exercise, answer) {
  if (exercise.type === 'multiple_choice')
    return typeof answer === 'string' && answer === exercise.answer;
  if (exercise.type === 'typing')
    return (
      typeof answer === 'string' &&
      exercise.answers.some((accepted) => normalizeAnswer(accepted) === normalizeAnswer(answer))
    );
  if (exercise.type === 'word_order')
    return (
      Array.isArray(answer) &&
      answer.length === exercise.answer.length &&
      answer.every((word, index) => word === exercise.answer[index])
    );
  return false;
}

export function summarizeAttempts(attempts) {
  const correct = attempts.filter((attempt) => attempt.correct).length;
  return {
    correct,
    total: attempts.length,
    accuracy: attempts.length ? Math.round((correct / attempts.length) * 100) : 0,
  };
}
