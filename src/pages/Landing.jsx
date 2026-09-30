import { Link } from 'react-router';
import { Icon } from '../components/ui/index.jsx';
import './landing.css';

const chapters = [
  {
    number: '01',
    icon: 'menu_book',
    title: 'A path of your own.',
    text: 'Small lessons, meaningful practice, and room to grow at your own pace.',
    link: '/app/learn',
    action: 'Explore learning',
  },
  {
    number: '02',
    icon: 'forum',
    title: 'Words become stories.',
    text: 'Meet new characters and practice the conversations that make a language feel alive.',
    link: '/app/ai/characters',
    action: 'Meet the characters',
  },
  {
    number: '03',
    icon: 'explore',
    title: 'A world to share.',
    text: 'Find your study circle and discover where your new language could take you.',
    link: '/app/rooms',
    action: 'Find your community',
  },
];
export default function Landing() {
  return (
    <div className="field-guide">
      <section className="guide-hero" aria-labelledby="guide-title">
        <div className="guide-hero-copy">
          <p className="guide-kicker">
            <span />A LANGUAGE IS JUST THE BEGINNING
          </p>
          <h1 id="guide-title">
            Learn a language.
            <br />
            <em>Open a world.</em>
          </h1>
          <p className="guide-intro">
            Find your voice, meet new characters, and turn a little everyday practice into your next
            adventure.
          </p>
          <div className="guide-actions">
            <Link className="guide-button" to="/auth/register">
              Begin your journey <Icon name="arrow_forward" />
            </Link>
            <a className="guide-secondary-link" href="#the-journey">
              Take a look around
              <Icon name="south" />
            </a>
          </div>
          <div className="guide-margin-note">
            <span className="guide-note-icon">
              <Icon name="auto_stories" />
            </span>
            <p>
              A little curiosity. A few new words.
              <br />A story that’s yours to write.
            </p>
          </div>
        </div>
        <figure className="guide-hero-art">
          <img
            src="/art/traveling-scholar.png"
            width="1024"
            height="1536"
            fetchPriority="high"
            alt="An illustrated traveling scholar in an ochre scarf and rust-colored coat, carrying books amid autumn leaves."
          />
          <span className="guide-art-tag">
            <span />A world of possibilities
          </span>
          <figcaption>
            <span className="guide-caption-icon">
              <Icon name="explore" />
            </span>
            <div>
              <strong>Every adventure starts with a word.</strong>
              <span>Let curiosity lead the way.</span>
            </div>
          </figcaption>
        </figure>
      </section>

      <section className="guide-chapters" id="the-journey" aria-labelledby="chapters-title">
        <div className="guide-section-heading">
          <div>
            <p className="guide-kicker">MAKE A LITTLE ROOM FOR DISCOVERY</p>
            <h2 id="chapters-title">Your next chapter starts here.</h2>
          </div>
          <p>
            Learn a little.
            <br />
            Go a little further.
          </p>
        </div>
        <div className="guide-chapter-grid">
          {chapters.map((chapter) => (
            <article className="guide-chapter" key={chapter.number}>
              <div className="guide-chapter-index">
                <Icon name={chapter.icon} />
                <span>{chapter.number}</span>
              </div>
              <h3>{chapter.title}</h3>
              <p>{chapter.text}</p>
              <Link to={chapter.link}>
                {chapter.action}
                <Icon name="arrow_forward" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="guide-companion" id="your-guides" aria-labelledby="companion-title">
        <figure>
          <img
            src="/art/autumn-scholar.png"
            width="1024"
            height="1536"
            loading="lazy"
            decoding="async"
            alt="An illustrated scholar in an olive coat and ochre skirt, holding a book and pencil."
          />
        </figure>
        <div className="guide-companion-copy">
          <p className="guide-kicker">NEW FACES. NEW PERSPECTIVES.</p>
          <h2 id="companion-title">
            Sometimes, a whole world
            <br />
            begins with <em>hello.</em>
          </h2>
          <p>
            A greeting at a café. A question on an unfamiliar street. Practice with characters who
            give your new words a little more meaning.
          </p>
          <Link className="guide-button guide-button-outline" to="/app/ai/characters">
            Meet the characters
            <Icon name="north_east" />
          </Link>
          <div className="guide-glossary">
            <span lang="ja">ことば</span>
            <div>
              <strong>kotoba</strong>
              <p>Japanese for word, language</p>
            </div>
          </div>
        </div>
      </section>

      <section className="guide-invitation" aria-labelledby="invitation-title">
        <span className="guide-invitation-icon">
          <Icon name="auto_awesome" />
        </span>
        <p className="guide-kicker">SMALL STEPS. NEW WORLDS.</p>
        <h2 id="invitation-title">
          What will your
          <br />
          <em>next chapter</em> be?
        </h2>
        <Link className="guide-button" to="/auth/register">
          Let’s find out
          <Icon name="arrow_forward" />
        </Link>
        <p className="guide-signin">
          Already part of the story? <Link to="/auth/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
}
