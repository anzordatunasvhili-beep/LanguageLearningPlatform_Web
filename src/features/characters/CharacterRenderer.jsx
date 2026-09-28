import { lazy, Suspense } from 'react';
import CharacterPortrait from './CharacterPortrait.jsx';
import ErrorBoundary from '../../components/ErrorBoundary.jsx';

const ThreeDCharacterRenderer = lazy(() => import('../../three/scenes/CharacterViewerScene.jsx'));
/** Presentation contract: appearance and allowlisted state, never AI/provider objects.
 * TODO: asset resolver, rig compatibility, poses, animation clips, facial expressions, and lip sync.
 */
export default function CharacterRenderer({
  mode = '2d',
  appearance,
  name = 'Your explorer',
  emotion = 'neutral',
}) {
  if (mode === '3d')
    return (
      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="viewer-loading" role="status">
              Preparing your preview…
            </div>
          }
        >
          <ThreeDCharacterRenderer appearance={appearance} name={name} />
        </Suspense>
      </ErrorBoundary>
    );
  return <CharacterPortrait appearance={appearance} name={name} emotion={emotion} />;
}
