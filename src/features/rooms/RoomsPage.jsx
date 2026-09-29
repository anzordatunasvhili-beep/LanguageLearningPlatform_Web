import { useEffect, useRef, useState } from 'react';
import { Card, Button, PageHeader, Badge, EmptyState } from '../../components/ui/index.jsx';
import { roomService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import '../learning/catalog.css';
function RoomChat({ room, onClose }) {
  const [messages, setMessages] = useState([]),
    [body, setBody] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    let request = 0;
    const load = async () => {
      const revision = ++request;
      try {
        const next = await roomService.feed(room.id);
        if (active.current && revision === request) {
          setMessages(next);
          setError('');
        }
      } catch (e) {
        if (active.current) setError(e.message);
      }
    };
    load();
    const timer = setInterval(() => {
      if (!document.hidden) load();
    }, 8000);
    return () => {
      active.current = false;
      request++;
      clearInterval(timer);
    };
  }, [room.id]);
  async function send(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const next = await roomService.send(room.id, body);
      if (active.current) {
        setMessages(next);
        setBody('');
      }
    } catch (e) {
      if (active.current) setError(e.message);
    } finally {
      if (active.current) setBusy(false);
    }
  }
  return (
    <Card className="page-stack">
      <div className="section-heading">
        <h2>{room.name}</h2>
        <Button variant="secondary" onClick={onClose}>
          Close chat
        </Button>
      </div>
      <div className="room-chat-log" aria-label="Room messages">
        {messages.map((m) => (
          <div className={'chat-message ' + (m.is_mine ? 'is-mine' : '')} key={m.id}>
            <strong>{m.display_name}</strong>
            <p>{m.body}</p>
            <small>{new Date(m.created_at).toLocaleTimeString()}</small>
          </div>
        ))}
        {!messages.length && <p className="muted">Start the conversation.</p>}
      </div>
      {error && (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      )}
      <form className="reply-form" onSubmit={send}>
        <label className="sr-only" htmlFor="room-message">
          Message
        </label>
        <input
          id="room-message"
          maxLength={2000}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          required
        />
        <Button type="submit" disabled={busy || !body.trim()}>
          {busy ? 'Sending…' : 'Send'}
        </Button>
      </form>
      <p className="small muted">Messages update every eight seconds while this page is open.</p>
    </Card>
  );
}
export default function RoomsPage() {
  const [selected, setSelected] = useState(null),
    [busy, setBusy] = useState(''),
    [error, setError] = useState('');
  const resource = useResource(
    async () => ({ rooms: await roomService.list(), members: await roomService.memberships() }),
    [],
  );
  async function membership(room, joined) {
    setBusy(room.id);
    setError('');
    try {
      if (joined) {
        await roomService.leave(room.id);
        setSelected(null);
      } else {
        await roomService.join(room.id);
        setSelected(room);
      }
      resource.reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="LEARN IN GOOD COMPANY"
        title="Find your study circle."
        description="Join a room and practice with other learners."
      />
      {error && (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      )}
      <ResourceState resource={resource}>
        {({ rooms, members }) => (
          <>
            <div className="catalog-grid">
              {rooms.map((room) => {
                const joined = members.some((m) => m.room_id === room.id);
                const textChat = ['text', 'study', 'game'].includes(room.kind);
                return (
                  <Card className="page-stack" key={room.id}>
                    <h2>{room.name}</h2>
                    <Badge>
                      {room.language?.name || 'All languages'} ·{' '}
                      {room.required_level || 'All levels'}
                    </Badge>
                    <p className="muted">
                      {room.kind} room · Capacity {room.capacity}
                    </p>
                    {textChat ? (
                      <div className="filter-row">
                        <Button
                          disabled={busy === room.id}
                          onClick={() => membership(room, joined)}
                        >
                          {joined ? 'Leave room' : 'Join room'}
                        </Button>
                        {joined && (
                          <Button variant="secondary" onClick={() => setSelected(room)}>
                            Open chat
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="muted">
                        This room requires a voice or event integration that has not been
                        configured.
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
            {!rooms.length && (
              <EmptyState
                title="No rooms published yet"
                description="Administrators can create text or study rooms in the content studio."
              />
            )}
          </>
        )}
      </ResourceState>
      {selected && <RoomChat key={selected.id} room={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
