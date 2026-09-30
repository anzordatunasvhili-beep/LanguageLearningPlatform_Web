import CharacterCreator from './CharacterCreator.jsx';
import { useState } from 'react';
import RigEditor from './rig/RigEditor.jsx';
import { createCharacter, cleanCharacter, exportCharacter } from './data/character.js';
const KEY = 'kotoba.portrait-lab.v1';
function loadDraft() {
  try {
    return cleanCharacter(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return createCharacter();
  }
}
export default function PortraitLabPage() {
  const [tab, setTab] = useState('rig');
  return (
    <main className="portrait-lab public-content">
      <p className="eyebrow">CHARACTER WORKSHOP</p>
      <h1>Bring a face to life.</h1>
      <p className="muted">
        One painted facial set, shaped with live mesh controls. Edit expressions here, or open
        Appearance to change colors and save an identity. Workshop presets stay in this browser.
      </p>
      <div className="workshop-tabs" role="group" aria-label="Workshop mode">
        <button type="button" aria-pressed={tab === 'rig'} onClick={() => setTab('rig')}>
          Facial rig
        </button>
        <button
          type="button"
          aria-pressed={tab === 'appearance'}
          onClick={() => setTab('appearance')}
        >
          Appearance
        </button>
      </div>
      {tab === 'rig' ? (
        <RigEditor />
      ) : (
        <CharacterCreator
          initialCharacter={loadDraft()}
          storageLabel="Save browser draft"
          onSave={(value) => localStorage.setItem(KEY, exportCharacter(value))}
        />
      )}
    </main>
  );
}
