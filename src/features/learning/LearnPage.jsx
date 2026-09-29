import { useState } from 'react';
import { Link } from 'react-router';
import { Badge, Card, EmptyState, Icon, PageHeader } from '../../components/ui/index.jsx';
import { learningService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import './catalog.css';
export default function LearnPage() {
  const [filter, setFilter] = useState('all');
  const resource = useResource(async () => {
    const [languages, courses] = await Promise.all([
      learningService.languages(),
      learningService.listCourses(),
    ]);
    return { languages, courses };
  }, []);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR NEXT CHAPTER"
        title="A world in your own words."
        description="Choose a course and build your skills. Completed lessons save to your account."
      />
      <ResourceState resource={resource}>
        {({ languages, courses }) => (
          <>
            <div className="filter-row">
              <button
                className={'filter-chip ' + (filter === 'all' ? 'active' : '')}
                onClick={() => setFilter('all')}
                aria-pressed={filter === 'all'}
              >
                All languages
              </button>
              {languages.map((language) => (
                <button
                  key={language.id}
                  className={'filter-chip ' + (filter === language.id ? 'active' : '')}
                  onClick={() => setFilter(language.id)}
                  aria-pressed={filter === language.id}
                >
                  {language.native_name} · {language.name}
                </button>
              ))}
            </div>
            <div className="catalog-grid">
              {courses
                .filter((c) => filter === 'all' || c.language_id === filter)
                .map((course) => (
                  <Card className="catalog-card" key={course.id}>
                    <div className="catalog-visual sage">
                      <span className="language-glyph">{course.language?.code.toUpperCase()}</span>
                    </div>
                    <div className="catalog-body">
                      <div className="tag-row">
                        <Badge>{course.language?.name}</Badge>
                        <Badge>{course.level}</Badge>
                      </div>
                      <h2>{course.title}</h2>
                      <p className="muted">{course.description}</p>
                      <p className="catalog-meta">{course.units.length} units</p>
                      <Link to={'/app/course/' + course.id} className="button button-primary">
                        Explore course <Icon name="arrow_forward" />
                      </Link>
                    </div>
                  </Card>
                ))}
            </div>
            {!courses.filter((c) => filter === 'all' || c.language_id === filter).length && (
              <EmptyState
                title="No courses published yet"
                description="Published courses will appear here when an administrator adds them."
              />
            )}
          </>
        )}
      </ResourceState>
    </div>
  );
}
