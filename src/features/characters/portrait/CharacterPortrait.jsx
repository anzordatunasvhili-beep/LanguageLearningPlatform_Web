import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createCharacter, cleanCharacter } from './data/character.js';
import { prepareRig, createRigRenderer } from './rig/renderer.js';
import './portrait.css';

const CharacterPortrait = forwardRef(function CharacterPortrait(
  {
    character = createCharacter(),
    expression = 'neutral',
    speaking = false,
    mouthState,
    guides = false,
    name = 'Character',
    className = '',
    onRigReady,
    onRigFrame,
  },
  forwardedRef,
) {
  const canvas = useRef(null),
    engine = useRef(null),
    latest = useRef(null);
  const [error, setError] = useState(''),
    [ready, setReady] = useState(false),
    [retry, setRetry] = useState(0);
  latest.current = { expression, speaking, mouthState, guides, onRigReady, onRigFrame };
  const signature = JSON.stringify(cleanCharacter(character));
  useImperativeHandle(
    forwardedRef,
    () => ({
      get rig() {
        return engine.current;
      },
      setExpression: (...args) => engine.current?.setExpression(...args),
      setLookDirection: (...args) => engine.current?.setLookDirection(...args),
      blink: () => engine.current?.blink(),
      blinkLeft: () => engine.current?.blinkLeft(),
      blinkRight: () => engine.current?.blinkRight(),
    }),
    [],
  );
  useEffect(() => {
    let active = true;
    setError('');
    setReady(false);
    prepareRig(JSON.parse(signature))
      .then((assets) => {
        if (!active || !canvas.current) return;
        const rig = createRigRenderer(canvas.current, assets, {
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          onFrame: (state) => latest.current.onRigFrame?.(state),
        });
        engine.current = rig;
        const options = latest.current;
        rig.setExpression(options.expression, 0);
        rig.setMouthState(options.mouthState || (options.speaking ? 'mouth_medium_open' : null), 0);
        rig.setDebug({ landmarks: options.guides });
        rig.drawNow();
        setReady(true);
        options.onRigReady?.(rig);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
      engine.current?.destroy();
      engine.current = null;
    };
  }, [signature, retry]);
  useEffect(() => {
    engine.current?.setExpression(expression, 300);
  }, [expression]);
  useEffect(() => {
    engine.current?.setMouthState(mouthState || (speaking ? 'mouth_medium_open' : null));
  }, [speaking, mouthState]);
  useEffect(() => {
    engine.current?.setDebug({ landmarks: guides });
  }, [guides]);
  return (
    <div
      className={'modular-portrait ' + className}
      data-ready={ready}
      aria-busy={!ready && !error}
    >
      <canvas
        ref={canvas}
        width="1024"
        height="1024"
        role="img"
        aria-label={`${name}, ${expression}${speaking ? ', speaking' : ''}`}
      />
      {error && (
        <div className="portrait-load-message" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetry((v) => v + 1)}>
            Retry portrait
          </button>
        </div>
      )}
      {!ready && !error && (
        <span className="portrait-loading" role="status">
          Loading facial rig…
        </span>
      )}
    </div>
  );
});
export default CharacterPortrait;
