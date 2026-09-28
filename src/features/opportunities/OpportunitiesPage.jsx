import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  Modal,
  PageHeader,
} from '../../components/ui/index.jsx';
import { opportunityService } from '../../services/catalogService.js';
import '../learning/catalog.css';

export default function OpportunitiesPage() {
  const [language, setLanguage] = useState('All languages');
  const [type, setType] = useState('All types');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const opportunities = opportunityService.list();
  const visible = opportunities.filter(
    (item) =>
      (language === 'All languages' || item.language === language) &&
      (type === 'All types' || item.type === type) &&
      `${item.title} ${item.country}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="BEYOND THE CLASSROOM"
        title="Where your words could take you."
        description="Imagine the places, people, and possibilities that open up with a new language."
        action={<Badge>Fictional listings</Badge>}
      />
      <div className="catalog-filters">
        <label className="field search-field">
          <span>Find an opportunity</span>
          <input
            type="search"
            placeholder="Search places and programs…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {['All languages', 'Japanese', 'Spanish', 'French'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Program type</span>
          <select value={type} onChange={(event) => setType(event.target.value)}>
            {['All types', ...new Set(opportunities.map((item) => item.type))].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="catalog-grid">
        {visible.map((item) => (
          <Card className="catalog-card" key={item.id}>
            <div className={`catalog-visual ${item.color}`}>
              <Icon name={item.icon} />
              <span className="catalog-visual-caption">{item.country.toUpperCase()}</span>
            </div>
            <div className="catalog-body">
              <div className="tag-row">
                <Badge>{item.type}</Badge>
                <span className="muted">{item.format}</span>
              </div>
              <h2>{item.title}</h2>
              <p className="catalog-meta">
                <Icon name="language" />
                {item.language} · {item.level}+
              </p>
              <p className="catalog-meta">
                <Icon name="schedule" />
                {item.duration}
              </p>
              <Button variant="secondary" onClick={() => setSelected(item)}>
                View sample details <Icon name="arrow_forward" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {!visible.length && (
        <EmptyState
          icon="travel_explore"
          title="No matches for this journey"
          description="Try a different language, program type, or search term."
        />
      )}
      <p className="catalog-disclaimer">
        Every listing is fictional and demonstrates the future catalog. Prices are illustrative.
        Applications, deadlines, and bookings are unavailable.
      </p>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Opportunity details'}
      >
        {selected && (
          <div className="page-stack">
            <Badge>Fictional example · No applications</Badge>
            <p>{selected.description}</p>
            <dl className="detail-facts">
              <div>
                <dt>Organization</dt>
                <dd>{selected.organization}</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd>{selected.country}</dd>
              </div>
              <div>
                <dt>Required level</dt>
                <dd>
                  {selected.language} {selected.level}+
                </dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{selected.duration}</dd>
              </div>
              <div>
                <dt>Cost</dt>
                <dd>{selected.cost}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{selected.format}</dd>
              </div>
            </dl>
            <div>
              <h3>Example itinerary</h3>
              <ol className="catalog-list">
                {selected.itinerary.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
