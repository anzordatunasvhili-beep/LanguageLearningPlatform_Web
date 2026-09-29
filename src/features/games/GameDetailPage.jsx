import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '../auth/AuthProvider.jsx';
import { Card, PageHeader, Badge, EmptyState } from '../../components/ui/index.jsx';
import { gameService, learningService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import '../learning/catalog.css';
export default function GameDetailPage() {
  const { gameId } = useParams();
  const { user } = useAuth();
  const [lessonId, setLessonId] = useState('');
  const resource = useResource(
    async () => ({ game: await gameService.get(gameId), lessons: await learningService.lessons() }),
    [gameId],
  );
  return (
    <ResourceState resource={resource}>
      {({ game, lessons }) => {
        if (!game)
          return <EmptyState title="Game unavailable" description="This game is not published." />;
        const release = game.releases
          .filter(
            (r) =>
              r.status === 'published' &&
              r.platform === 'web' &&
              ['word-dungeon', 'typing-trails', 'sentence-builder'].includes(r.metadata?.engine),
          )
          .sort((a, b) => new Date(b.released_at) - new Date(a.released_at))[0];
        const selected = lessonId || lessons[0]?.id;
        return (
          <div className="page-stack">
            <PageHeader
              eyebrow="PRACTICE & PLAY"
              title={game.name}
              description={game.description}
            />
            <div className="tag-row">
              {game.skills.map((skill) => (
                <Badge key={skill}>{skill}</Badge>
              ))}
            </div>
            <Card>
              <h2>Start a challenge</h2>
              <p className="muted">
                Choose your lesson content. Each correct answer earns 100 points. Results save to
                your account; game XP is awarded once per game per day.
              </p>
              {release && lessons.length ? (
                <>
                  <label className="field">
                    Practice content
                    <select value={selected} onChange={(e) => setLessonId(e.target.value)}>
                      {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.unit?.course?.title} · {lesson.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="filter-row" style={{ marginTop: 20 }}>
                    <Link
                      className="button button-primary"
                      to={
                        user ? '/app/lesson/' + selected + '?release=' + release.id : '/auth/login'
                      }
                    >
                      {user ? 'Play now' : 'Sign in to play'}
                    </Link>
                    <Badge>Version {release.version}</Badge>
                  </div>
                </>
              ) : (
                <p>
                  No playable release or lesson content has been published for this game yet.
                  Administrators can configure releases and lessons in the content studio.
                </p>
              )}
            </Card>
            {game.releases
              .filter((r) => r.status === 'published' && r.download_url?.startsWith('https://'))
              .map((release) => (
                <Card key={release.id}>
                  <h2>
                    {release.platform} · {release.version}
                  </h2>
                  <a
                    className="button button-secondary"
                    href={release.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Download release
                  </a>
                </Card>
              ))}
          </div>
        );
      }}
    </ResourceState>
  );
}
