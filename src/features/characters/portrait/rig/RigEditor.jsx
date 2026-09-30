import { useEffect, useRef, useState } from 'react';
import CharacterPortrait from '../CharacterPortrait.jsx';
import { createCharacter } from '../data/character.js';
import { RIG_PARTS } from './definition.js';
import { EXPRESSION_PRESETS, MOUTH_STATES, cleanPreset } from './presets.js';
import './rig-editor.css';

const STORAGE = 'kotoba.facial-rig.presets.v1';
function readPresets() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE) || '[]')
      .slice(0, 20)
      .map(cleanPreset);
  } catch {
    return [];
  }
}
const LAYER_LABELS = {
  body: 'Head, hair and neck',
  hairFront: 'Front hair',
  eyeball: 'Static eyeballs',
  iris: 'Iris / pupil',
  eyelids: 'Eyelid skin meshes',
  leftEye: 'Left eye',
  rightEye: 'Right eye',
  leftBrow: 'Left eyebrow',
  rightBrow: 'Right eyebrow',
  mouth: 'Mouth',
  mouthInterior: 'Mouth interior',
  lips: 'Lips / skin mesh',
};

export default function RigEditor() {
  const portrait = useRef(null),
    stage = useRef(null),
    handles = useRef([]),
    coordinates = useRef(null),
    file = useRef(null);
  const [ready, setReady] = useState(false),
    [selected, setSelected] = useState('leftEye'),
    [view, setView] = useState('detail');
  const [mesh, setMesh] = useState(true),
    [landmarks, setLandmarks] = useState(false),
    [layers, setLayers] = useState({});
  const [emotion, setEmotion] = useState('neutral'),
    [transition, setTransition] = useState(300),
    [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [presets, setPresets] = useState(readPresets),
    [presetName, setPresetName] = useState('My expression'),
    [selectedPreset, setSelectedPreset] = useState('');
  const [message, setMessage] = useState(''),
    [error, setError] = useState('');
  const selection = useRef(selected);
  selection.current = selected;
  const ui = useRef(null);
  ui.current = { selected, view, mesh, landmarks, layers };
  function rig() {
    return portrait.current?.rig;
  }
  function configure(engine = rig()) {
    if (!engine) return;
    const value = ui.current;
    engine.setLayers(value.layers);
    engine.setView(value.view, value.selected);
    engine.setDebug({ mesh: value.mesh, landmarks: value.landmarks, selected: value.selected });
  }
  useEffect(() => {
    configure();
  }, [selected, view, mesh, landmarks, layers, ready]);
  function sync({ pose, view: camera }) {
    const key = selection.current,
      d = RIG_PARTS[key];
    pose[key].forEach((p, i) => {
      const node = handles.current[i];
      if (!node) return;
      const x = d.x + (d.mirror ? d.width - p.x : p.x),
        y = d.y + p.y;
      node.style.left = ((x - camera.x) / camera.size) * 100 + '%';
      node.style.top = ((y - camera.y) / camera.size) * 100 + '%';
      node.dataset.x = p.x.toFixed(2);
      node.dataset.y = p.y.toFixed(2);
      node.dataset.part = key;
    });
  }
  function drag(event, index) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId) || !rig()) return;
    const rect = stage.current.getBoundingClientRect(),
      camera = rig().getState().view,
      d = RIG_PARTS[selected];
    const x = ((event.clientX - rect.left) / rect.width) * camera.size + camera.x - d.x;
    const y = ((event.clientY - rect.top) / rect.height) * camera.size + camera.y - d.y;
    const point = { x: d.mirror ? d.width - x : x, y };
    if (rig().moveVertex(selected, index, point)) {
      if (coordinates.current)
        coordinates.current.textContent = `P${index}: ${point.x.toFixed(1)}, ${point.y.toFixed(1)}`;
      setEmotion('custom');
    }
  }
  function keyboard(event, index) {
    const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[
      event.key
    ];
    if (!delta || !rig()) return;
    event.preventDefault();
    const p = rig().getState().pose[selected][index],
      step = event.shiftKey ? 5 : 1,
      sign = RIG_PARTS[selected].mirror ? -1 : 1;
    rig().moveVertex(selected, index, {
      x: p.x + delta[0] * step * sign,
      y: p.y + delta[1] * step,
    });
    setEmotion('custom');
  }
  function savePreset() {
    try {
      const value = rig().getPreset(presetName),
        next = [...presets.filter((p) => p.name !== value.name), value].slice(-20);
      localStorage.setItem(STORAGE, JSON.stringify(next));
      setPresets(next);
      setSelectedPreset(value.name);
      setError('');
      setMessage('Preset saved in this browser.');
    } catch (e) {
      setError(e.message);
    }
  }
  function exportPreset() {
    try {
      const value = rig().getPreset(presetName),
        url = URL.createObjectURL(
          new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
        );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kotoba-rig-preset.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.message);
    }
  }
  async function importPreset(event) {
    const value = event.target.files?.[0];
    event.target.value = '';
    if (!value) return;
    try {
      if (value.size > 32768) throw new Error('Rig presets must be smaller than 32 KB.');
      const clean = cleanPreset(JSON.parse(await value.text()));
      rig().setPose(clean.pose, transition);
      setPresetName(clean.name);
      setEmotion('custom');
      setError('');
      setMessage('Preset imported. Save to keep it in this browser.');
    } catch (e) {
      setError(e instanceof SyntaxError ? 'Invalid preset JSON.' : e.message);
    }
  }
  return (
    <div className="rig-workshop">
      <section className="rig-stage-panel">
        <div className="rig-view-buttons">
          <button type="button" aria-pressed={view === 'detail'} onClick={() => setView('detail')}>
            Selected part
          </button>
          <button type="button" aria-pressed={view === 'full'} onClick={() => setView('full')}>
            Full portrait
          </button>
        </div>
        <div className="rig-stage" ref={stage}>
          <CharacterPortrait
            ref={portrait}
            character={createCharacter()}
            name="Rig prototype"
            onRigReady={(engine) => {
              configure(engine);
              setReady(true);
            }}
            onRigFrame={sync}
          />
          {mesh && (
            <div className="rig-handles" aria-label="Mesh vertices">
              {Array.from({ length: 16 }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  ref={(node) => {
                    handles.current[index] = node;
                  }}
                  className="rig-vertex"
                  aria-label={`${RIG_PARTS[selected].label} point ${index}`}
                  disabled={!ready}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => drag(event, index)}
                  onPointerUp={(event) => {
                    if (event.currentTarget.hasPointerCapture(event.pointerId))
                      event.currentTarget.releasePointerCapture(event.pointerId);
                  }}
                  onKeyDown={(event) => keyboard(event, index)}
                >
                  <span>P{index}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="rig-help">
          Drag a point to shape the painted layer. Focus a point and use arrow keys for precision;
          Shift moves five pixels.
        </p>
        <output ref={coordinates} className="rig-coordinate">
          Select any mesh point.
        </output>
      </section>
      <section className="rig-controls" aria-label="Facial rig controls">
        <h2>One rig. Every expression.</h2>
        <p className="muted">
          The eyeballs stay round. Painted eyelids, brows and lips deform around them.
        </p>
        <fieldset disabled={!ready}>
          <label className="rig-field">
            Edit mesh
            <select value={selected} onChange={(e) => setSelected(e.target.value)}>
              {Object.entries(RIG_PARTS).map(([key, p]) => (
                <option key={key} value={key}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <div className="rig-checks">
            <label>
              <input type="checkbox" checked={mesh} onChange={(e) => setMesh(e.target.checked)} />{' '}
              Show mesh and points
            </label>
            <label>
              <input
                type="checkbox"
                checked={landmarks}
                onChange={(e) => setLandmarks(e.target.checked)}
              />{' '}
              Facial landmarks
            </label>
          </div>
          <fieldset>
            <legend>Eye opening</legend>
            <div className="rig-button-row">
              {[
                ['Normal', 1],
                ['Wide', 1.65],
                ['Narrow', 0.4],
                ['Closed', 0.005],
              ].map(([label, value]) => (
                <button
                  type="button"
                  key={label}
                  onClick={() => {
                    rig().setEyeOpening(value, selected === 'rightEye' ? 'rightEye' : 'leftEye');
                    setEmotion('custom');
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>Expression</legend>
            <div className="rig-button-row">
              {Object.keys(EXPRESSION_PRESETS).map((name) => (
                <button
                  type="button"
                  aria-pressed={emotion === name}
                  key={name}
                  onClick={() => {
                    rig().setExpression(name, transition);
                    setEmotion(name);
                  }}
                >
                  {name[0].toUpperCase() + name.slice(1)}
                </button>
              ))}
            </div>
          </fieldset>
          <label className="rig-field">
            Transition: {transition} ms
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={transition}
              onChange={(e) => setTransition(Number(e.target.value))}
            />
          </label>
          <div className="rig-button-row">
            <button type="button" onClick={() => rig().blink()}>
              Blink both
            </button>
            <button type="button" onClick={() => rig().blinkLeft()}>
              Blink left
            </button>
            <button type="button" onClick={() => rig().blinkRight()}>
              Blink right
            </button>
          </div>
          <fieldset>
            <legend>Gaze (independent of emotion)</legend>
            {['x', 'y'].map((axis) => (
              <label className="rig-field" key={axis}>
                {axis === 'x' ? 'Look left / right' : 'Look up / down'}
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step=".05"
                  value={gaze[axis]}
                  onChange={(e) => {
                    const next = { ...gaze, [axis]: Number(e.target.value) };
                    setGaze(next);
                    rig().setLookDirection(next.x, next.y);
                  }}
                />
              </label>
            ))}
          </fieldset>
          <label className="rig-field">
            Mouth pose
            <select
              defaultValue="expression"
              onChange={(e) => rig().setMouthState(e.target.value, transition)}
            >
              <option value="expression">Follow expression</option>
              {Object.keys(MOUTH_STATES).map((name) => (
                <option key={name} value={name}>
                  {name.replace('mouth_', '').replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <div className="rig-button-row">
            <button type="button" onClick={() => rig().reset(selected)}>
              Reset selected mesh
            </button>
            <button
              type="button"
              onClick={() => {
                rig().reset();
                setEmotion('neutral');
              }}
            >
              Reset all meshes
            </button>
          </div>
          <details>
            <summary>Asset layers</summary>
            <div className="rig-layer-toggles">
              {Object.entries(LAYER_LABELS).map(([key, label]) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={layers[key] !== false}
                    onChange={(e) => setLayers({ ...layers, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </div>
          </details>
          <fieldset>
            <legend>Save / load deformation</legend>
            <label className="rig-field">
              Preset name
              <input
                maxLength="64"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </label>
            <div className="rig-button-row">
              <button type="button" onClick={savePreset}>
                Save preset
              </button>
              <button type="button" onClick={exportPreset}>
                Export preset
              </button>
              <button type="button" onClick={() => file.current?.click()}>
                Import preset
              </button>
            </div>
            <label className="rig-field">
              Saved presets
              <select value={selectedPreset} onChange={(e) => setSelectedPreset(e.target.value)}>
                <option value="">Choose a browser preset</option>
                {presets.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedPreset}
              onClick={() => {
                const p = presets.find((p) => p.name === selectedPreset);
                if (p) {
                  rig().setPose(p.pose, transition);
                  setPresetName(p.name);
                  setEmotion('custom');
                }
              }}
            >
              Load preset
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Import deformation preset"
              onChange={importPreset}
            />
          </fieldset>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <p role="status">{message}</p>
      </section>
    </div>
  );
}
