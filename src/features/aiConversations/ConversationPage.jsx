import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { characters } from '../../data/characters.js';
import CharacterRenderer from '../characters/CharacterRenderer.jsx';
import { aiService } from '../../services/aiService.js';
import { Button, EmptyState, Icon } from '../../components/ui/index.jsx';

function Conversation({ character }) {
  const initial = {
    text: character.greeting,
    translation: character.translation,
    emotion: 'neutral',
    options:
      character.id === 'haruka'
        ? ['はい、初めてです！', 'おすすめは何ですか？']
        : character.id === 'mateo'
          ? ['¡Muy bien, gracias!', 'Bien, ¿y tú?']
          : ['Oui, un livre facile.', 'Bonjour ! Je m’appelle Alex.'],
  };
  const [line, setLine] = useState(initial);
  const [turn, setTurn] = useState(0);
  const [translation, setTranslation] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastReply, setLastReply] = useState('');
  async function reply(value) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await aiService.respond({ characterId: character.id, turn, message: value });
      setLine(result);
      setTurn((t) => t + 1);
      setLastReply(value);
      setMessage('');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-stack">
      <div className="section-heading">
        <Link className="text-link" to={`/app/ai/characters/${character.id}`}>
          <Icon name="arrow_back" /> Back to {character.name}
        </Link>
        <span className="badge">Scripted scene · {Math.min(turn + 1, 4)} / 4</span>
      </div>
      <section className="conversation-scene">
        <div className="scene-window">
          <span className="scene-sun" />
          <div className="scene-city" />
        </div>
        <div className="scene-caption">
          <span className="eyebrow">{character.city.toUpperCase()} · A SMALL BEGINNING</span>
          <h1>{character.scene}</h1>
        </div>
        <div className="scene-character">
          <CharacterRenderer
            appearance={character.appearance}
            name={character.name}
            emotion={line.emotion}
          />
        </div>
        <div className="scene-table" />
        <div className="dialogue-panel">
          <div className="section-heading">
            <p className="eyebrow">
              {character.name} <span>· {character.language}</span>
            </p>
            <Button
              variant="ghost"
              aria-pressed={translation}
              onClick={() => setTranslation((v) => !v)}
            >
              <Icon name="translate" />
              Translation
            </Button>
          </div>
          <div aria-live="polite">
            <p className="dialogue-text">{line.text}</p>
            {translation && <p className="muted">{line.translation}</p>}
          </div>
        </div>
      </section>
      <div className="conversation-controls">
        {lastReply && <p className="last-reply">You: {lastReply}</p>}
        {line.options.length ? (
          <>
            <p className="eyebrow">WHAT WILL YOU SAY?</p>
            <div className="response-options">
              {line.options.map((option) => (
                <Button
                  variant="secondary"
                  key={option}
                  disabled={busy}
                  onClick={() => reply(option)}
                >
                  {option}
                  <Icon name="arrow_forward" />
                </Button>
              ))}
            </div>
            <form
              className="reply-form"
              onSubmit={(event) => {
                event.preventDefault();
                reply(message);
              }}
            >
              <label className="sr-only" htmlFor="own-response">
                Write your own response
              </label>
              <input
                id="own-response"
                value={message}
                maxLength={500}
                placeholder="Or write your own response…"
                onChange={(event) => setMessage(event.target.value)}
              />
              <Button type="submit" disabled={busy || !message.trim()} aria-label="Send response">
                <Icon name="send" />
              </Button>
            </form>
          </>
        ) : (
          <div className="scene-complete">
            <Icon name="check_circle" />
            <div>
              <h2>A lovely first conversation.</h2>
              <p className="muted">You’ve reached the end of this sample scene.</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setLine(initial);
                setTurn(0);
                setLastReply('');
                setTranslation(false);
              }}
            >
              Try again
            </Button>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        <p className="muted small">
          This scene uses fixed sample replies, including after typed messages. Responses are not
          graded or saved.
        </p>
      </div>
    </div>
  );
}
export default function ConversationPage() {
  const { characterId } = useParams();
  const character = characters.find((item) => item.id === characterId);
  return character ? (
    <Conversation key={character.id} character={character} />
  ) : (
    <EmptyState title="Scene not found" description="Choose a character to begin a sample scene." />
  );
}
