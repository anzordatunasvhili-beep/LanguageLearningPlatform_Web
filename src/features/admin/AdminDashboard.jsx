import { useState } from 'react';
import { Link } from 'react-router';
import { Badge, Card, Modal, PageHeader } from '../../components/ui/index.jsx';
import {
  learningService,
  gameService,
  pdfService,
  opportunityService,
} from '../../services/catalogService.js';
import DataTable from './DataTable.jsx';
import '../learning/catalog.css';

export default function AdminDashboard() {
  const [selected, setSelected] = useState(null);
  const courses = learningService.listCourses();
  const games = gameService.list();
  const templates = pdfService.listTemplates();
  const opportunities = opportunityService.list();
  const rows = [
    ...courses.map((item) => ({
      id: item.id,
      name: item.title,
      type: 'Course',
      status: item.status,
      description: item.description,
      to: `/app/course/${item.id}`,
    })),
    ...games.map((item) => ({
      id: item.id,
      name: item.name,
      type: 'Game',
      status: item.status,
      description: item.description,
      to: `/app/games/${item.id}`,
    })),
    ...templates.map((item) => ({
      id: item.id,
      name: item.name,
      type: 'PDF template',
      status: item.status,
      description: item.instructions,
      to: '/admin/pdf-templates',
    })),
    ...opportunities.map((item) => ({
      id: item.id,
      name: item.title,
      type: 'Opportunity',
      status: 'draft',
      description: item.description,
      to: '/app/opportunities',
    })),
  ];
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="PLATFORM STUDIO"
        title="Create the next chapter."
        description="Explore the sample content catalog and shape structured learning templates."
        action={<Badge>Read-only sample catalog</Badge>}
      />
      <div className="stat-grid">
        {[
          { title: 'Courses', count: courses.length },
          { title: 'Game concepts', count: games.length },
          { title: 'PDF templates', count: templates.length },
        ].map((stat) => (
          <Card className="admin-stat" key={stat.title}>
            <span className="eyebrow">{stat.title.toUpperCase()}</span>
            <strong>{stat.count}</strong>
            <span className="muted">Sample records</span>
          </Card>
        ))}
      </div>
      <Card>
        <div className="section-heading">
          <h2>Content catalog</h2>
          <Link className="text-link" to="/admin/pdf-templates">
            Open template studio
          </Link>
        </div>
        <DataTable rows={rows} onInspect={setSelected} />
      </Card>
      <p className="catalog-disclaimer">
        This catalog uses local fixtures. Live content publication, user management, and moderation
        are not connected.
      </p>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Content details'}
      >
        {selected && (
          <div className="page-stack">
            <div className="tag-row">
              <Badge>{selected.type}</Badge>
              <Badge>{selected.status}</Badge>
            </div>
            <p>{selected.description}</p>
            <p className="muted">
              This is a sample record. Inspecting it does not publish or change live content.
            </p>
            <Link className="button button-secondary" to={selected.to}>
              Open preview
            </Link>
          </div>
        )}
      </Modal>
    </div>
  );
}
