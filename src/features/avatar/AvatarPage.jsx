import { useState } from 'react';
import { avatarAppearance, exportAvatar, validateAvatar } from '../../services/avatarService.js';
import { avatarRepository } from '../../services/avatarRepository.js';
import { palettes, appearanceSlots } from './avatarCatalog.js';
import CharacterRenderer from '../characters/CharacterRenderer.jsx';
import { Button, Card, Icon, PageHeader } from '../../components/ui/index.jsx';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
function Studio({ data }) {
  const [definition, setDefinition] = useState(data.definition),
    [mode, setMode] = useState('2d'),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  function update(slot, changes) {
    setDefinition((current) => ({
      ...current,
      selections: current.selections.map((item) =>
        item.slot === slot ? { ...item, ...changes } : item,
      ),
    }));
    setMessage('');
  }
  async function save() {
    setBusy(true);
    setError('');
    try {
      setDefinition(await avatarRepository.save(definition));
      setMessage('Your avatar is saved to your account.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function download() {
    try {
      const url = URL.createObjectURL(
        new Blob([exportAvatar(definition)], { type: 'application/json' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kotoba-avatar-v1.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.message);
    }
  }
  const supported = validateAvatar(definition);
  return (
    <div className="avatar-studio">
      <Card className="avatar-stage">
        <div className="segmented">
          {['2d', '3d'].map((value) => (
            <button key={value} aria-pressed={mode === value} onClick={() => setMode(value)}>
              {value.toUpperCase()}
            </button>
          ))}
        </div>
        {supported ? (
          <CharacterRenderer mode={mode} appearance={avatarAppearance(definition)} />
        ) : (
          <p>This avatar includes equipment that this renderer does not support yet.</p>
        )}
        <div className="avatar-stage-caption">
          <strong>Your explorer</strong>
          <span>Account equipment · Built-in character styles</span>
        </div>
      </Card>
      <Card className="avatar-options">
        <h2>Your signature look</h2>
        {['body', 'hair', 'top'].map((slot) => (
          <fieldset key={slot}>
            <legend>
              {slot === 'body' ? 'Character' : slot === 'hair' ? 'Hair style' : 'Outfit'}
            </legend>
            <div className="filter-row">
              {data.available
                .filter((a) => a.slot === slot)
                .map((asset) => (
                  <button
                    className="choice-button"
                    key={asset.assetKey}
                    disabled={!asset.unlocked || busy}
                    aria-pressed={definition.selections.some(
                      (s) => s.slot === slot && s.assetKey === asset.assetKey,
                    )}
                    onClick={() =>
                      update(slot, { assetKey: asset.assetKey, assetVersion: asset.assetVersion })
                    }
                  >
                    {asset.label}
                    {!asset.unlocked ? ' · Locked' : ''}
                  </button>
                ))}
            </div>
          </fieldset>
        ))}
        {Object.entries(palettes).map(([category, colors]) => (
          <fieldset key={category}>
            <legend>{category} color</legend>
            <div className="swatches">
              {colors.map((color, i) => (
                <button
                  key={color}
                  className="swatch"
                  disabled={busy}
                  style={{ '--swatch': color }}
                  aria-label={category + ' tone ' + (i + 1)}
                  aria-pressed={definition.selections.some(
                    (s) => s.slot === appearanceSlots[category] && s.options.tint === color,
                  )}
                  onClick={() => update(appearanceSlots[category], { options: { tint: color } })}
                />
              ))}
            </div>
          </fieldset>
        ))}
        <div className="filter-row">
          <Button disabled={busy || !supported || !data.available.length} onClick={save}>
            <Icon name="check" />
            {busy ? 'Saving…' : 'Save avatar'}
          </Button>
          <Button variant="secondary" disabled={!supported} onClick={download}>
            Export definition
          </Button>
        </div>
        {error && <p role="alert">{error}</p>}
        <p role="status">{message}</p>
        {!data.available.length && <p>Publish avatar assets before saving an appearance.</p>}
      </Card>
    </div>
  );
}
export default function AvatarPage() {
  const resource = useResource(() => avatarRepository.load(), []);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR IDENTITY"
        title="Every story needs you."
        description="Customize your explorer and save your appearance across devices."
      />
      <ResourceState resource={resource}>{(data) => <Studio data={data} />}</ResourceState>
    </div>
  );
}
