import { Link } from 'react-router';
import { useAuth } from '../features/auth/AuthProvider.jsx';
import { dailyQuests, skillProgress } from '../data/dashboard.js';
import { characters } from '../data/characters.js';
import CharacterRenderer from '../features/characters/CharacterRenderer.jsx';
import { Badge, Card, Icon, ProgressBar } from '../components/ui/index.jsx';

export default function Dashboard() {
  const { profile } = useAuth();
  return (
    <div className="dashboard page-stack">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">A LITTLE EVERY DAY GOES A LONG WAY</p>
          <h1>
            Your next chapter, <em>{profile?.display_name || 'explorer'}.</em>
          </h1>
          <p className="muted">A new word. A new connection. A little more of the world.</p>
        </div>
        <div className="dashboard-date">
          <Icon name="wb_sunny" />
          <span>
            Make today
            <br />
            <strong>a good story.</strong>
          </span>
        </div>
      </header>
      <div className="dashboard-columns">
        <div className="dashboard-primary">
          <section className="journey-hero">
            <div className="journey-copy">
              <span className="outline-pill">
                <span className="status-dot" /> YOUR JAPANESE JOURNEY
              </span>
              <p className="hero-chapter">
                CHAPTER 01 <span>—</span> EVERYDAY BEGINNINGS
              </p>
              <h2>
                A whole new world
                <br />
                starts with <em>hello.</em>
              </h2>
              <p>
                Find your voice in Japanese.
                <br />
                One small conversation at a time.
              </p>
              <Link className="button button-lime" to="/app/lesson/ja-hello">
                Continue learning <Icon name="arrow_forward" />
              </Link>
              <div className="hero-meta">
                <span>
                  <Icon name="schedule" /> 5-minute practice
                </span>
                <span>
                  <Icon name="school" /> A1 · Foundations
                </span>
              </div>
            </div>
            <div className="japan-art" aria-hidden="true">
              <div className="sun-disc" />
              <span className="japan-calligraphy">
                始<br />ま<br />り
              </span>
              <div className="mountain mountain-back" />
              <div className="mountain mountain-front" />
              <div className="torii">
                <i />
                <b />
                <span />
                <em />
              </div>
              <div className="art-ground" />
              <span className="art-caption">THE ART OF BEGINNING</span>
            </div>
          </section>
          <div className="journey-stats">
            <div>
              <span className="stat-icon">
                <Icon name="language" />
              </span>
              <div>
                <small>Language level</small>
                <strong>
                  A1 <span>Explorer</span>
                </strong>
              </div>
            </div>
            <div>
              <span className="stat-icon gold">
                <Icon name="bolt" />
              </span>
              <div>
                <small>Sample account XP</small>
                <strong>
                  12,450 <span>XP</span>
                </strong>
              </div>
            </div>
            <div>
              <span className="stat-icon rose">
                <Icon name="local_fire_department" />
              </span>
              <div>
                <small>Sample streak</small>
                <strong>
                  12 <span>days & counting</span>
                </strong>
              </div>
            </div>
          </div>
          <section>
            <div className="section-heading">
              <h2>A different way to practice</h2>
              <Link className="text-link" to="/app/games">
                Explore games <Icon name="arrow_forward" />
              </Link>
            </div>
            <div className="practice-grid">
              <Link className="practice-card practice-dungeon" to="/app/games/word-dungeon">
                <span className="practice-number">01 / PLAY</span>
                <div className="mini-art">
                  <Icon name="castle" />
                  <span>言</span>
                </div>
                <div>
                  <Badge>COMING LATER</Badge>
                  <h3>Word Dungeon</h3>
                  <p>Words are your way forward.</p>
                  <span className="practice-link">
                    Vocabulary adventure <Icon name="north_east" />
                  </span>
                </div>
              </Link>
              <Link className="practice-card practice-typing" to="/app/games/typing-trails">
                <span className="practice-number">02 / FIND YOUR FLOW</span>
                <div className="typing-art" aria-hidden="true">
                  <span>h</span>
                  <span>o</span>
                  <span>l</span>
                  <span>a</span>
                </div>
                <div>
                  <Badge>COMING LATER</Badge>
                  <h3>Typing Trails</h3>
                  <p>A little focus. A lot of possibility.</p>
                  <span className="practice-link">
                    Writing & vocabulary <Icon name="north_east" />
                  </span>
                </div>
              </Link>
            </div>
          </section>
          <section className="meet-card">
            <div className="meet-art">
              <span>水野</span>
              <CharacterRenderer name="Haruka" appearance={characters[0].appearance} />
            </div>
            <div className="meet-copy">
              <p className="eyebrow">SOMEONE NEW TO SAY HELLO TO</p>
              <h2>
                A coffee with <em>Haruka.</em>
              </h2>
              <p>
                Your table is waiting in Shimokitazawa.
                <br />
                Let’s turn a few words into a conversation.
              </p>
              <Link className="text-link" to="/app/ai/characters/haruka">
                Meet Haruka <Icon name="arrow_forward" />
              </Link>
              <span className="small muted">Japanese · Scripted scene preview</span>
            </div>
            <span className="meet-stamp">
              TOKYO
              <br />
              <b>東京</b>
            </span>
          </section>
        </div>
        <aside className="dashboard-secondary">
          <Card className="quest-card">
            <div className="section-heading">
              <h2>Small steps, big things.</h2>
              <Icon name="wb_twilight" />
            </div>
            <p className="muted small">Your daily quests · sample progress</p>
            <div className="quest-summary">
              <strong>
                0 <span>/ 3 complete</span>
              </strong>
              <span>175 XP available</span>
            </div>
            <ProgressBar value={0} label="Sample daily quests completed" />
            <div className="quest-list">
              {dailyQuests.map((quest) => (
                <Link className="quest-item" to={quest.to} key={quest.title}>
                  <span className="quest-icon">
                    <Icon name={quest.icon} />
                  </span>
                  <div>
                    <h3>{quest.title}</h3>
                    <p>{quest.detail}</p>
                    <div className="quest-progress">
                      <ProgressBar value={quest.current} max={quest.total} label={quest.title} />
                      <span>
                        {quest.current}/{quest.total}
                      </span>
                    </div>
                  </div>
                  <span className="quest-xp">+{quest.xp}</span>
                </Link>
              ))}
            </div>
            <div className="quest-footer">
              <Icon name="auto_awesome" /> A little progress is still progress.
            </div>
          </Card>
          <Card className="skills-card">
            <div className="section-heading">
              <h2>Finding your balance</h2>
              <Icon name="tune" />
            </div>
            <p className="muted small">A sample of your skills in Japanese</p>
            {skillProgress.map((skill) => (
              <div className="skill-row" key={skill.name}>
                <div>
                  <span>
                    <Icon name={skill.icon} />
                    {skill.name}
                  </span>
                  <small>Lv. {skill.level}</small>
                </div>
                <ProgressBar value={skill.percent} label={`${skill.name} sample progress`} />
              </div>
            ))}
            <Link className="text-link" to="/app/learn">
              Grow your skills <Icon name="arrow_forward" />
            </Link>
          </Card>
          <Link className="world-card" to="/app/opportunities">
            <div className="world-card-top">
              <Icon name="travel_explore" />
              <span>BEYOND THE SCREEN</span>
            </div>
            <h2>
              Where could
              <br />
              your words
              <br />
              <em>take you?</em>
            </h2>
            <p>Discover a world of possibilities.</p>
            <span className="text-link">
              Explore opportunities <Icon name="north_east" />
            </span>
            <div className="world-orbit" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  );
}
