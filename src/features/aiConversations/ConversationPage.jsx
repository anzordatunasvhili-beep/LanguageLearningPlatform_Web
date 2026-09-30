import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { characterService } from '../../services/catalogService.js';
import { aiService } from '../../services/aiService.js';
import { Button, Card, PageHeader } from '../../components/ui/index.jsx';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import CharacterRenderer from '../characters/CharacterRenderer.jsx';
function Conversation({ character, scenario }) {
  const [sessionId, setSessionId] = useState(null),
    [messages, setMessages] = useState([]),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function open(fresh = false) {
    setBusy(true);
    setError('');
    try {
      const id = await aiService.open(scenario.id, fresh);
      setSessionId(id);
      setMessages(await aiService.messages(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function send(e) {
    e.preventDefault();
    if (!message.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      await aiService.respond({ sessionId, message, requestId: crypto.randomUUID() });
      setMessage('');
      setMessages(await aiService.messages(sessionId));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-stack">
      <Link className="text-link" to={'/app/ai/characters/' + character.id}>
        Back to {character.name}
      </Link>
      <PageHeader
        eyebrow={character.language?.name + ' · ' + scenario.level}
        title={scenario.title}
        description={scenario.objective}
      />
      <Card className="conversation-portrait-card">
        <CharacterRenderer
          character={character}
          expression={scenario.scene?.emotion || 'neutral'}
        />
        <div>
          <h2>{character.name}</h2>
          <p>{character.presentation?.occupation || character.biography}</p>
          <p className="muted">
            {busy ? 'Listening and preparing a reply…' : 'Ready to practice with you.'}
          </p>
        </div>
      </Card>
      <Card>
        {!sessionId ? (
          <>
            <p>
              Continue your saved conversation or start a new one. Your messages are sent to the
              configured AI provider and saved to your account.
            </p>
            <Button disabled={busy} onClick={() => open(false)}>
              {busy ? 'Opening…' : 'Open conversation'}
            </Button>
          </>
        ) : (
          <>
            <div className="room-chat-log" aria-live="polite">
              {messages.length ? (
                messages.map((m) => (
                  <div key={m.id} className={'chat-message ' + (m.role === 'user' ? 'mine' : '')}>
                    <strong>{m.role === 'user' ? 'You' : character.name}</strong>
                    <p>{m.content}</p>
                  </div>
                ))
              ) : (
                <p>Say hello to start practicing with {character.name}.</p>
              )}
              {busy && <p role="status">Waiting for a reply…</p>}
            </div>
            <form className="reply-form" onSubmit={send}>
              <label className="sr-only" htmlFor="own-response">
                Your message
              </label>
              <input
                id="own-response"
                value={message}
                maxLength={1500}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message…"
                disabled={busy}
              />
              <Button type="submit" disabled={busy || !message.trim()}>
                Send
              </Button>
            </form>
            <Button variant="ghost" disabled={busy} onClick={() => open(true)}>
              New conversation
            </Button>
            <p className="muted small">
              AI replies may contain mistakes. Up to 30 replies per day. The model receives the
              latest 12 messages.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className="notice notice-error">
            {error}
          </p>
        )}
      </Card>
    </div>
  );
}
export default function ConversationPage() {
  const { characterId } = useParams();
  const [params] = useSearchParams();
  const selected = params.get('scenario');
  const resource = useResource(() => characterService.get(characterId), [characterId]);
  return (
    <ResourceState resource={resource}>
      {(character) => {
        const scenario = character?.scenarios.find(
          (s) => s.status === 'published' && (!selected || s.id === selected),
        );
        return scenario ? (
          <Conversation key={scenario.id} character={character} scenario={scenario} />
        ) : (
          <Card>Conversation unavailable. Choose a published scenario.</Card>
        );
      }}
    </ResourceState>
  );
}
