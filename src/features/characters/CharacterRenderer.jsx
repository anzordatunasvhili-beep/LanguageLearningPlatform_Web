import CharacterPortrait from './portrait/CharacterPortrait.jsx';
import { catalogCharacter } from './portrait/data/character.js';
import './character-art.css';

// All character surfaces resolve the same identity before applying expression.
export default function CharacterRenderer({
  character,
  definition,
  name,
  expression = 'neutral',
  ...props
}) {
  return (
    <CharacterPortrait
      character={definition || catalogCharacter(character)}
      name={name || character?.name || 'Your character'}
      expression={expression}
      {...props}
    />
  );
}
