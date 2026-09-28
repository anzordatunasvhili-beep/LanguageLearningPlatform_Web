import { Link, useParams } from 'react-router';
import { characters } from '../../data/characters.js';
import CharacterRenderer from './CharacterRenderer.jsx';
import { Badge, EmptyState, Icon } from '../../components/ui/index.jsx';

export default function CharacterDetailPage() {
  const { characterId } = useParams();
  const character = characters.find((item) => item.id === characterId);
  if (!character)
    return (
      <EmptyState
        title="Character not found"
        description="Choose a character from the character collection."
      />
    );
  return (
    <div className="page-stack">
      <Link className="text-link" to="/app/ai/characters">
        <Icon name="arrow_back" /> The character collection
      </Link>
      <section className="character-introduction" style={{ '--character-color': character.color }}>
        <div className="character-intro-art">
          <span className="giant-script">{character.initials}</span>
          <CharacterRenderer appearance={character.appearance} name={character.name} />
          <p>THE PEOPLE YOU MEET · CHAPTER 01</p>
        </div>
        <div className="character-intro-copy">
          <Badge>
            {character.language} · {character.level}
          </Badge>
          <p className="eyebrow">
            {character.city}, {character.country}
          </p>
          <h1>
            Hello,
            <br />
            I’m <em>{character.name}.</em>
          </h1>
          <p className="intro-occupation">{character.occupation}</p>
          <p>{character.biography}</p>
          <div className="intro-scene">
            <Icon name="location_on" />
            <div>
              <small>YOUR FIRST SCENE</small>
              <strong>{character.scene}</strong>
              <span>{character.goal}</span>
            </div>
          </div>
          <Link className="button button-lime" to={`/app/ai/conversation/${character.id}`}>
            Start a conversation <Icon name="arrow_forward" />
          </Link>
          <small className="subtle">Scripted preview · No AI provider connected</small>
        </div>
      </section>
    </div>
  );
}
