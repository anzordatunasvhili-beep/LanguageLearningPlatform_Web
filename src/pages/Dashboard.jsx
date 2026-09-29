import { Link } from 'react-router';
import { useAuth } from '../features/auth/AuthProvider.jsx';
import { playerService } from '../services/platformService.js';
import { learningService, characterService } from '../services/catalogService.js';
import { useResource } from '../hooks/useResource.js';
import ResourceState from '../components/ResourceState.jsx';
import { Card, Icon, ProgressBar, PageHeader, EmptyState } from '../components/ui/index.jsx';
export default function Dashboard() {
  const { profile, user } = useAuth();
  const resource = useResource(async () => {
    const [player, courses, characters] = await Promise.all([
      playerService.overview(),
      learningService.listCourses(),
      characterService.list(),
    ]);
    return { player, courses, characters };
  }, [user?.id]);
  return (
    <div className="dashboard page-stack">
      <PageHeader
        eyebrow="A LITTLE EVERY DAY GOES A LONG WAY"
        title={'Your next chapter, ' + (profile?.display_name || 'explorer') + '.'}
        description="Your learning, achievements, and next steps—all in one place."
      />
      <ResourceState resource={resource}>
        {({ player, courses, characters }) => {
          const course =
            courses.find((c) => c.language_id === player.settings.preferred_language_id) ||
            courses[0];
          const today = player.daily.find((d) => d.activity_date === player.today);
          return (
            <>
              <div className="dashboard-columns">
                <div className="dashboard-primary">
                  <section className="journey-hero">
                    <div className="journey-copy">
                      <span className="outline-pill">YOUR LANGUAGE JOURNEY</span>
                      <p className="hero-chapter">
                        {course?.language?.name || 'DISCOVER A NEW LANGUAGE'}
                      </p>
                      <h2>{course?.title || 'Your story starts here.'}</h2>
                      <p>
                        {course?.description ||
                          'Explore published courses and take your first step.'}
                      </p>
                      <Link
                        className="button button-lime"
                        to={course ? '/app/course/' + course.id : '/app/learn'}
                      >
                        {course ? 'Continue learning' : 'Explore courses'}
                        <Icon name="arrow_forward" />
                      </Link>
                    </div>
                    <div className="japan-art" aria-hidden="true">
                      <div className="sun-disc" />
                      <div className="mountain mountain-back" />
                      <div className="mountain mountain-front" />
                    </div>
                  </section>
                  <div className="journey-stats">
                    <div>
                      <span className="stat-icon gold">
                        <Icon name="bolt" />
                      </span>
                      <div>
                        <small>Total XP</small>
                        <strong>{player.progress.total_xp.toLocaleString()}</strong>
                      </div>
                    </div>
                    <div>
                      <span className="stat-icon rose">
                        <Icon name="local_fire_department" />
                      </span>
                      <div>
                        <small>Current streak</small>
                        <strong>
                          {player.progress.current_streak}
                          <span>days</span>
                        </strong>
                      </div>
                    </div>
                    <div>
                      <span className="stat-icon">
                        <Icon name="school" />
                      </span>
                      <div>
                        <small>Completed lessons</small>
                        <strong>{player.lessons.filter((l) => l.completed_at).length}</strong>
                      </div>
                    </div>
                  </div>
                  <Card>
                    <div className="section-heading">
                      <h2>Your languages</h2>
                      <Link className="text-link" to="/app/learn">
                        Explore courses <Icon name="arrow_forward" />
                      </Link>
                    </div>
                    {player.languages.length ? (
                      player.languages.map((language) => (
                        <div className="list-row" key={language.language_id}>
                          <div>
                            <strong>{language.language?.name}</strong>
                            <p className="muted small">
                              {language.assessed_level
                                ? 'Assessed level: ' + language.assessed_level
                                : 'Proficiency not yet assessed'}
                            </p>
                          </div>
                          <span>{language.xp} XP</span>
                        </div>
                      ))
                    ) : (
                      <p className="muted">
                        Complete your first lesson to begin tracking a language.
                      </p>
                    )}
                  </Card>
                  <Card>
                    <div className="section-heading">
                      <h2>Recent lessons</h2>
                      <Link className="text-link" to="/app/learn">
                        All courses
                      </Link>
                    </div>
                    {player.lessons.length ? (
                      player.lessons.slice(0, 5).map((p) => (
                        <div className="list-row" key={p.lesson_id}>
                          <div>
                            <strong>{p.lesson?.title}</strong>
                            <p className="muted small">
                              {p.best_accuracy}% best accuracy · {p.attempts} attempts
                            </p>
                          </div>
                          <Link
                            className="button button-secondary"
                            to={'/app/lesson/' + p.lesson_id}
                          >
                            Review
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="muted">Your saved lesson results will appear here.</p>
                    )}
                  </Card>
                  {characters[0] && (
                    <Card>
                      <p className="eyebrow">PRACTICE A CONVERSATION</p>
                      <h2>Meet {characters[0].name}</h2>
                      <p className="muted">{characters[0].biography}</p>
                      <Link className="text-link" to={'/app/ai/characters/' + characters[0].id}>
                        Meet your conversation partner <Icon name="arrow_forward" />
                      </Link>
                    </Card>
                  )}
                </div>
                <aside className="dashboard-secondary">
                  <Card>
                    <h2>Your daily goal</h2>
                    <p className="muted">
                      {today?.minutes || 0} / {player.settings.daily_target} minutes
                    </p>
                    <ProgressBar
                      value={today?.minutes || 0}
                      max={player.settings.daily_target}
                      label="Daily learning target"
                    />
                    <p className="muted small">Time from completed learning and game sessions.</p>
                    <Link className="text-link" to="/app/settings">
                      Adjust your goal
                    </Link>
                  </Card>
                  <Card>
                    <h2>Daily quests</h2>
                    {player.quests
                      .filter((q) => q.kind === 'daily')
                      .map((quest) => {
                        const progress = player.questProgress.find(
                          (p) => p.quest_id === quest.id && p.period_start === player.today,
                        );
                        return (
                          <div className="quest-item" key={quest.id}>
                            <Icon name={progress?.completed_at ? 'check_circle' : 'flag'} />
                            <div>
                              <h3>{quest.title}</h3>
                              <p>
                                {progress?.progress || 0} / {quest.requirement.target} ·{' '}
                                {quest.xp_reward} XP
                              </p>
                              <ProgressBar
                                value={progress?.progress || 0}
                                max={quest.requirement.target}
                                label={quest.title}
                              />
                            </div>
                          </div>
                        );
                      })}
                    {!player.quests.length && <p className="muted">No active quests yet.</p>}
                  </Card>
                  <Card>
                    <h2>Your achievements</h2>
                    {player.achievements
                      .filter((a) => a.earned_at)
                      .map((a) => (
                        <div className="list-row" key={a.achievement_id}>
                          <Icon name={a.achievement?.icon || 'emoji_events'} />
                          <strong>{a.achievement?.title}</strong>
                        </div>
                      ))}
                    {!player.achievements.some((a) => a.earned_at) && (
                      <p className="muted">Your next milestone is waiting.</p>
                    )}
                    <Link className="text-link" to="/app/achievements">
                      View achievements
                    </Link>
                  </Card>
                  <Link className="world-card" to="/app/opportunities">
                    <div className="world-card-top">
                      <Icon name="travel_explore" />
                      BEYOND THE SCREEN
                    </div>
                    <h2>
                      Where could
                      <br />
                      your words
                      <br />
                      <em>take you?</em>
                    </h2>
                    <span className="text-link">
                      Browse published opportunities
                      <Icon name="north_east" />
                    </span>
                  </Link>
                </aside>
              </div>
            </>
          );
        }}
      </ResourceState>
    </div>
  );
}
