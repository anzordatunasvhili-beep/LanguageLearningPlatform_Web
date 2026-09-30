import { Link, useParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider.jsx';
import { playerService } from '../../services/platformService.js';
import { Card, PageHeader, EmptyState, Badge } from '../../components/ui/index.jsx';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import CharacterRenderer from '../characters/CharacterRenderer.jsx';
import { portraitRepository } from '../../services/portraitRepository.js';
import '../learning/catalog.css';
export default function ProfilePage() {
  const { username } = useParams();
  const { profile, user } = useAuth();
  const isOwn = username === 'me' || username === profile?.username;
  const resource = useResource(async () => {
    const person = isOwn ? profile : await playerService.profile(username);
    return {
      person,
      player: isOwn ? await playerService.overview() : null,
      portrait: person ? await portraitRepository.load(person.id) : null,
    };
  }, [username, user?.id, profile]);
  return (
    <ResourceState resource={resource}>
      {({ person, player, portrait }) =>
        person ? (
          <div className="page-stack">
            <PageHeader
              eyebrow="PLAYER PROFILE"
              title={person.display_name}
              description={'@' + person.username}
              action={
                isOwn ? (
                  <Link className="button button-secondary" to="/app/settings">
                    Edit profile
                  </Link>
                ) : undefined
              }
            />
            <div className="tag-row">
              {portrait?.saved && (
                <CharacterRenderer
                  definition={portrait.definition}
                  name={person.display_name}
                  className="profile-portrait"
                />
              )}
              {person.country && <Badge>{person.country}</Badge>}
              <Badge>{person.is_public ? 'Public profile' : 'Private profile'}</Badge>
            </div>
            {player ? (
              <>
                <div className="stat-grid">
                  {[
                    ['Account level', 1 + Math.floor(player.progress.total_xp / 1000)],
                    ['Total XP', player.progress.total_xp],
                    ['Day streak', player.progress.current_streak],
                  ].map(([label, value]) => (
                    <Card key={label}>
                      <p className="eyebrow">{label}</p>
                      <strong className="profile-stat-value">{value}</strong>
                    </Card>
                  ))}
                </div>
                <Card>
                  <h2>Your languages</h2>
                  {player.languages.map((l) => (
                    <div className="list-row" key={l.language_id}>
                      <strong>{l.language?.name}</strong>
                      <span>{l.xp} XP</span>
                    </div>
                  ))}
                  {!player.languages.length && (
                    <p className="muted">Complete a lesson to start your journey.</p>
                  )}
                  <Link className="text-link" to="/app/avatar">
                    Customize your avatar
                  </Link>
                </Card>
              </>
            ) : (
              <p className="muted">
                Personal progress stays private. Public ranking entries are available in the
                leaderboard.
              </p>
            )}
          </div>
        ) : (
          <EmptyState
            title="Profile unavailable"
            description="This profile is private or does not exist."
          />
        )
      }
    </ResourceState>
  );
}
