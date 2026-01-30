import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const MemorialPost: React.FC = () => {
  return (
    <SiteLayout
      footerLinks={[
        { label: 'Memorial', to: '/memorial' },
        { label: 'Services', to: '/services' },
        { label: 'Photo Booth', to: '/photobooth' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Request a Pawmark | Tribute post | Admin approved</div>
            <h1 className="hero-title">Request a Pawmark</h1>
            <p className="section-lede">
              Share a tribute, a photo, and a song. Requests are $15 for a Pawmark post only, and posts are created by the Pawollie Sense team.
            </p>
            <div className="hero-actions">
              <Link className="cta secondary" to="/memorial">Back to Memorial</Link>
            </div>
          </div>
          <div className="stack memorial-hero-aside">
            <img className="hero-logo" src="/assets/branding/oliver_globe_transparent.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
            <img className="hero-quote" src="/assets/branding/quote1.png" alt="" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">Submit a memorial request</h2>
            <form
              name="memorial-post"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              action="/thank-you"
              encType="multipart/form-data"
            >
              <input type="hidden" name="form-name" value="memorial-post" />

              <p hidden>
                <label>Do not fill this out: <input name="bot-field" /></label>
              </p>

              <div className="field">
                <label htmlFor="memorial_owner_name">Your name</label>
                <input id="memorial_owner_name" name="owner_name" required />
              </div>

              <div className="field">
                <label htmlFor="memorial_pet_name">Companion name</label>
                <input id="memorial_pet_name" name="pet_name" required />
              </div>

              <div className="field">
                <label htmlFor="memorial_message">Your message</label>
                <textarea id="memorial_message" name="message" rows={5} required></textarea>
              </div>

              <div className="field">
                <span className="label">Public or private preference</span>
                <div className="checkbox-grid">
                  <label className="checkbox"><input type="radio" name="visibility" value="private" defaultChecked /> Private</label>
                  <label className="checkbox"><input type="radio" name="visibility" value="public" /> Public</label>
                </div>
              </div>

              <div className="field">
                <label htmlFor="memorial_photo">Upload a photo</label>
                <input id="memorial_photo" type="file" name="photo" accept="image/*" required />
                <p className="help">This photo is used for the memorial feed post.</p>
              </div>

              <div className="field">
                <label htmlFor="memorial_photo_notes">Photo display notes (optional)</label>
                <textarea
                  id="memorial_photo_notes"
                  name="photo_notes"
                  rows={3}
                  placeholder="Share cropping or framing preferences for the memorial feed."
                ></textarea>
              </div>

              <div className="field">
                <label htmlFor="memorial_audio">Upload audio (optional)</label>
                <input id="memorial_audio" type="file" name="audio" accept="audio/*" />
                <p className="help">Audio plays while the post is being viewed.</p>
              </div>

              <div className="field">
                <label htmlFor="memorial_youtube">YouTube link (optional)</label>
                <input id="memorial_youtube" name="youtube_link" placeholder="https://www.youtube.com/..." />
              </div>

              <label className="checkbox">
                <input type="checkbox" name="memorial_request_ack" required />
                <span>I understand this is a request and posts are created by the Pawollie Sense team.</span>
              </label>

              <p className="mini">Requests are reviewed by an admin before appearing on the memorial feed.</p>
              <button type="submit" className="cta">Request Pawmark - $15</button>
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default MemorialPost;
