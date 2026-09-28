import { useState } from 'react';
import { Badge, Card, Icon, PageHeader, ProgressBar } from '../../components/ui/index.jsx';
import { achievementService } from '../../services/catalogService.js';
import '../learning/catalog.css';

export default function AchievementsPage() {
  const [filter, setFilter] = useState('All achievements');
  const achievements = achievementService
    .list()
    .filter(
      (item) =>
        filter === 'All achievements' || (filter === 'Unlocked' ? item.unlocked : !item.unlocked),
    );
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="MARKERS OF YOUR JOURNEY"
        title="Every little victory matters."
        description="The first hello. A week of showing up. Small milestones, worth remembering."
        action={<Badge>Sample progression</Badge>}
      />
      <div className="filter-row" role="group" aria-label="Filter achievements">
        {['All achievements', 'Unlocked', 'In progress'].map((value) => (
          <button
            key={value}
            className={`filter-chip ${value === filter ? 'active' : ''}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="catalog-grid">
        {achievements.map((achievement) => (
          <Card
            className={`achievement-card ${achievement.unlocked ? '' : 'locked'}`}
            key={achievement.id}
          >
            <div className="section-heading">
              <span className={`catalog-emblem ${achievement.unlocked ? 'amber' : 'violet'}`}>
                <Icon name={achievement.icon} />
              </span>
              <Badge>{achievement.rarity}</Badge>
            </div>
            <h2>{achievement.title}</h2>
            <p className="muted">{achievement.description}</p>
            <ProgressBar
              value={achievement.progress}
              max={achievement.target}
              label={`${achievement.progress} / ${achievement.target}`}
            />
            <div className="section-heading">
              <span className="muted">{achievement.reward} example reward</span>
              <Badge>{achievement.unlocked ? 'Sample unlock' : 'In progress'}</Badge>
            </div>
          </Card>
        ))}
      </div>
      <p className="catalog-disclaimer">
        This is illustrative achievement progress. Account achievements and rewards will be granted
        by the platform after validated activity.
      </p>
    </div>
  );
}
