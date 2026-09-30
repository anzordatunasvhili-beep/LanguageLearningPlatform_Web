import { Link } from 'react-router';
import CharacterCreator from '../characters/portrait/CharacterCreator.jsx';
import { portraitRepository } from '../../services/portraitRepository.js';
import { PageHeader } from '../../components/ui/index.jsx';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
export default function AvatarPage() {
  const resource = useResource(() => portraitRepository.load(), []);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR IDENTITY"
        title="Every story needs you."
        description="Build your portrait from painted features. Your look stays consistent across expressions."
      />
      <ResourceState resource={resource}>
        {(data) => (
          <>
            {data.setupRequired && (
              <p className="notice" role="status">
                {data.setupRequired} You can preview and export your portrait now.
              </p>
            )}
            <CharacterCreator
              initialCharacter={data.definition}
              onSave={portraitRepository.save}
              storageLabel="Save to account"
            />
          </>
        )}
      </ResourceState>
      <Link className="text-link" to="/character-lab">
        Open the portrait workshop
      </Link>
    </div>
  );
}
