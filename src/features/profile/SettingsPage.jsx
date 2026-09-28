import { useState } from 'react';
import { Badge, Button, Card, PageHeader } from '../../components/ui/index.jsx';
import { readPreferences, savePreferences } from './preferences.js';
import '../learning/catalog.css';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState(readPreferences);
  const [message, setMessage] = useState('');
  function save(event) {
    event.preventDefault();
    const saved = savePreferences(preferences);
    setMessage(
      saved === false
        ? 'Your browser could not save these preferences. Please enable local storage and try again.'
        : 'Saved on this browser. Your Learn page will use these preferences.',
    );
  }
  function change(key, value) {
    setPreferences({ ...preferences, [key]: value });
    setMessage('');
  }
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="YOUR OWN RHYTHM"
        title="Make space for learning."
        description="Choose a comfortable daily target and the language you want to see first."
        action={<Badge>Browser preferences</Badge>}
      />
      <Card>
        <form className="settings-form" onSubmit={save}>
          <label className="field">
            <span>Preferred language</span>
            <select
              value={preferences.language}
              onChange={(event) => change('language', event.target.value)}
            >
              <option value="all">Show all languages</option>
              <option value="ja">Japanese</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </label>
          <label className="field">
            <span>Daily learning target</span>
            <select
              value={preferences.dailyMinutes}
              onChange={(event) => change('dailyMinutes', Number(event.target.value))}
            >
              {[5, 10, 15, 20].map((minutes) => (
                <option value={minutes} key={minutes}>
                  {minutes} minutes a day
                </option>
              ))}
            </select>
          </label>
          <p className="muted">
            These preferences are stored on this browser. They do not update your public profile or
            sync across devices.
          </p>
          <div>
            <Button type="submit">Save preferences</Button>
          </div>
          {message && (
            <p role="status" className="form-message">
              {message}
            </p>
          )}
        </form>
      </Card>
    </div>
  );
}
