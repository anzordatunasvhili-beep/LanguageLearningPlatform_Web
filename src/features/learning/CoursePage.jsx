import { Link, useParams } from 'react-router';
import { Card, EmptyState, Icon, PageHeader, Badge } from '../../components/ui/index.jsx';
import { learningService } from '../../services/catalogService.js';
import { client, unwrap } from '../../services/platformService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import './catalog.css';
export default function CoursePage() {
  const { courseId } = useParams();
  const resource = useResource(
    async () => ({
      course: await learningService.course(courseId),
      progress: await unwrap(client().from('lesson_progress').select('*')),
    }),
    [courseId],
  );
  return (
    <div className="page-stack">
      <Link className="text-link" to="/app/learn">
        <Icon name="arrow_back" />
        All courses
      </Link>
      <ResourceState resource={resource}>
        {({ course, progress }) =>
          course ? (
            <>
              <PageHeader
                eyebrow={course.language?.name + ' · ' + course.level}
                title={course.title}
                description={course.description}
              />
              <div className="course-units">
                {course.units.map((unit) => (
                  <Card key={unit.id}>
                    <div className="unit-heading">
                      <span className="unit-number">{unit.position}</span>
                      <h2>{unit.title}</h2>
                    </div>
                    {unit.lessons.map((lesson) => {
                      const saved = progress.find((p) => p.lesson_id === lesson.id);
                      return (
                        <div className="lesson-row" key={lesson.id}>
                          <div className="lesson-mark">
                            <Icon name={saved?.completed_at ? 'check_circle' : 'play_arrow'} />
                          </div>
                          <div className="lesson-description">
                            <h3>{lesson.title}</h3>
                            <p className="muted">
                              {lesson.estimated_minutes} minutes · {lesson.xp_reward} XP on first
                              completion
                            </p>
                          </div>
                          {saved && <Badge>{saved.best_accuracy}% best</Badge>}
                          <Link className="button button-secondary" to={'/app/lesson/' + lesson.id}>
                            {saved?.completed_at ? 'Review' : 'Start lesson'}
                          </Link>
                        </div>
                      );
                    })}
                    {!unit.lessons.length && (
                      <p className="muted">No lessons published in this unit yet.</p>
                    )}
                  </Card>
                ))}
              </div>
              {!course.units.length && (
                <EmptyState
                  title="Lessons are being prepared"
                  description="This course has no published units yet."
                />
              )}
            </>
          ) : (
            <EmptyState
              title="Course unavailable"
              description="This course may be unpublished or removed."
            />
          )
        }
      </ResourceState>
    </div>
  );
}
