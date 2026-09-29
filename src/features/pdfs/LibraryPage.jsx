import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button, Card, PageHeader } from '../../components/ui/index.jsx';
import { pdfService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import '../learning/catalog.css';
export default function LibraryPage() {
  const resource = useResource(
    async () => ({
      templates: await pdfService.listTemplates(),
      materials: await pdfService.list(),
    }),
    [],
  );
  const [busy, setBusy] = useState(null),
    [error, setError] = useState('');
  const navigate = useNavigate();
  async function generate(id) {
    setBusy(id);
    setError('');
    try {
      const result = await pdfService.generate(id);
      navigate('/app/library/' + result.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="OFFLINE PRACTICE"
        title="Your learning library."
        description="Generate a workbook from published exercises, then print it or save it as a PDF."
      />
      {error && <p role="alert">{error}</p>}
      <ResourceState resource={resource}>
        {({ templates, materials }) => (
          <>
            <div className="catalog-grid">
              {templates.map((template) => (
                <Card key={template.id}>
                  <h2>{template.name}</h2>
                  <p>
                    {template.language?.name} · {template.level}
                  </p>
                  <p>{template.generation_rules.instructions}</p>
                  <Button disabled={Boolean(busy)} onClick={() => generate(template.id)}>
                    {busy === template.id ? 'Generating…' : 'Generate workbook'}
                  </Button>
                </Card>
              ))}
            </div>
            {!templates.length && <Card>No published workbook templates yet.</Card>}
            <h2>Your saved workbooks</h2>
            {materials.length ? (
              materials.map((m) => (
                <Card key={m.id}>
                  <Link className="text-link" to={'/app/library/' + m.id}>
                    {m.title}
                  </Link>
                  <p className="muted">
                    {new Date(m.created_at).toLocaleString()} · {m.status}
                  </p>
                </Card>
              ))
            ) : (
              <p>Generate your first workbook to start your library.</p>
            )}
          </>
        )}
      </ResourceState>
    </div>
  );
}
