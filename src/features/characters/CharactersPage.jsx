import { Link } from 'react-router';
import CharacterRenderer from './CharacterRenderer.jsx';
import { Card, PageHeader } from '../../components/ui/index.jsx';
import { characterService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
export default function CharactersPage() {
  const resource = useResource(() => characterService.list(), []);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="LANGUAGE THROUGH CONVERSATION"
        title="New faces. New stories."
        description="Choose a character and a published scenario for your language practice."
      />
      <ResourceState resource={resource}>
        {(characters) =>
          characters.length ? (
            <div className="character-grid">
              {characters.map((c) => (
                <Link
                  className="character-card"
                  to={'/app/ai/characters/' + c.id}
                  key={c.id}
                  style={{ '--character-color': c.presentation?.color || '#dce0d5' }}
                >
                  <div className="character-card-art">
                    <CharacterRenderer
                      name={c.name}
                      character={c}
                    />
                    <span className="character-location">
                      {[c.city, c.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  <div className="character-card-copy">
                    <p className="eyebrow">{c.language?.name}</p>
                    <h2>{c.name}</h2>
                    <p>{c.biography}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Card>No characters have been published yet.</Card>
          )
        }
      </ResourceState>
    </div>
  );
}
