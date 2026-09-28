import { useState } from 'react';

function MultipleChoice({ exercise, value, onChange, disabled }) {
  return (
    <fieldset className="exercise-options">
      <legend className="sr-only">Choose an answer</legend>
      {exercise.options.map((option, index) => (
        <label
          className={`exercise-option ${value === option.id ? 'selected' : ''}`}
          key={option.id}
        >
          <input
            type="radio"
            name={exercise.id}
            value={option.id}
            checked={value === option.id}
            onChange={() => onChange(option.id)}
            disabled={disabled}
          />
          <span className="option-number">{index + 1}</span>
          <span>
            {option.text}
            {option.detail && <small>{option.detail}</small>}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function Typing({ exercise, value, onChange, disabled }) {
  return (
    <label className="field">
      <span>Your answer</span>
      <input
        autoComplete="off"
        spellCheck={false}
        placeholder="Type your answer…"
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-describedby={exercise.hint ? `${exercise.id}-hint` : undefined}
      />
    </label>
  );
}

function WordOrder({ exercise, onChange, disabled }) {
  const [selected, setSelected] = useState([]);
  function select(next) {
    setSelected(next);
    onChange(next.map((index) => exercise.tokens[index]));
  }
  return (
    <div className="word-builder">
      <p className="muted">Select words in order. Select a chosen word to put it back.</p>
      <div className="word-answer" aria-label="Your sentence">
        <span className="sr-only">Your sentence: </span>
        {selected.length ? (
          selected.map((tokenIndex, position) => (
            <button
              type="button"
              className="word-token selected"
              key={tokenIndex}
              disabled={disabled}
              onClick={() => select(selected.filter((_, index) => index !== position))}
              aria-label={`Remove ${exercise.tokens[tokenIndex]}`}
            >
              {exercise.tokens[tokenIndex]}
            </button>
          ))
        ) : (
          <span className="muted">Build your sentence here</span>
        )}
      </div>
      <div className="word-bank" aria-label="Available words">
        {exercise.tokens.map((token, index) => (
          <button
            type="button"
            className="word-token"
            key={index}
            disabled={disabled || selected.includes(index)}
            onClick={() => select([...selected, index])}
          >
            {token}
          </button>
        ))}
      </div>
    </div>
  );
}

const renderers = { multiple_choice: MultipleChoice, typing: Typing, word_order: WordOrder };

export default function ExerciseRenderer(props) {
  const Renderer = renderers[props.exercise.type];
  if (!Renderer) return <p role="status">This exercise type is not available in practice yet.</p>;
  return <Renderer {...props} />;
}
