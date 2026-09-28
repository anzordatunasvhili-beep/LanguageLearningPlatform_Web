import { Link } from 'react-router';
import { characters } from '../../data/characters.js';
import CharacterRenderer from './CharacterRenderer.jsx';
import { Badge, Icon, PageHeader } from '../../components/ui/index.jsx';

export default function CharactersPage() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="A LANGUAGE IS A WAY TO CONNECT"
        title="New faces. New stories."
        description="Get to know the people who make your practice feel like a conversation."
        action={<Badge>Scripted character previews</Badge>}
      />
      <div className="character-grid">
        {characters.map((character, i) => (
          <Link
            className="character-card"
            to={`/app/ai/characters/${character.id}`}
            key={character.id}
            style={{ '--character-color': character.color }}
          >
            <div className="character-card-art">
              <span className="character-number">0{i + 1}</span>
              <span className="character-script">{character.initials}</span>
              <CharacterRenderer name={character.name} appearance={character.appearance} />
              <span className="character-location">
                <Icon name="location_on" />
                {character.city}, {character.country}
              </span>
            </div>
            <div className="character-card-copy">
              <div className="section-heading">
                <p className="eyebrow">
                  {character.language} · {character.level}
                </p>
                <Icon name="north_east" />
              </div>
              <h2>{character.name}</h2>
              <p>{character.occupation}</p>
              <p className="muted">{character.personality}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="editorial-note">
        <span>“</span>
        <p>
          Every person is a door to another world.
          <br />
          <em>Sometimes, all it takes is hello.</em>
        </p>
      </div>
    </div>
  );
}
