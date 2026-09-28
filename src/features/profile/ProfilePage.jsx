import { Link, useParams } from 'react-router';
import { Badge, Card, EmptyState, Icon, ProgressBar } from '../../components/ui/index.jsx';
import { useAuth } from '../auth/AuthProvider.jsx';
import { achievementService } from '../../services/catalogService.js';
import '../learning/catalog.css';

export default function ProfilePage() {
  const { username } = useParams();
  const { user, profile, isDemo } = useAuth();
  const ownUsername = profile?.username;
  if (username && username !== 'me' && username !== ownUsername)
    return (
      <EmptyState
        icon="person_search"
        title="Profile unavailable"
        description="Public profile browsing is not connected yet. You can view your own profile from the navigation."
      />
    );
  const displayName = profile?.display_name || user?.user_metadata?.display_name || 'Learner';
  return (
    <div className="page-stack">
      <Card className="profile-banner">
        <span className="profile-initials" aria-hidden="true">
          {displayName.slice(0, 2).toUpperCase()}
        </span>
        <div>
          <p className="eyebrow">YOUR PLAYER IDENTITY</p>
          <h1>{displayName}</h1>
          {ownUsername && <p className="muted">@{ownUsername}</p>}
          <div className="tag-row">
            <Badge>{isDemo ? 'Sample explorer' : 'Learner'}</Badge>
            <Link className="text-link" to="/app/avatar">
              Meet your avatar <Icon name="arrow_forward" />
            </Link>
          </div>
        </div>
      </Card>
      {isDemo ? (
        <>
          <div className="stat-grid">
            <Card>
              <p className="eyebrow">ACCOUNT LEVEL</p>
              <p className="profile-stat-value">12</p>
              <span className="muted">Sample progress</span>
            </Card>
            <Card>
              <p className="eyebrow">TOTAL XP</p>
              <p className="profile-stat-value">12,450</p>
              <span className="muted">Across your journey</span>
            </Card>
            <Card>
              <p className="eyebrow">DAY STREAK</p>
              <p className="profile-stat-value">12 days</p>
              <span className="muted">A little, every day</span>
            </Card>
          </div>
          <div className="split-grid">
            <Card className="profile-detail">
              <div>
                <p className="eyebrow">LANGUAGE JOURNEY</p>
                <h2>Japanese</h2>
                <p className="muted">A1 · Finding your voice</p>
              </div>
              <ProgressBar value={68} label="Sample Japanese course progress: 68 percent" />
              <Link className="text-link" to="/app/learn">
                Explore lessons <Icon name="arrow_forward" />
              </Link>
            </Card>
            <Card className="profile-detail">
              <div className="section-heading">
                <h2>Little victories</h2>
                <Link className="text-link" to="/app/achievements">
                  View all
                </Link>
              </div>
              {achievementService
                .list()
                .filter((item) => item.unlocked)
                .map((item) => (
                  <div className="catalog-flex" key={item.id}>
                    <span className="catalog-emblem amber">
                      <Icon name={item.icon} />
                    </span>
                    <div>
                      <h3>{item.title}</h3>
                      <p className="muted">{item.description}</p>
                    </div>
                  </div>
                ))}
            </Card>
          </div>
          <p className="catalog-disclaimer">
            This demo profile uses sample statistics and achievements. Your account identity and
            avatar are separate parts of your journey.
          </p>
        </>
      ) : (
        <Card>
          <EmptyState
            icon="auto_stories"
            title="Your story starts here"
            description="Account progression and public profile statistics will appear when connected to validated learning activity."
          />
          <Link className="button button-primary" to="/app/learn">
            Explore sample lessons
          </Link>
        </Card>
      )}
    </div>
  );
}
