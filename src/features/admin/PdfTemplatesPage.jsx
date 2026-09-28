import { useState } from 'react';
import { Badge, Button, Card, PageHeader } from '../../components/ui/index.jsx';
import { pdfService } from '../../services/catalogService.js';
import '../learning/catalog.css';

const sectionOptions = [
  'Theory',
  'Examples',
  'Vocabulary exercises',
  'Fill in the blank',
  'Grammar',
  'Sentence construction',
  'Translation',
  'Mini test',
  'Answer sheet',
];
const copyTemplate = (template) => ({ ...template, sections: [...template.sections] });

export default function PdfTemplatesPage() {
  const [templates, setTemplates] = useState(() => pdfService.listTemplates().map(copyTemplate));
  const [draft, setDraft] = useState(() => copyTemplate(pdfService.listTemplates()[0]));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  function update(key, value) {
    setDraft({ ...draft, [key]: value });
    setMessage('');
    setError('');
  }
  function selectTemplate(id) {
    setDraft(copyTemplate(templates.find((template) => template.id === id)));
    setMessage('');
    setError('');
  }
  function addTemplate() {
    const next = {
      id: crypto.randomUUID(),
      name: 'Untitled template',
      language: 'Japanese',
      level: 'A1',
      sections: ['Theory', 'Examples', 'Answer sheet'],
      questionCount: 10,
      instructions: '',
      status: 'draft',
    };
    setTemplates([...templates, next]);
    setDraft(copyTemplate(next));
    setMessage('');
    setError('');
  }
  function toggleSection(section) {
    const selected = draft.sections.includes(section)
      ? draft.sections.filter((item) => item !== section)
      : [...draft.sections, section];
    update(
      'sections',
      sectionOptions.filter((item) => selected.includes(item)),
    );
  }
  function save(event) {
    event.preventDefault();
    const validation = pdfService.validateTemplate(draft);
    if (validation) {
      setError(validation);
      return;
    }
    setTemplates(
      templates.map((template) =>
        template.id === draft.id
          ? copyTemplate({ ...draft, questionCount: Number(draft.questionCount) })
          : template,
      ),
    );
    setMessage('Draft saved for this page session. No content was generated or published.');
    setError('');
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="MATERIAL DESIGN STUDIO"
        title="Good learning starts with structure."
        description="Define the sections, level, and learning rules before any content is generated."
        action={
          <Button variant="secondary" onClick={addTemplate}>
            New session template
          </Button>
        }
      />
      <div className="notice">
        <p>
          This editor uses session drafts. Changes reset when you leave or refresh. The preview
          shows structure, not generated questions or a downloadable PDF.
        </p>
      </div>
      <div className="template-workspace">
        <Card>
          <form className="template-editor" onSubmit={save}>
            <label className="field">
              <span>Working template</span>
              <select value={draft.id} onChange={(event) => selectTemplate(event.target.value)}>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Template name</span>
              <input
                required
                maxLength={100}
                value={draft.name}
                onChange={(event) => update('name', event.target.value)}
              />
            </label>
            <div className="catalog-filters">
              <label className="field">
                <span>Target language</span>
                <select
                  value={draft.language}
                  onChange={(event) => update('language', event.target.value)}
                >
                  {['Japanese', 'Spanish', 'French'].map((language) => (
                    <option key={language}>{language}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Level</span>
                <select
                  value={draft.level}
                  onChange={(event) => update('level', event.target.value)}
                >
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset className="template-sections">
              <legend>Sections in teaching order</legend>
              {sectionOptions.map((section) => (
                <label className="inline-check" key={section}>
                  <input
                    type="checkbox"
                    checked={draft.sections.includes(section)}
                    onChange={() => toggleSection(section)}
                  />
                  {section}
                </label>
              ))}
            </fieldset>
            <label className="field">
              <span>Total questions</span>
              <input
                type="number"
                min={1}
                max={50}
                step={1}
                required
                value={draft.questionCount}
                onChange={(event) => update('questionCount', event.target.value)}
              />
            </label>
            <label className="field">
              <span>Educational instructions and generation rules</span>
              <textarea
                rows={4}
                maxLength={2000}
                required
                value={draft.instructions}
                onChange={(event) => update('instructions', event.target.value)}
                placeholder="Describe vocabulary limits, question style, and answer behavior…"
              />
            </label>
            {error && (
              <p className="form-message error" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="form-message" role="status">
                {message}
              </p>
            )}
            <div>
              <Button type="submit">Save session draft</Button>
            </div>
          </form>
        </Card>
        <div className="page-stack">
          <div className="section-heading">
            <h2>Structure preview</h2>
            <Badge>Live preview</Badge>
          </div>
          <Card className="template-preview">
            <p className="eyebrow">KOTOBA · LEARNING NOTES</p>
            <h2>{draft.name || 'Untitled template'}</h2>
            <div className="tag-row">
              {draft.language} · {draft.level} · {draft.questionCount || 0} planned questions
            </div>
            <p className="preview-placeholder">
              {draft.instructions || 'Your learning instructions will appear here.'}
            </p>
            {draft.sections.map((section, index) => (
              <div key={section}>
                <h3>
                  {String(index + 1).padStart(2, '0')} / {section}
                </h3>
                <p className="preview-placeholder">
                  Content for this section will be created in a future generation step.
                </p>
                <div className="preview-line" />
              </div>
            ))}
            {!draft.sections.length && (
              <p className="preview-placeholder">
                Choose a section to begin shaping this material.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
