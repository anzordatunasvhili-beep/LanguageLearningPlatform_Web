import { useState } from 'react';
import { Badge, Button, Card, Modal, PageHeader } from '../../components/ui/index.jsx';
import { pdfService } from '../../services/catalogService.js';
import '../learning/catalog.css';

export default function LibraryPage() {
  const [selected, setSelected] = useState(null);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="A QUIETER KIND OF PRACTICE"
        title="Your learning library."
        description="Thoughtfully structured materials, for the moments you want to slow down and go deeper."
        action={<Badge>Sample templates</Badge>}
      />
      <div className="catalog-grid">
        {pdfService.listTemplates().map((template) => (
          <Card className="library-card" key={template.id}>
            <div className="library-sheet">
              {template.name}
              <small>
                {template.language.toUpperCase()} · {template.level}
              </small>
            </div>
            <h2>{template.name}</h2>
            <p className="muted">
              {template.sections.length} sections · {template.questionCount} questions planned
            </p>
            <div className="tag-row">
              <Badge>{template.language}</Badge>
              <Badge>{template.level}</Badge>
            </div>
            <Button variant="secondary" onClick={() => setSelected(template)}>
              Preview structure
            </Button>
          </Card>
        ))}
      </div>
      <p className="catalog-disclaimer">
        These previews show educational template structures. AI generation and downloadable PDFs are
        not connected yet.
      </p>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.name || 'Template preview'}
      >
        {selected && (
          <div className="page-stack">
            <Badge>Structure preview · No generated content</Badge>
            <p>{selected.instructions}</p>
            <ol className="catalog-list">
              {selected.sections.map((section) => (
                <li key={section}>{section}</li>
              ))}
            </ol>
            <p className="muted">
              Designed for {selected.questionCount} questions at {selected.level} level. A future
              generation service will fill these sections with reviewed learning content.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
