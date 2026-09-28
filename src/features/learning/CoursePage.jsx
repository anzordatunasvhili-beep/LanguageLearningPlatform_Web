import { Link, useParams } from 'react-router';
import { Badge, Card, EmptyState, Icon, PageHeader } from '../../components/ui/index.jsx';
import { learningService } from '../../services/catalogService.js';
import './catalog.css';

export default function CoursePage() {
  const { courseId } = useParams();
  const course = learningService.getCourse(courseId);
  if (!course)
    return (
      <EmptyState
        icon="menu_book"
        title="Course not found"
        description="Return to Learn to browse the available sample courses."
      />
    );
  if (course.status !== 'available')
    return (
      <div className="page-stack">
        <Link to="/app/learn" className="text-link">
          <Icon name="arrow_back" /> All courses
        </Link>
        <EmptyState
          icon="auto_stories"
          title="A future chapter"
          description={`${course.title} is planned. Its lessons are not available for practice yet.`}
        />
      </div>
    );
  return (
    <div className="page-stack">
      <Link to="/app/learn" className="text-link">
        <Icon name="arrow_back" /> All courses
      </Link>
      <PageHeader
        eyebrow={`${course.level} · SAMPLE COURSE`}
        title={course.title}
        description={course.description}
      />
      <div className="course-units">
        {learningService.listUnits(course.id).map((unit) => (
          <Card key={unit.id}>
            <div className="unit-heading">
              <span className="unit-number">{String(unit.number).padStart(2, '0')}</span>
              <div>
                <p className="eyebrow">UNIT {unit.number}</p>
                <h2>{unit.title}</h2>
                <p className="muted">{unit.description}</p>
              </div>
            </div>
            {learningService.listLessons(unit.id).map((lesson) => (
              <div className="lesson-row" key={lesson.id}>
                <div className="lesson-mark">
                  <Icon name={lesson.status === 'available' ? 'play_arrow' : 'lock'} />
                </div>
                <div className="lesson-description">
                  <h3>{lesson.title}</h3>
                  <p className="muted">{lesson.description}</p>
                </div>
                <span className="muted">{lesson.minutes} min</span>
                {lesson.status === 'available' ? (
                  <Link to={`/app/lesson/${lesson.id}`} className="button button-secondary">
                    Practice <Icon name="arrow_forward" />
                  </Link>
                ) : (
                  <Badge>Planned</Badge>
                )}
              </div>
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
