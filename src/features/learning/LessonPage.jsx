import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Badge, Button, Card, EmptyState, Icon, ProgressBar } from '../../components/ui/index.jsx';
import { learningService } from '../../services/catalogService.js';
import ExerciseRenderer from '../exercises/ExerciseRenderer.jsx';
import { gradeExercise, summarizeAttempts } from '../exercises/scoring.js';
import './catalog.css';

function LessonPractice({ lesson, exercises }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [complete, setComplete] = useState(false);
  const exercise = exercises[index];
  const ready =
    exercise.type === 'word_order'
      ? Array.isArray(answer) && answer.length === exercise.tokens.length
      : typeof answer === 'string' && answer.trim().length > 0;
  function checkAnswer(event) {
    event.preventDefault();
    if (!ready || feedback !== null) return;
    const correct = gradeExercise(exercise, answer);
    setFeedback(correct);
    setAttempts([...attempts, { exerciseId: exercise.id, correct }]);
  }
  function next() {
    if (index === exercises.length - 1) {
      setComplete(true);
      return;
    }
    setIndex(index + 1);
    setAnswer('');
    setFeedback(null);
  }
  function restart() {
    setIndex(0);
    setAnswer('');
    setFeedback(null);
    setAttempts([]);
    setComplete(false);
  }
  const summary = summarizeAttempts(attempts);
  return (
    <div className="page-stack practice-page">
      <Link to={`/app/course/${lesson.courseId}`} className="text-link">
        <Icon name="close" /> Back to course
      </Link>
      <div className="practice-heading">
        <div>
          <p className="eyebrow">LOCAL PRACTICE</p>
          <h1>{lesson.title}</h1>
        </div>
        <Badge>Sample lesson</Badge>
      </div>
      <ProgressBar
        value={complete ? exercises.length : index}
        max={exercises.length}
        label={`${complete ? exercises.length : index} of ${exercises.length} exercises completed`}
      />
      {complete ? (
        <Card className="practice-complete">
          <span className="completion-icon">
            <Icon name="task_alt" />
          </span>
          <p className="eyebrow">A SMALL STEP FORWARD</p>
          <h2>Practice complete.</h2>
          <p>
            You answered {summary.correct} of {summary.total} correctly. Every attempt is a chance
            to learn.
          </p>
          <div className="practice-score">
            {summary.accuracy}
            <small>% accuracy</small>
          </div>
          <p className="muted">
            This is a local practice result. It does not award XP or update your account.
          </p>
          <div className="tag-row">
            <Button onClick={restart}>Practice again</Button>
            <Link to={`/app/course/${lesson.courseId}`} className="button button-secondary">
              Back to course
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="exercise-card">
          <p className="eyebrow">
            EXERCISE {index + 1} / {exercises.length}
          </p>
          <h2>{exercise.prompt}</h2>
          <form onSubmit={checkAnswer}>
            <ExerciseRenderer
              key={exercise.id}
              exercise={exercise}
              value={answer}
              onChange={setAnswer}
              disabled={feedback !== null}
            />
            {exercise.hint && (
              <p id={`${exercise.id}-hint`} className="exercise-hint">
                <Icon name="lightbulb" />
                {exercise.hint}
              </p>
            )}
            {feedback !== null ? (
              <div
                className={`answer-feedback ${feedback ? 'correct' : 'incorrect'}`}
                role="status"
              >
                <strong>{feedback ? 'You got it.' : 'A good moment to learn.'}</strong>
                <p>{exercise.explanation}</p>
                <Button type="button" onClick={next}>
                  {index === exercises.length - 1 ? 'See your results' : 'Continue'}{' '}
                  <Icon name="arrow_forward" />
                </Button>
              </div>
            ) : (
              <Button type="submit" disabled={!ready}>
                Check answer <Icon name="arrow_forward" />
              </Button>
            )}
          </form>
        </Card>
      )}
    </div>
  );
}

export default function LessonPage() {
  const { lessonId } = useParams();
  const lesson = learningService.getLesson(lessonId);
  const exercises = learningService.getExercises(lessonId);
  if (!lesson || !exercises.length)
    return (
      <EmptyState
        icon="menu_book"
        title="This lesson is not available yet"
        description="Choose an available sample lesson from the Learn page."
      />
    );
  return <LessonPractice key={lesson.id} lesson={lesson} exercises={exercises} />;
}
