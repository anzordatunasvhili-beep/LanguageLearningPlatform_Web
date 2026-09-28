import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeExercise, summarizeAttempts } from '../src/features/exercises/scoring.js';

test('typing accepts normalized whitespace and case but preserves meaningful accents', () => {
  const exercise = { type: 'typing', answers: ['Thank you', 'café'] };
  assert.equal(gradeExercise(exercise, '  THANK   you '), true);
  assert.equal(gradeExercise(exercise, 'cafe'), false);
  assert.equal(gradeExercise(exercise, ''), false);
  assert.equal(gradeExercise(exercise, ['Thank you']), false);
});
test('multiple choice checks IDs, not presentation text', () => {
  const exercise = { type: 'multiple_choice', answer: 'b' };
  assert.equal(gradeExercise(exercise, 'b'), true);
  assert.equal(gradeExercise(exercise, 'a'), false);
});
test('word order needs every word in order, including duplicate words', () => {
  const exercise = { type: 'word_order', answer: ['I', 'think', 'I', 'can'] };
  assert.equal(gradeExercise(exercise, ['I', 'think', 'I', 'can']), true);
  assert.equal(gradeExercise(exercise, ['I', 'think', 'can']), false);
  assert.equal(gradeExercise(exercise, ['think', 'I', 'I', 'can']), false);
});
test('practice summary does not create progression or produce NaN on empty attempts', () => {
  assert.deepEqual(summarizeAttempts([]), { correct: 0, total: 0, accuracy: 0 });
  assert.deepEqual(summarizeAttempts([{ correct: true }, { correct: false }, { correct: true }]), {
    correct: 2,
    total: 3,
    accuracy: 67,
  });
});
