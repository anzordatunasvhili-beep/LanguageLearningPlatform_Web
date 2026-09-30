import { useRef, useState } from 'react';
import CharacterPortrait from './CharacterPortrait.jsx';
import { createCharacter, cleanCharacter, exportCharacter } from './data/character.js';
import { EDITABLE_SLOTS, PARTS, SLOT_LABELS, PALETTES } from './data/parts.js';
import { EXPRESSIONS } from './data/expressions.js';
import { Button } from '../../../components/ui/index.jsx';

function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function CharacterCreator({
  initialCharacter = createCharacter(),
  onSave,
  storageLabel = 'Save portrait',
}) {
  const [character, setCharacter] = useState(() => cleanCharacter(initialCharacter));
  const [expression, setExpression] = useState('neutral');
  const [speaking, setSpeaking] = useState(false);
  const [guides, setGuides] = useState(false);
  const [compare, setCompare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const file = useRef(null);
  function change(group, key, value) {
    setCharacter((current) => ({ ...current, [group]: { ...current[group], [key]: value } }));
    setMessage('');
  }
  async function save() {
    setBusy(true);
    setError('');
    try {
      await onSave(cleanCharacter(character));
      setMessage('Portrait saved.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function importFile(event) {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    try {
      if (selected.size > 16384) throw new Error('Choose a portrait JSON file smaller than 16 KB.');
      setCharacter(cleanCharacter(JSON.parse(await selected.text())));
      setMessage('Portrait imported. Save to keep it.');
      setError('');
    } catch (e) {
      setError(e instanceof SyntaxError ? 'This file is not valid portrait JSON.' : e.message);
    }
  }
  return (
    <div className="portrait-creator">
      <section className="portrait-preview" aria-label="Portrait preview">
        <div className="portrait-preview-heading">
          <span className="eyebrow">YOUR CHARACTER</span>
          <span className="portrait-medium">Painted · 2D</span>
        </div>
        <CharacterPortrait
          character={character}
          expression={expression}
          speaking={speaking}
          guides={guides}
          name="Your character"
        />
        <div className="portrait-preview-controls">
          <div className="portrait-options-row" role="group" aria-label="Expression">
            {Object.keys(EXPRESSIONS).map((state) => (
              <button
                key={state}
                type="button"
                className="choice-button"
                aria-pressed={expression === state}
                onClick={() => setExpression(state)}
              >
                {state[0].toUpperCase() + state.slice(1)}
              </button>
            ))}
          </div>
          <div className="portrait-checks">
            <label>
              <input
                type="checkbox"
                checked={speaking}
                onChange={(e) => setSpeaking(e.target.checked)}
              />{' '}
              Speaking mouth
            </label>
            <label>
              <input
                type="checkbox"
                checked={guides}
                onChange={(e) => setGuides(e.target.checked)}
              />{' '}
              Alignment guides
            </label>
            <label>
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
              />{' '}
              Compare expressions
            </label>
          </div>
        </div>
      </section>
      <section className="portrait-editor" aria-label="Character parts">
        <h2>A face that feels like you.</h2>
        <p className="muted">
          Choose the features. Keep the same character through every expression.
        </p>
        <p className="muted small">
          Eyes, eyebrows and lips share one painted mesh rig. Expressions reshape those same parts.
        </p>
        <fieldset disabled={busy} className="portrait-editor-fields">
          <legend className="sr-only">Portrait features and colors</legend>
          {EDITABLE_SLOTS.map((slot) => (
            <fieldset className="portrait-part-field" key={slot}>
              <legend>{SLOT_LABELS[slot]}</legend>
              <div className="portrait-options-row">
                {PARTS[slot].map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    className="choice-button"
                    aria-pressed={character.parts[slot] === part.id}
                    onClick={() => change('parts', slot, part.id)}
                  >
                    {part.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="portrait-colors">
            {Object.entries(PALETTES).map(([key, colors]) => (
              <fieldset className="portrait-part-field" key={key}>
                <legend>
                  {key === 'brows' ? 'Eyebrow' : key[0].toUpperCase() + key.slice(1)} color
                </legend>
                <div className="portrait-options-row">
                  {colors.map((color, index) => (
                    <button
                      type="button"
                      className="portrait-swatch"
                      key={color}
                      style={{ backgroundColor: color }}
                      aria-label={`${key} color ${index + 1}`}
                      aria-pressed={character.colors[key] === color}
                      onClick={() => change('colors', key, color)}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label={`Custom ${key} color`}
                    value={character.colors[key]}
                    onChange={(e) => change('colors', key, e.target.value)}
                  />
                </div>
              </fieldset>
            ))}
          </div>
          <div className="portrait-actions">
            {onSave && <Button onClick={save}>{busy ? 'Saving…' : storageLabel}</Button>}
            <Button
              variant="secondary"
              onClick={() => download(exportCharacter(character), 'kotoba-portrait-v1.json')}
            >
              Export JSON
            </Button>
            <Button variant="ghost" onClick={() => file.current?.click()}>
              Import JSON
            </Button>
          </div>
          <input
            className="sr-only"
            ref={file}
            type="file"
            accept="application/json,.json"
            aria-label="Import portrait file"
            onChange={importFile}
          />
        </fieldset>
        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}
        <p role="status">{message}</p>
      </section>
      {compare && (
        <section className="portrait-comparison" aria-label="Expression comparison">
          {[...Object.keys(EXPRESSIONS), 'speaking'].map((state) => (
            <figure key={state}>
              <CharacterPortrait
                character={character}
                expression={state === 'speaking' ? expression : state}
                speaking={state === 'speaking'}
                name={state}
              />
              <figcaption>{state}</figcaption>
            </figure>
          ))}
        </section>
      )}
    </div>
  );
}
