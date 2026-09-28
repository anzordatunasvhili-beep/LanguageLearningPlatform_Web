import { useState } from 'react';
import { Badge, Button, Card, Icon, Modal, PageHeader } from '../../components/ui/index.jsx';
import { roomService } from '../../services/catalogService.js';
import '../learning/catalog.css';

export default function RoomsPage() {
  const [selected, setSelected] = useState(null);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="BETTER WITH COMPANY"
        title="Find your kind of conversation."
        description="A preview of the spaces where our learning community will come together."
        action={<Badge>Sample rooms</Badge>}
      />
      <div className="catalog-grid">
        {roomService.list().map((room) => (
          <Card key={room.id} className="room-card">
            <span className="catalog-emblem sage">
              <Icon name={room.icon} />
            </span>
            <Badge>{room.type}</Badge>
            <h2>{room.name}</h2>
            <p className="muted">{room.description}</p>
            <p className="catalog-meta">
              {room.language} · {room.level}
            </p>
            <Button variant="secondary" onClick={() => setSelected(room)}>
              Explore room
            </Button>
          </Card>
        ))}
      </div>
      <div className="notice">
        <Icon name="forum" />
        <p>
          Community rooms are a future feature. These sample spaces have no live members, chat,
          voice, or video.
        </p>
      </div>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Room details'}
      >
        {selected && (
          <div className="page-stack">
            <Badge>Planned community space</Badge>
            <p>{selected.description}</p>
            <p>
              <strong>Language:</strong> {selected.language}
              <br />
              <strong>Suggested level:</strong> {selected.level}
            </p>
            <div>
              <h3>A welcoming room for everyone</h3>
              <ul className="catalog-list">
                <li>Be patient with learners and invite everyone into the conversation.</li>
                <li>Ask before correcting and keep feedback kind.</li>
                <li>Keep personal contact details private.</li>
              </ul>
            </div>
            <p className="muted">
              Joining will become available when moderated community rooms launch.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
