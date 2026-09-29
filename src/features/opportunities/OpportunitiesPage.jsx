import { useState } from 'react';
import { Card, Button, PageHeader, Badge, Modal, EmptyState } from '../../components/ui/index.jsx';
import { opportunityService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import '../learning/catalog.css';
export default function OpportunitiesPage() {
  const [search, setSearch] = useState(''),
    [type, setType] = useState('all'),
    [selected, setSelected] = useState(null);
  const resource = useResource(opportunityService.list, []);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="BEYOND THE CLASSROOM"
        title="Where your words could take you."
        description="Discover opportunities published by your platform’s administrators."
      />
      <ResourceState resource={resource}>
        {(items) => {
          const visible = items.filter(
            (o) =>
              (type === 'all' || o.type === type) &&
              (o.title + ' ' + o.country + ' ' + o.language?.name)
                .toLowerCase()
                .includes(search.toLowerCase()),
          );
          return (
            <>
              <div className="catalog-filters">
                <label className="field search-field">
                  Search
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Country, language, or program"
                  />
                </label>
                <label className="field">
                  Program type
                  <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="all">All types</option>
                    {[...new Set(items.map((o) => o.type))].map((t) => (
                      <option key={t} value={t}>
                        {t.replaceAll('_', ' ')}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="catalog-grid">
                {visible.map((item) => (
                  <Card className="catalog-body" key={item.id}>
                    <Badge>{item.type.replaceAll('_', ' ')}</Badge>
                    <h2>{item.title}</h2>
                    <p>
                      {item.country} · {item.language?.name}
                    </p>
                    <p className="muted">{item.description}</p>
                    {item.deadline && <p>Deadline: {item.deadline}</p>}
                    <Button variant="secondary" onClick={() => setSelected(item)}>
                      View details
                    </Button>
                  </Card>
                ))}
              </div>
              {!visible.length && (
                <EmptyState
                  title="No opportunities found"
                  description="There are no published listings matching your search yet."
                />
              )}
            </>
          );
        }}
      </ResourceState>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Opportunity'}
      >
        {selected && (
          <div className="page-stack">
            <p>{selected.description}</p>
            <p>Language requirement: {selected.required_level || 'Not specified'}</p>
            <p>Format: {selected.delivery.replaceAll('_', ' ')}</p>
            {selected.price_amount != null && (
              <p>
                {new Intl.NumberFormat(undefined, {
                  style: 'currency',
                  currency: selected.currency,
                }).format(selected.price_amount)}
              </p>
            )}
            {Array.isArray(selected.details.itinerary) && (
              <ol className="catalog-list">
                {selected.details.itinerary.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            )}
            {selected.source_url?.startsWith('https://') ? (
              <a
                className="button button-primary"
                href={selected.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit program website
              </a>
            ) : (
              <p className="muted">No application website has been provided.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
