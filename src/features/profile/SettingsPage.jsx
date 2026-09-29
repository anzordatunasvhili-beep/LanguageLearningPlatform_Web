import { useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { playerService } from '../../services/platformService.js';
import { learningService } from '../../services/catalogService.js';
import { Button, Card, PageHeader } from '../../components/ui/index.jsx';
import { useResource } from '../../hooks/useResource.js';
import ResourceState from '../../components/ResourceState.jsx';
import '../learning/catalog.css';
function SettingsForm({ initial, languages, profile, refreshProfile }) {
  const [values, setValues] = useState({
    ...initial,
    display_name: profile.display_name,
    username: profile.username,
    country: profile.country || '',
    is_public: profile.is_public,
    native_language_id: profile.native_language_id || '',
  });
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState('');
  function change(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
    setMessage('');
  }
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await playerService.saveProfile({
        display_name: values.display_name.trim(),
        username: values.username.toLowerCase().trim(),
        country: values.country.toUpperCase().trim() || null,
        is_public: values.is_public,
        native_language_id: values.native_language_id || null,
      });
      await playerService.saveSettings({
        timezone: values.timezone,
        daily_target: Number(values.daily_target),
        leaderboard_opt_in: values.leaderboard_opt_in,
        email_notifications: false,
        preferred_language_id: values.preferred_language_id || null,
      });
      await refreshProfile();
      setMessage('Saved to your account.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <form className="settings-form" onSubmit={save}>
        <div className="split-grid">
          <label className="field">
            Display name
            <input
              required
              maxLength={80}
              value={values.display_name}
              onChange={(e) => change('display_name', e.target.value)}
            />
          </label>
          <label className="field">
            Username
            <input
              required
              pattern="[a-z0-9_]{3,48}"
              title="3–48 lowercase letters, digits, or underscores."
              value={values.username}
              onChange={(e) => change('username', e.target.value)}
            />
          </label>
          <label className="field">
            Country code
            <input
              maxLength={2}
              pattern="[A-Za-z]{2}"
              placeholder="GE"
              value={values.country}
              onChange={(e) => change('country', e.target.value)}
            />
          </label>
          <label className="field">
            Native language
            <select
              value={values.native_language_id}
              onChange={(e) => change('native_language_id', e.target.value)}
            >
              <option value="">Not specified</option>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Learning language
            <select
              value={values.preferred_language_id || ''}
              onChange={(e) => change('preferred_language_id', e.target.value)}
            >
              <option value="">All languages</option>
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Daily target (minutes)
            <input
              type="number"
              required
              min={1}
              max={240}
              value={values.daily_target}
              onChange={(e) => change('daily_target', e.target.value)}
            />
          </label>
          <label className="field">
            Timezone
            <select value={values.timezone} onChange={(e) => change('timezone', e.target.value)}>
              {[
                ...new Set([
                  'UTC',
                  values.timezone,
                  Intl.DateTimeFormat().resolvedOptions().timeZone,
                  ...(Intl.supportedValuesOf?.('timeZone') || []),
                ]),
              ].map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={values.is_public}
            onChange={(e) => change('is_public', e.target.checked)}
          />
          Make my profile public
        </label>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={values.leaderboard_opt_in}
            onChange={(e) => change('leaderboard_opt_in', e.target.checked)}
          />
          Appear in leaderboards (requires a public profile)
        </label>
        {error && (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save settings'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
export default function SettingsPage() {
  const { profile, user, refreshProfile } = useAuth();
  const resource = useResource(
    async () => ({
      player: await playerService.overview(),
      languages: await learningService.languages(),
    }),
    [user?.id],
  );
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR ACCOUNT"
        title="Make space for learning."
        description="Your profile and preferences are saved securely across devices."
      />
      <ResourceState resource={resource}>
        {({ player, languages }) =>
          profile ? (
            <SettingsForm
              initial={player.settings}
              profile={profile}
              languages={languages}
              refreshProfile={refreshProfile}
            />
          ) : (
            <p role="alert">Your profile could not be loaded. Please sign in again.</p>
          )
        }
      </ResourceState>
    </div>
  );
}
