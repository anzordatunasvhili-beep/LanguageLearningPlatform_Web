import { useState } from 'react';
import { Badge, Button, EmptyState } from '../../components/ui/index.jsx';

export default function DataTable({ rows, onInspect }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(0);
  const filtered = rows.filter(
    (row) =>
      (status === 'all' || row.status === status) &&
      `${row.name} ${row.type}`.toLowerCase().includes(search.toLowerCase()),
  );
  const pageSize = 5;
  const lastPage = Math.max(0, Math.ceil(filtered.length / pageSize) - 1);
  const currentPage = Math.min(page, lastPage);
  function updateSearch(value) {
    setSearch(value);
    setPage(0);
  }
  function updateStatus(value) {
    setStatus(value);
    setPage(0);
  }
  return (
    <>
      <div className="admin-toolbar">
        <label className="field">
          <span>Search catalog</span>
          <input
            type="search"
            placeholder="Search title or content type…"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Status</span>
          <select value={status} onChange={(event) => updateStatus(event.target.value)}>
            <option value="all">All statuses</option>
            <option value="available">Available</option>
            <option value="draft">Draft</option>
            <option value="planned">Planned</option>
          </select>
        </label>
      </div>
      {filtered.length ? (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <caption className="sr-only">Sample content catalog</caption>
              <thead>
                <tr>
                  <th scope="col">Content</th>
                  <th scope="col">Type</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map((row) => (
                  <tr key={row.id}>
                    <td>{row.name}</td>
                    <td>{row.type}</td>
                    <td>
                      <Badge>{row.status}</Badge>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        onClick={() => onInspect(row)}
                        aria-label={`Inspect ${row.name}`}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-pagination">
            <span>
              {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)}{' '}
              of {filtered.length}
            </span>
            <div className="tag-row">
              <Button
                variant="ghost"
                disabled={currentPage === 0}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                disabled={currentPage === lastPage}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon="search_off"
          title="No matching content"
          description="Try a different title or status."
        />
      )}
    </>
  );
}
