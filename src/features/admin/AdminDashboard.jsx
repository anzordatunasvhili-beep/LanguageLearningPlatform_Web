import { Link } from 'react-router';
import { Card, PageHeader } from '../../components/ui/index.jsx';
import { adminResources } from './resources.js';
import { client, unwrap, perform } from '../../services/platformService.js';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import '../learning/catalog.css';
export default function AdminDashboard() {
  const resource = useResource(async () => {
    const [users, ...counts] = await Promise.all([
      perform('admin_users'),
      ...['courses', 'lessons', 'exercises', 'games'].map((table) =>
        client().from(table).select('id', { count: 'exact', head: true }),
      ),
    ]);
    for (const result of counts) if (result.error) throw result.error;
    return { users, counts };
  }, []);
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="PLATFORM ADMINISTRATION"
        title="Create the next chapter."
        description="Manage your live content, review learners, and publish new activities."
      />
      <ResourceState resource={resource}>
        {({ users, counts }) => (
          <>
            <div className="stat-grid">
              {['Courses', 'Lessons', 'Exercises', 'Games'].map((label, i) => (
                <Card key={label}>
                  <p className="eyebrow">{label}</p>
                  <strong className="profile-stat-value">{counts[i].count}</strong>
                </Card>
              ))}
            </div>
            <div className="card-grid">
              {Object.entries(adminResources).map(([key, config]) => (
                <Link className="card text-link" key={key} to={'/admin/' + key}>
                  {config.title} →
                </Link>
              ))}
            </div>
            <Card>
              <h2>Learners</h2>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Role</th>
                      <th>XP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.display_name}</td>
                        <td>{user.username}</td>
                        <td>{user.role}</td>
                        <td>{user.total_xp || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!users.length && <p>No registered learners yet.</p>}
            </Card>
          </>
        )}
      </ResourceState>
    </div>
  );
}
