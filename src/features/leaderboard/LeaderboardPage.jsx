import { useState } from 'react';
import { Badge, Card, PageHeader } from '../../components/ui/index.jsx';
import { leaderboardService } from '../../services/catalogService.js';
import '../learning/catalog.css';

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('weekly');
  const [language, setLanguage] = useState('All languages');
  const entries = leaderboardService.list({ period, language });
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="GROWING TOGETHER"
        title="A little friendly ambition."
        description="Celebrate the small, steady steps that add up to something remarkable."
        action={<Badge>Sample rankings</Badge>}
      />
      <div className="catalog-filters">
        <div className="filter-row" role="group" aria-label="Ranking period">
          <button
            className={`filter-chip ${period === 'weekly' ? 'active' : ''}`}
            aria-pressed={period === 'weekly'}
            onClick={() => setPeriod('weekly')}
          >
            This week
          </button>
          <button
            className={`filter-chip ${period === 'all' ? 'active' : ''}`}
            aria-pressed={period === 'all'}
            onClick={() => setPeriod('all')}
          >
            All time
          </button>
        </div>
        <label className="field">
          <span>Language</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            {['All languages', 'Japanese', 'Spanish', 'French'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="ranking-podium">
        {entries.slice(0, 3).map((entry, index) => (
          <Card key={entry.id}>
            <span className="eyebrow">#{index + 1}</span>
            <span className={`catalog-emblem ${entry.color}`}>{entry.initials}</span>
            <h2>{entry.name}</h2>
            <p className="muted">{entry.language}</p>
            <p className="rank-xp">{entry.xp.toLocaleString()}</p>
            <span className="muted">sample XP</span>
          </Card>
        ))}
      </div>
      <Card>
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">
              {period === 'weekly' ? 'Weekly' : 'All-time'} sample leaderboard
            </caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Learner</th>
                <th scope="col">Language</th>
                <th scope="col">{period === 'weekly' ? 'Weekly XP' : 'Total XP'}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => (
                <tr key={entry.id}>
                  <td className="ranking-rank">{index + 1}</td>
                  <td>
                    <div className="catalog-flex">
                      <span className={`catalog-emblem small ${entry.color}`}>
                        {entry.initials}
                      </span>
                      <span>{entry.name}</span>
                    </div>
                  </td>
                  <td>{entry.language}</td>
                  <td>{entry.xp.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="catalog-disclaimer">
        Fictional learners and illustrative XP. Your practice results do not affect these rankings.
      </p>
    </div>
  );
}
