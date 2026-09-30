import { Link, useParams } from 'react-router';
import CharacterRenderer from './CharacterRenderer.jsx';
import { Card, Badge } from '../../components/ui/index.jsx';
import { characterService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
export default function CharacterDetailPage() {
  const { characterId } = useParams();
  const resource = useResource(() => characterService.get(characterId), [characterId]);
  return (
    <ResourceState resource={resource}>
      {(c) =>
        c ? (
          <div className="page-stack">
            <Link className="text-link" to="/app/ai/characters">
              Back to characters
            </Link>
            <section
              className="character-introduction"
              style={{ '--character-color': c.presentation?.color || '#dce0d5' }}
            >
              <div className="character-intro-art">
                <CharacterRenderer
                  name={c.name}
                  character={c}
                />
              </div>
              <div className="character-intro-copy">
                <Badge>{c.language?.name}</Badge>
                <h1>
                  Hello, I’m <em>{c.name}.</em>
                </h1>
                <p>{c.biography}</p>
                <p>{[c.city, c.country].filter(Boolean).join(', ')}</p>
                {c.scenarios
                  .filter((s) => s.status === 'published')
                  .map((s) => (
                    <Card key={s.id}>
                      <h2>{s.title}</h2>
                      <p>{s.objective}</p>
                      <p>{s.level}</p>
                      <Link
                        className="button button-lime"
                        to={'/app/ai/conversation/' + c.id + '?scenario=' + s.id}
                      >
                        Start conversation
                      </Link>
                    </Card>
                  ))}
                {!c.scenarios.some((s) => s.status === 'published') && (
                  <p>No scenarios are published for this character yet.</p>
                )}
              </div>
            </section>
          </div>
        ) : (
          <Card>Character not found.</Card>
        )
      }
    </ResourceState>
  );
}
