import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { Badge, Card, EmptyState, Icon, PageHeader } from '../../components/ui/index.jsx';
import { languages } from '../../data/catalog.js';
import { learningService } from '../../services/catalogService.js';
import { readPreferences } from '../profile/preferences.js';
import './catalog.css';

export default function LearnPage() {
  const { languageId } = useParams();
  const [preferences] = useState(readPreferences);
  const [filter, setFilter] = useState(languageId || preferences.language);
  const visible = learningService
    .listCourses()
    .filter((course) => filter === 'all' || course.languageId === filter);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR NEXT CHAPTER"
        title="A world in your own words."
        description="Small discoveries. Everyday confidence. Find your path into a new language."
        action={<Badge>Sample content</Badge>}
      />
      <div className="filter-row" role="group" aria-label="Filter by language">
        <button
          className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
          aria-pressed={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All languages
        </button>
        {languages.map((language) => (
          <button
            className={`filter-chip ${filter === language.id ? 'active' : ''}`}
            key={language.id}
            aria-pressed={filter === language.id}
            onClick={() => setFilter(language.id)}
          >
            {language.nativeName} <span>{language.name}</span>
          </button>
        ))}
      </div>
      <div className="catalog-grid">
        {visible.map((course) => (
          <Card className="catalog-card" key={course.id}>
            <div className={`catalog-visual ${course.color}`} aria-hidden="true">
              <span className="language-glyph">{course.icon}</span>
              <span className="catalog-visual-caption">A LITTLE EVERY DAY</span>
            </div>
            <div className="catalog-body">
              <div className="tag-row">
                <Badge>
                  {languages.find((language) => language.id === course.languageId)?.name}
                </Badge>
                <span className="muted">{course.level} · Beginner</span>
              </div>
              <h2>{course.title}</h2>
              <p className="muted">{course.description}</p>
              <p className="catalog-meta">
                <Icon name="menu_book" />
                {course.unitCount} {course.unitCount === 1 ? 'unit' : 'units'}
                <span>·</span>
                {course.minutes}-minute lessons
              </p>
              {course.status === 'available' ? (
                <Link to={`/app/course/${course.id}`} className="button button-primary">
                  Explore course <Icon name="arrow_forward" />
                </Link>
              ) : (
                <Badge>Coming in a future chapter</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
      {!visible.length && (
        <EmptyState
          icon="school"
          title="No courses here yet"
          description="Choose another language to explore the sample curriculum."
        />
      )}
      <div className="notice">
        <Icon name="info" />
        <p>
          Your daily target is {preferences.dailyMinutes} minutes. Try the sample lessons at your
          own pace. Practice results stay in this session and do not award account XP.
        </p>
      </div>
    </div>
  );
}
