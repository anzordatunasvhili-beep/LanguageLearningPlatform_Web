import { Link } from 'react-router';
import { Icon } from '../components/ui/index.jsx';
import CharacterRenderer from '../features/characters/CharacterRenderer.jsx';

export default function Landing() {
  return (
    <div className="landing">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">A LANGUAGE IS JUST THE BEGINNING</p>
          <h1>
            Learn a language.
            <br />
            <em>Open a world.</em>
          </h1>
          <p>
            Find your voice, meet new characters, and turn everyday practice into your next
            adventure.
          </p>
          <div className="filter-row">
            <Link className="button button-primary" to="/auth/register">
              Start your next chapter <Icon name="arrow_forward" />
            </Link>
            <Link className="text-link" to="/auth/login">
              Sign in
            </Link>
          </div>
          <div className="landing-languages">
            <span>
              <i className="japan-dot" /> Japanese
            </span>
            <span>Español</span>
            <span>Learn at your own pace</span>
          </div>
        </div>
        <div className="landing-art">
          <span className="landing-script">こんにちは</span>
          <span className="landing-edition">
            THE EVERYDAY
            <br />
            ADVENTURE / 01
          </span>
          <div className="landing-circle" />
          <CharacterRenderer name="Kotoba explorer" />
          <div className="landing-dialogue">
            <span>YOUR NEXT CHAPTER</span>
            <strong>
              Every story starts
              <br />
              with a little hello.
            </strong>
            <Icon name="north_east" />
          </div>
        </div>
      </section>
      <section className="landing-values">
        <div>
          <span>01</span>
          <Icon name="menu_book" />
          <h2>A path of your own.</h2>
          <p>Small lessons, meaningful practice, and room to grow at your own pace.</p>
        </div>
        <div>
          <span>02</span>
          <Icon name="sports_esports" />
          <h2>Make room for play.</h2>
          <p>A growing world of language games built around curiosity and discovery.</p>
        </div>
        <div>
          <span>03</span>
          <Icon name="forum" />
          <h2>Words become stories.</h2>
          <p>Practice with characters in little scenes that make language feel alive.</p>
        </div>
      </section>
      <section className="landing-invitation">
        <p className="eyebrow">YOUR WORLD IS ABOUT TO GET A LITTLE BIGGER</p>
        <h2>What will your next chapter be?</h2>
        <Link className="button button-lime" to="/auth/register">
          Let’s find out <Icon name="arrow_forward" />
        </Link>
        <p className="small">Lessons, practice, and progress saved to your account.</p>
      </section>
    </div>
  );
}
