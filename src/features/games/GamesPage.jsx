import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Badge, Card, EmptyState, Icon, PageHeader } from '../../components/ui/index.jsx';
import { gameService } from '../../services/catalogService.js';
import '../learning/catalog.css';

export default function GamesPage() {
  const [skill, setSkill] = useState('All skills');
  const { pathname } = useLocation();
  const games = gameService.list().filter((game) => skill === 'All skills' || game.skill === skill);
  const basePath = pathname.startsWith('/app') ? '/app/games' : '/games';
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="THE ARCADE"
        title="Play a little. Learn a lot."
        description="New worlds, familiar words. A growing collection of games for your language journey."
        action={<Badge>Sample concepts</Badge>}
      />
      <div className="filter-row" role="group" aria-label="Filter games by skill">
        {['All skills', 'Vocabulary', 'Grammar', 'Writing'].map((value) => (
          <button
            className={`filter-chip ${value === skill ? 'active' : ''}`}
            key={value}
            aria-pressed={skill === value}
            onClick={() => setSkill(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="catalog-grid">
        {games.map((game) => (
          <Card className="catalog-card" key={game.id}>
            <div className={`catalog-visual ${game.color}`}>
              <Icon name={game.icon} />
              <span className="catalog-visual-caption">A NEW WAY TO LEARN</span>
            </div>
            <div className="catalog-body">
              <div className="tag-row">
                <Badge>{game.skill}</Badge>
                <span className="muted">{game.language}</span>
              </div>
              <h2>{game.name}</h2>
              <p className="muted">{game.description}</p>
              <p className="catalog-meta">
                {game.level}
                <span>·</span>
                {game.platform}
                <span>·</span>Planned
              </p>
              <Link className="button button-secondary" to={`${basePath}/${game.id}`}>
                Explore concept <Icon name="arrow_forward" />
              </Link>
            </div>
          </Card>
        ))}
      </div>
      {!games.length && (
        <EmptyState
          icon="sports_esports"
          title="More games are on the horizon"
          description="Try a different skill filter."
        />
      )}
      <p className="catalog-disclaimer">
        These are game concepts for the future platform. Playable games, downloads, scores, and
        rewards are not available yet.
      </p>
    </div>
  );
}
