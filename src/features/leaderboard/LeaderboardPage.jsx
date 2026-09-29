import { useState } from 'react';
import { Link } from 'react-router';
import { Card, PageHeader, EmptyState } from '../../components/ui/index.jsx';
import { leaderboardService, learningService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import '../learning/catalog.css';
export default function LeaderboardPage() {
  const [period, setPeriod] = useState('weekly'),
    [languageId, setLanguageId] = useState('');
  const resource = useResource(
    async () => ({
      rows: await leaderboardService.list({ period, languageId: languageId || null }),
      languages: await learningService.languages(),
    }),
    [period, languageId],
  );
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="GROW TOGETHER"
        title="A little friendly competition."
        description="Rankings come from earned XP. Only learners who opt in with a public profile appear here."
      />
      <div className="filter-row">
        <button
          className={'filter-chip ' + (period === 'weekly' ? 'active' : '')}
          onClick={() => setPeriod('weekly')}
        >
          This week
        </button>
        <button
          className={'filter-chip ' + (period === 'all' ? 'active' : '')}
          onClick={() => setPeriod('all')}
        >
          All time
        </button>
        <Link className="text-link" to="/app/settings">
          Manage ranking visibility
        </Link>
      </div>
      <ResourceState resource={resource}>
        {({ rows, languages }) => (
          <>
            <label className="field">
              Language
              <select value={languageId} onChange={(e) => setLanguageId(e.target.value)}>
                <option value="">All languages</option>
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            {rows.length ? (
              <Card>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Learner</th>
                        <th>XP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.username}>
                          <td>{i + 1}</td>
                          <td>
                            <Link className="text-link" to={'/app/profile/' + row.username}>
                              {row.display_name}
                            </Link>
                          </td>
                          <td>{Number(row.xp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <EmptyState
                title="The leaderboard is waiting for its first learners"
                description="Complete a lesson and opt in through Settings to participate."
              />
            )}
          </>
        )}
      </ResourceState>
    </div>
  );
}
