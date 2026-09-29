import { Link, useLocation } from 'react-router';
import { Card, PageHeader, Badge, Icon, EmptyState } from '../../components/ui/index.jsx';
import { gameService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import '../learning/catalog.css';
export default function GamesPage() {
  const location = useLocation();
  const prefix = location.pathname.startsWith('/app') ? '/app/games/' : '/games/';
  const resource = useResource(gameService.list, []);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="PLAY YOUR WAY FORWARD"
        title="A little practice. A lot of adventure."
        description="Choose a game, practice published lesson content, and save your score."
      />
      <ResourceState resource={resource}>
        {(games) => (
          <>
            <div className="catalog-grid">
              {games.map((game) => (
                <Card className="catalog-card" key={game.id}>
                  <div className="catalog-visual sage">
                    <Icon
                      name={
                        game.slug === 'word-dungeon'
                          ? 'castle'
                          : game.slug === 'typing-trails'
                            ? 'keyboard'
                            : 'extension'
                      }
                    />
                  </div>
                  <div className="catalog-body">
                    <h2>{game.name}</h2>
                    <p className="muted">{game.description}</p>
                    <div className="tag-row">
                      {game.skills.map((s) => (
                        <Badge key={s}>{s}</Badge>
                      ))}
                    </div>
                    <Link to={prefix + game.id} className="button button-primary">
                      Open game <Icon name="arrow_forward" />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
            {!games.length && (
              <EmptyState
                title="No games published yet"
                description="Games become available when an administrator publishes a supported release."
              />
            )}
          </>
        )}
      </ResourceState>
    </div>
  );
}
