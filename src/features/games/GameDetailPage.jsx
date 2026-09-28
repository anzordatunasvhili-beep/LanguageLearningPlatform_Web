import { Link, useLocation, useParams } from 'react-router';
import { Badge, Card, EmptyState, Icon } from '../../components/ui/index.jsx';
import { gameService } from '../../services/catalogService.js';
import '../learning/catalog.css';

export default function GameDetailPage() {
  const { gameId } = useParams();
  const { pathname } = useLocation();
  const game = gameService.get(gameId);
  if (!game)
    return (
      <EmptyState
        icon="sports_esports"
        title="Game not found"
        description="Visit the Games Hub to browse the sample concepts."
      />
    );
  return (
    <div className="page-stack">
      <Link className="text-link" to={pathname.startsWith('/app') ? '/app/games' : '/games'}>
        <Icon name="arrow_back" /> All games
      </Link>
      <div className="catalog-detail-hero">
        <div className={`catalog-visual ${game.color}`}>
          <Icon name={game.icon} />
          <span className="catalog-visual-caption">{game.genre.toUpperCase()}</span>
        </div>
        <div>
          <Badge>Planned · Sample concept</Badge>
          <h1>{game.name}</h1>
          <p className="muted">{game.description}</p>
          <div className="tag-row">
            <Badge>{game.language}</Badge>
            <Badge>{game.level}</Badge>
            <Badge>{game.skill}</Badge>
          </div>
        </div>
      </div>
      <div className="split-grid">
        <Card>
          <h2>How it will play</h2>
          <ol className="catalog-list">
            {game.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </Card>
        <Card>
          <h2>Game information</h2>
          <dl className="detail-facts">
            <div>
              <dt>Planned platform</dt>
              <dd>{game.platform}</dd>
            </div>
            <div>
              <dt>Development stage</dt>
              <dd>{game.version}</dd>
            </div>
            <div>
              <dt>Skills practiced</dt>
              <dd>{game.skill}</dd>
            </div>
            <div>
              <dt>Language level</dt>
              <dd>{game.level}</dd>
            </div>
          </dl>
        </Card>
      </div>
      <div className="notice">
        <Icon name="construction" />
        <p>
          This game is a concept preview. A playable build, release date, leaderboard, and downloads
          have not been published.
        </p>
      </div>
    </div>
  );
}
