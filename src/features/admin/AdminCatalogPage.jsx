import { useState } from 'react';
import { useParams } from 'react-router';
import { Card, Button, PageHeader, Modal, EmptyState, Badge } from '../../components/ui/index.jsx';
import { adminResources } from './resources.js';
import { client, unwrap, perform, announceChange } from '../../services/platformService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import '../learning/catalog.css';

function fieldsForRow(config, row = {}) {
  return Object.fromEntries(
    config.fields.map((field) => [
      field.key,
      field.type === 'json'
        ? JSON.stringify(row[field.key] ?? field.default ?? {}, null, 2)
        : (row[field.key] ?? field.default ?? (field.type === 'checkbox' ? false : '')),
    ]),
  );
}
function ContentEditor({ config, row, relations, onSaved }) {
  const [draft, setDraft] = useState(() => fieldsForRow(config, row || {}));
  const [answerKey, setAnswerKey] = useState(
      JSON.stringify(row?._solution || { answer: 'a' }, null, 2),
    ),
    [explanation, setExplanation] = useState(row?._explanation || '');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const immutable = config.versioned && row && row.status !== 'draft';
  function change(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = Object.fromEntries(
        config.fields.map((field) => {
          const value = draft[field.key];
          return [
            field.key,
            field.type === 'json'
              ? JSON.parse(value)
              : field.type === 'number'
                ? value === ''
                  ? null
                  : Number(value)
                : field.optional && value === ''
                  ? null
                  : value,
          ];
        }),
      );
      if (
        payload.requirement &&
        (!Number.isInteger(payload.requirement.target) ||
          payload.requirement.target < 1 ||
          payload.requirement.target > 1000000)
      )
        throw new Error('Requirement target must be a positive integer no greater than 1,000,000.');
      if (config.table === 'exercises')
        await perform('save_exercise', {
          exercise: { ...payload, ...(row?.id ? { id: row.id } : {}) },
          solution: JSON.parse(answerKey),
          explanation,
        });
      else if (row?.id)
        await unwrap(
          client()
            .from(config.table)
            .update(immutable ? { status: payload.status } : payload)
            .eq('id', row.id),
        );
      else await unwrap(client().from(config.table).insert(payload));
      announceChange();
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="page-stack" onSubmit={save}>
      {config.help && <p className="notice">{config.help}</p>}
      {immutable && (
        <p className="notice">
          This published version is immutable. You can archive it or close this dialog and create a
          new version.
        </p>
      )}
      {config.fields.map((field) => {
        const disabled = busy || (immutable && field.key !== 'status');
        if (field.type === 'checkbox')
          return (
            <label className="inline-check" key={field.key}>
              <input
                type="checkbox"
                aria-label={field.label}
                checked={!!draft[field.key]}
                disabled={disabled}
                onChange={(e) => change(field.key, e.target.checked)}
              />
              {field.label}
            </label>
          );
        return (
          <label className="field" key={field.key}>
            {field.label}
            {field.type === 'json' || field.type === 'textarea' ? (
              <textarea
                aria-label={field.label}
                rows={field.type === 'json' ? 7 : 4}
                value={draft[field.key]}
                disabled={disabled}
                required={!field.optional}
                onChange={(e) => change(field.key, e.target.value)}
                spellCheck={field.type !== 'json'}
              />
            ) : field.type === 'select' || field.type === 'relation' ? (
              <select
                aria-label={field.label}
                value={draft[field.key]}
                disabled={disabled}
                required={!field.optional}
                onChange={(e) => change(field.key, e.target.value)}
              >
                <option value="">{field.optional ? 'Not specified' : 'Choose…'}</option>
                {field.type === 'relation'
                  ? (relations[field.table] || []).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item[field.display]} ({item.id.slice(0, 8)})
                      </option>
                    ))
                  : field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
              </select>
            ) : (
              <input
                aria-label={field.label}
                type={field.type}
                value={draft[field.key]}
                disabled={disabled}
                required={!field.optional}
                min={field.min}
                max={field.max}
                step={field.step}
                maxLength={field.maxLength || 300}
                pattern={field.pattern}
                onChange={(e) => change(field.key, e.target.value)}
              />
            )}{' '}
            {field.help && <small>{field.help}</small>}
          </label>
        );
      })}
      {config.table === 'exercises' && (
        <>
          <label className="field">
            Private answer key
            <textarea
              rows={5}
              value={answerKey}
              onChange={(e) => setAnswerKey(e.target.value)}
              required
              spellCheck={false}
            />
            <small>
              Choice: {JSON.stringify({ answer: 'a' })}. Typing:{' '}
              {JSON.stringify({ answers: ['accepted text'] })}. Word order:{' '}
              {JSON.stringify({ answer: ['first', 'second'] })}.
            </small>
          </label>
          <label className="field">
            Feedback explanation
            <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </label>
        </>
      )}
      {error && (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy}>
        {busy ? 'Saving…' : row?.id ? 'Save changes' : 'Create record'}
      </Button>
    </form>
  );
}
export default function AdminCatalogPage({ resourceName }) {
  const params = useParams();
  const name = resourceName || params.resource;
  const config = adminResources[name];
  const [search, setSearch] = useState(''),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState(undefined),
    [error, setError] = useState('');
  const resource = useResource(async () => {
    if (!config) return null;
    const tables = [
      ...new Set(config.fields.filter((f) => f.type === 'relation').map((f) => f.table)),
    ];
    const [rows, ...related] = await Promise.all([
      unwrap(client().from(config.table).select('*').limit(1000)),
      ...tables.map((table) => unwrap(client().from(table).select('*').limit(1000))),
    ]);
    return { rows, relations: Object.fromEntries(tables.map((table, i) => [table, related[i]])) };
  }, [name]);
  async function edit(row) {
    setError('');
    try {
      if (config.table === 'exercises') {
        const answer = await perform('exercise_solution', { id: row.id });
        setSelected({ ...row, _solution: answer.solution, _explanation: answer.explanation });
      } else setSelected(row);
    } catch (e) {
      setError(e.message);
    }
  }
  function newVersion(row, rows) {
    const key = config.table === 'pdf_templates' ? 'template_key' : 'asset_id';
    const version = Math.max(...rows.filter((r) => r[key] === row[key]).map((r) => r.version)) + 1;
    setSelected({ ...row, id: undefined, version, status: 'draft' });
  }
  if (!config)
    return (
      <EmptyState
        title="Section not found"
        description="Choose a content section from the admin navigation."
      />
    );
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="LIVE CONTENT STUDIO"
        title={config.title}
        description="Changes are saved to Supabase. Publish complete content when it is ready for learners."
        action={
          !config.existingOnly && (
            <Button onClick={() => setSelected(null)}>
              Create {config.title.toLowerCase().replace(/s$/, '')}
            </Button>
          )
        }
      />
      {error && (
        <p role="alert" className="notice notice-error">
          {error}
        </p>
      )}
      <ResourceState resource={resource}>
        {(data) => {
          if (!data) return null;
          const rows = data.rows.filter((row) =>
            String(row[config.display] || '')
              .toLowerCase()
              .includes(search.toLowerCase()),
          );
          const currentPage = Math.min(page, Math.max(0, Math.ceil(rows.length / 10) - 1));
          return (
            <>
              <label className="field">
                Search {config.title.toLowerCase()}
                <input
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                />
              </label>
              <Card>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{config.title}</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(currentPage * 10, currentPage * 10 + 10).map((row) => (
                        <tr key={row.id}>
                          <td>
                            {String(row[config.display])}
                            {row.template_key && <small> · {row.template_key}</small>}
                          </td>
                          <td>
                            <Badge>{row.status ?? (row.enabled ? 'Enabled' : 'Disabled')}</Badge>
                          </td>
                          <td>
                            <div className="filter-row">
                              <Button variant="secondary" onClick={() => edit(row)}>
                                Edit
                              </Button>
                              {config.versioned && (
                                <Button variant="ghost" onClick={() => newVersion(row, data.rows)}>
                                  New version
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!rows.length && (
                  <EmptyState
                    title="No records found"
                    description="Create your first record or change your search."
                  />
                )}
                <div className="filter-row" style={{ marginTop: 20 }}>
                  <Button
                    variant="secondary"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span>
                    {rows.length} records · Page {currentPage + 1}
                  </span>
                  <Button
                    variant="secondary"
                    disabled={(currentPage + 1) * 10 >= rows.length}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </Card>
              <Modal
                open={selected !== undefined}
                onClose={() => setSelected(undefined)}
                title={(selected?.id ? 'Edit ' : 'Create ') + config.title.toLowerCase()}
              >
                {selected !== undefined && (
                  <ContentEditor
                    key={selected?.id || selected?.version || 'new'}
                    config={config}
                    row={selected}
                    relations={data.relations}
                    onSaved={() => {
                      setSelected(undefined);
                      resource.reload();
                    }}
                  />
                )}
              </Modal>
            </>
          );
        }}
      </ResourceState>
    </div>
  );
}
