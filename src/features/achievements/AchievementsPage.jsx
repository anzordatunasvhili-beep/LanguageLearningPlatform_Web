import {
  Badge,
  Card,
  EmptyState,
  Icon,
  PageHeader,
  ProgressBar,
} from '../../components/ui/index.jsx';
import { achievementService } from '../../services/catalogService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import '../learning/catalog.css';
export default function AchievementsPage() {
  const resource = useResource(
    async () => ({
      items: await achievementService.list(),
      progress: await achievementService.progress(),
    }),
    [],
  );
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR LITTLE VICTORIES"
        title="Every milestone means something."
        description="Achievements unlock automatically as you learn and play."
      />
      <ResourceState resource={resource}>
        {({ items, progress }) => (
          <>
            <div className="catalog-grid">
              {items.map((item) => {
                const saved = progress.find((p) => p.achievement_id === item.id);
                return (
                  <Card key={item.id}>
                    <Icon name={item.icon} />
                    <h2>{item.title}</h2>
                    <p className="muted">{item.description}</p>
                    <Badge>{saved?.earned_at ? 'Earned' : 'In progress'}</Badge>
                    <p>
                      {saved?.progress || 0} / {item.requirement.target} · {item.xp_reward} XP
                    </p>
                    <ProgressBar
                      value={saved?.progress || 0}
                      max={item.requirement.target}
                      label={item.title}
                    />
                  </Card>
                );
              })}
            </div>
            {!items.length && (
              <EmptyState
                title="No achievements published yet"
                description="Your platform administrator can add milestones from the admin panel."
              />
            )}
          </>
        )}
      </ResourceState>
    </div>
  );
}
