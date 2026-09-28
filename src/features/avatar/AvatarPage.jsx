import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { avatarService, avatarAppearance, exportAvatar } from '../../services/avatarService.js';
import { palettes, avatarAssets, appearanceSlots } from './avatarCatalog.js';
import CharacterRenderer from '../characters/CharacterRenderer.jsx';
import { Button, Card, Icon, PageHeader, Badge } from '../../components/ui/index.jsx';

export default function AvatarPage() {
  const { user } = useAuth();
  const [definition, setDefinition] = useState(() => avatarService.loadDraft(user?.id));
  const [mode, setMode] = useState('2d');
  const [message, setMessage] = useState('');
  function update(slot, changes) {
    setDefinition((current) => ({
      ...current,
      selections: current.selections.map((item) =>
        item.slot === slot ? { ...item, ...changes } : item,
      ),
    }));
    setMessage('');
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([exportAvatar(definition)], { type: 'application/json' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kotoba-avatar-v1.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR PERSISTENT IDENTITY"
        title="Every story needs you."
        description="A first look at your explorer. Make it feel a little more like you."
        action={<Badge>Avatar studio · Preview</Badge>}
      />
      <div className="avatar-studio">
        <Card className="avatar-stage">
          <div className="segmented" aria-label="Preview rendering">
            {['2d', '3d'].map((value) => (
              <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>
                {value.toUpperCase()} preview
              </button>
            ))}
          </div>
          <CharacterRenderer mode={mode} appearance={avatarAppearance(definition)} />
          <div className="avatar-stage-caption">
            <strong>The everyday explorer</strong>
            <span>Placeholder character · Collection 001</span>
          </div>
        </Card>
        <Card className="avatar-options">
          <p className="eyebrow">THE DETAILS MAKE THE CHARACTER</p>
          <h2>Your signature look</h2>
          <p className="muted">
            A small starting collection. More expressions, outfits, and possibilities will follow.
          </p>
          <fieldset>
            <legend>Hair style</legend>
            <div className="filter-row">
              {avatarAssets
                .filter((a) => a.slot === 'hair')
                .map((asset) => (
                  <button
                    key={asset.assetKey}
                    className={`choice-button ${definition.selections.find((item) => item.slot === 'hair').assetKey === asset.assetKey ? 'selected' : ''}`}
                    aria-pressed={
                      definition.selections.find((item) => item.slot === 'hair').assetKey ===
                      asset.assetKey
                    }
                    onClick={() =>
                      update('hair', { assetKey: asset.assetKey, assetVersion: asset.assetVersion })
                    }
                  >
                    {asset.label}
                  </button>
                ))}
            </div>
          </fieldset>
          {Object.entries(palettes).map(([category, colors]) => {
            const slot = appearanceSlots[category];
            return (
              <fieldset key={category}>
                <legend>
                  {category === 'skin'
                    ? 'Skin tone'
                    : `${category[0].toUpperCase()}${category.slice(1)} color`}
                </legend>
                <div className="swatches">
                  {colors.map((color, index) => (
                    <button
                      key={color}
                      className="swatch"
                      style={{ '--swatch': color }}
                      aria-label={`${category} tone ${index + 1}`}
                      aria-pressed={
                        definition.selections.find((item) => item.slot === slot).options.tint ===
                        color
                      }
                      onClick={() => update(slot, { options: { tint: color } })}
                    >
                      {definition.selections.find((item) => item.slot === slot).options.tint ===
                        color && <Icon name="check" />}
                    </button>
                  ))}
                </div>
              </fieldset>
            );
          })}
          <div className="filter-row">
            <Button
              onClick={() => {
                try {
                  avatarService.saveDraft(definition, user?.id);
                  setMessage('Preview saved on this device.');
                } catch {
                  setMessage('This browser could not save your draft. You can still export it.');
                }
              }}
            >
              <Icon name="check" />
              Save local preview
            </Button>
            <Button variant="secondary" onClick={download}>
              <Icon name="download" />
              Export definition
            </Button>
          </div>
          <p role="status" className="muted">
            {message ||
              'Preview changes stay on this device. Account inventory and unlocks are not connected yet.'}
          </p>
        </Card>
      </div>
    </div>
  );
}
