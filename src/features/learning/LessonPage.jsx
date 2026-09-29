import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { Button, Card, Icon, PageHeader, ProgressBar } from '../../components/ui/index.jsx';
import { learningService } from '../../services/catalogService.js';
import { announceChange } from '../../services/platformService.js';
import ExerciseRenderer from '../exercises/ExerciseRenderer.jsx';
import './catalog.css';

export default function LessonPage() {
  const { lessonId } = useParams();
  const [params] = useSearchParams();
  const releaseId = params.get('release');
  const [run, setRun] = useState(null),
    [index, setIndex] = useState(0),
    [answer, setAnswer] = useState(''),
    [feedback, setFeedback] = useState(null),
    [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    setRun(null);
    setIndex(0);
    setAnswer('');
    setFeedback(null);
    setResult(null);
    setError('');
  }, [lessonId, releaseId]);
  useEffect(() => {
    if (!run || result) return;
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - new Date(run.startedAt).getTime()) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [run, result]);
  async function start() {
    setBusy(true);
    setError('');
    try {
      const next = await learningService.start(lessonId, releaseId);
      setRun(next);
      setIndex(0);
      setAnswer('');
      setFeedback(null);
      setResult(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const raw = run?.questions[index];
  const exercise = raw
    ? {
        ...raw.payload,
        id: raw.id,
        type:
          {
            translation: 'typing',
            fill_blank: 'typing',
            grammar_choice: 'multiple_choice',
            true_false: 'multiple_choice',
            sentence_builder: 'word_order',
          }[raw.type] || raw.type,
        prompt: raw.prompt,
      }
    : null;
  const ready =
    exercise?.type === 'word_order'
      ? Array.isArray(answer) && answer.length === exercise.tokens?.length
      : typeof answer === 'string' && answer.trim().length > 0;
  async function submit(event) {
    event.preventDefault();
    if (busy || !ready) return;
    setBusy(true);
    setError('');
    try {
      setFeedback(await learningService.answer(run.id, raw.id, answer));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function next() {
    if (index < run.questions.length - 1) {
      setIndex((i) => i + 1);
      setAnswer('');
      setFeedback(null);
      return;
    }
    setBusy(true);
    setError('');
    try {
      setResult(await learningService.finish(run.id));
      announceChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-stack practice-page">
      <Link to={releaseId ? '/app/games' : '/app/learn'} className="text-link">
        <Icon name="arrow_back" />
        Back to {releaseId ? 'games' : 'learning'}
      </Link>
      <PageHeader
        eyebrow={releaseId ? 'LANGUAGE CHALLENGE' : 'YOUR LEARNING JOURNEY'}
        title={run?.title || (releaseId ? 'Ready for a challenge?' : 'Ready to begin?')}
        description={
          !run
            ? 'Your answers are checked securely and your results are saved to your account.'
            : undefined
        }
      />
      {error && (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      )}
      {!run ? (
        <Card>
          <p>
            {releaseId
              ? 'Complete each challenge to earn points. Game XP is awarded once per game each day.'
              : 'Reach 80% accuracy to complete this lesson. XP is awarded once per lesson; you can review anytime.'}
          </p>
          <Button disabled={busy} onClick={start}>
            {busy ? 'Preparing…' : releaseId ? 'Start challenge' : 'Start lesson'}
          </Button>
        </Card>
      ) : result ? (
        <Card className="practice-complete">
          <Icon name={result.passed ? 'task_alt' : 'school'} />
          <h2>
            {releaseId
              ? 'Challenge complete!'
              : result.passed
                ? 'Lesson complete!'
                : 'Keep practicing.'}
          </h2>
          <div className="practice-score">
            {result.accuracy}
            <small>% accuracy</small>
          </div>
          <p>
            {result.correct} / {result.total} correct
            {releaseId ? ' · ' + result.score + ' points' : ''}
          </p>
          <p>
            {result.xp + result.bonusXp > 0
              ? 'You earned ' + (result.xp + result.bonusXp) + ' XP.'
              : 'Your result is saved. ' +
                (!result.passed && !releaseId
                  ? 'Reach 80% to earn this lesson’s XP.'
                  : 'This activity’s XP has already been awarded.')}
          </p>
          <Button onClick={start} disabled={busy}>
            Practice again
          </Button>
        </Card>
      ) : (
        <>
          <div className="section-heading">
            <span>
              Exercise {index + 1} / {run.questions.length}
            </span>
            {releaseId && (
              <span>
                <Icon name="timer" /> {elapsed}s
              </span>
            )}
          </div>
          <ProgressBar value={index} max={run.questions.length} label="Lesson progress" />
          <Card className={'exercise-card ' + (releaseId ? 'game-challenge' : '')}>
            <h2>{exercise.prompt}</h2>
            <form onSubmit={submit}>
              <ExerciseRenderer
                key={exercise.id}
                exercise={exercise}
                value={answer}
                onChange={setAnswer}
                disabled={busy || feedback !== null}
              />
              {feedback ? (
                <div
                  className={'answer-feedback ' + (feedback.correct ? 'correct' : 'incorrect')}
                  role="status"
                >
                  <strong>{feedback.correct ? 'You got it!' : 'A chance to learn.'}</strong>
                  <p>{feedback.explanation}</p>
                  <Button disabled={busy} onClick={next}>
                    {busy
                      ? 'Saving…'
                      : index === run.questions.length - 1
                        ? 'Finish and save'
                        : 'Continue'}
                  </Button>
                </div>
              ) : (
                <Button type="submit" disabled={busy || !ready}>
                  {busy ? 'Checking…' : 'Check answer'}
                </Button>
              )}
            </form>
          </Card>
        </>
      )}
    </div>
  );
}
