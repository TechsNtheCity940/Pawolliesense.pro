import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const Memorial: React.FC = () => {
  return (
    <SiteLayout
      footerLinks={[
        { label: 'Services', to: '/services' },
        { label: 'Intake', to: '/intake' },
        { label: 'Photo Booth', to: '/photobooth' }
      ]}
    >
      <section className="hero memorial-hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Legacy space | Compassion-first | Photos and music</div>
            <h1 className="hero-title">Pawmarks Memorial</h1>
            <p className="section-lede">A living space of remembrance. Share a tribute, a photo, and a song.</p>
            <div className="hero-actions memorial-actions">
              <Link className="cta secondary" to="/photobooth">Make a keepsake</Link>
              <Link className="cta secondary" to="/intake?service=pawmark_post">Request a Pawmark - $15</Link>
            </div>
            <p className="mini">Memorial posts and comments are published after admin approval.</p>
          </div>
          <div className="stack memorial-hero-aside">
            <img className="hero-logo" src="/assets/branding/oliver_globe_transparent.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
            <img className="hero-quote" src="/assets/branding/quote1.png" alt="" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid">
            <div className="card col-12">
              <h2 className="section-title">Memorial reading</h2>
              <p className="section-lede">
                The Memorial Reading is offered for pets who have passed and focuses on emotional closure, legacy, and honoring the bond.
                It symbolically interprets the pet's role, the meaning of their life with the owner, and what remains emotionally carried forward.
              </p>
              <p className="mini">
                This service does not involve claims of direct communication, mediumship, or messages from the deceased and is intentionally grounded and non-exploitative.
              </p>
              <Link className="cta secondary" to="/intake">Book a Reading</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Memorial feed</h2>
          <div className="memorial-feed-scroll">
            <div className="feed-grid feed-grid-single">
              <article className="post-card">
                <div className="post-header">
                  <h3>Oliver</h3>
                  <span className="mini">Guardian, teacher, and gentle presence</span>
                </div>
                <div className="post-media">
                  <img src="/assets/oli.png" alt="Oliver memorial portrait" />
                </div>
                <p>Always protective, always calm. Thank you for guiding us back to ourselves.</p>
                <audio controls className="post-audio">
                  <source src="" type="audio/mpeg" />
                </audio>
                <a className="mini" href="#">YouTube tribute</a>
                <form
                  className="comment-form"
                  name="memorial-comment"
                  method="POST"
                  data-netlify="true"
                  data-netlify-honeypot="bot-field"
                  action="/thank-you"
                >
                  <input type="hidden" name="form-name" value="memorial-comment" />
                  <input type="hidden" name="post_id" value="oliver" />
                  <p hidden>
                    <label>Do not fill this out: <input name="bot-field" /></label>
                  </p>
                  <label className="field">
                    <span className="label">Leave a comment</span>
                    <textarea name="comment" rows={3} required></textarea>
                  </label>
                  <p className="mini">Comments appear after admin approval.</p>
                  <button type="submit" className="cta secondary">Post Comment</button>
                </form>
              </article>

              <article className="post-card">
                <div className="post-header">
                  <h3>Zeus</h3>
                  <span className="mini">Steady strength and loyal protection</span>
                </div>
                <div className="post-media">
                  <img src="/assets/zeus.png" alt="Zeus memorial portrait" />
                </div>
                <p>Always watchful, always brave. Your presence stays with us.</p>
                <audio controls className="post-audio">
                  <source src="" type="audio/mpeg" />
                </audio>
                <a className="mini" href="#">YouTube tribute</a>
                <form
                  className="comment-form"
                  name="memorial-comment"
                  method="POST"
                  data-netlify="true"
                  data-netlify-honeypot="bot-field"
                  action="/thank-you"
                >
                  <input type="hidden" name="form-name" value="memorial-comment" />
                  <input type="hidden" name="post_id" value="zeus" />
                  <p hidden>
                    <label>Do not fill this out: <input name="bot-field" /></label>
                  </p>
                  <label className="field">
                    <span className="label">Leave a comment</span>
                    <textarea name="comment" rows={3} required></textarea>
                  </label>
                  <p className="mini">Comments appear after admin approval.</p>
                  <button type="submit" className="cta secondary">Post Comment</button>
                </form>
              </article>

              <article className="post-card">
                <div className="post-header">
                  <h3>Olivia (Little Livvey)</h3>
                  <span className="mini">Sweet comfort and playful joy</span>
                </div>
                <div className="post-media">
                  <img src="/assets/livvy.png" alt="Olivia memorial portrait" />
                </div>
                <p>Small in size, enormous in love. Your joy still lingers here.</p>
                <audio controls className="post-audio">
                  <source src="" type="audio/mpeg" />
                </audio>
                <a className="mini" href="#">YouTube tribute</a>
                <form
                  className="comment-form"
                  name="memorial-comment"
                  method="POST"
                  data-netlify="true"
                  data-netlify-honeypot="bot-field"
                  action="/thank-you"
                >
                  <input type="hidden" name="form-name" value="memorial-comment" />
                  <input type="hidden" name="post_id" value="livvy" />
                  <p hidden>
                    <label>Do not fill this out: <input name="bot-field" /></label>
                  </p>
                  <label className="field">
                    <span className="label">Leave a comment</span>
                    <textarea name="comment" rows={3} required></textarea>
                  </label>
                  <p className="mini">Comments appear after admin approval.</p>
                  <button type="submit" className="cta secondary">Post Comment</button>
                </form>
              </article>

              <article className="post-card">
                <div className="post-header">
                  <h3>Pumba</h3>
                  <span className="mini">Gentle heart and steady companionship</span>
                </div>
                <div className="post-media">
                  <img src="/assets/pumba.png" alt="Pumba memorial portrait" />
                </div>
                <p>Your warmth and comfort remain part of our daily lives.</p>
                <audio controls className="post-audio">
                  <source src="" type="audio/mpeg" />
                </audio>
                <a className="mini" href="#">YouTube tribute</a>
                <form
                  className="comment-form"
                  name="memorial-comment"
                  method="POST"
                  data-netlify="true"
                  data-netlify-honeypot="bot-field"
                  action="/thank-you"
                >
                  <input type="hidden" name="form-name" value="memorial-comment" />
                  <input type="hidden" name="post_id" value="pumba" />
                  <p hidden>
                    <label>Do not fill this out: <input name="bot-field" /></label>
                  </p>
                  <label className="field">
                    <span className="label">Leave a comment</span>
                    <textarea name="comment" rows={3} required></textarea>
                  </label>
                  <p className="mini">Comments appear after admin approval.</p>
                  <button type="submit" className="cta secondary">Post Comment</button>
                </form>
              </article>

              <article className="post-card">
                <div className="post-header">
                  <h3>Thomas</h3>
                  <span className="mini">Memorial entry coming soon</span>
                </div>
                <div className="post-media"><span>Photo coming soon</span></div>
                <p>A space reserved in honor of Thomas.</p>
                <form
                  className="comment-form"
                  name="memorial-comment"
                  method="POST"
                  data-netlify="true"
                  data-netlify-honeypot="bot-field"
                  action="/thank-you"
                >
                  <input type="hidden" name="form-name" value="memorial-comment" />
                  <input type="hidden" name="post_id" value="thomas" />
                  <p hidden>
                    <label>Do not fill this out: <input name="bot-field" /></label>
                  </p>
                  <label className="field">
                    <span className="label">Leave a comment</span>
                    <textarea name="comment" rows={3} required></textarea>
                  </label>
                  <p className="mini">Comments appear after admin approval.</p>
                  <button type="submit" className="cta secondary">Post Comment</button>
                </form>
              </article>

              <article className="post-card">
                <div className="post-header">
                  <h3>Toot</h3>
                  <span className="mini">Memorial entry coming soon</span>
                </div>
                <div className="post-media"><span>Photo coming soon</span></div>
                <p>A space reserved in honor of Toot.</p>
                <form
                  className="comment-form"
                  name="memorial-comment"
                  method="POST"
                  data-netlify="true"
                  data-netlify-honeypot="bot-field"
                  action="/thank-you"
                >
                  <input type="hidden" name="form-name" value="memorial-comment" />
                  <input type="hidden" name="post_id" value="toot" />
                  <p hidden>
                    <label>Do not fill this out: <input name="bot-field" /></label>
                  </p>
                  <label className="field">
                    <span className="label">Leave a comment</span>
                    <textarea name="comment" rows={3} required></textarea>
                  </label>
                  <p className="mini">Comments appear after admin approval.</p>
                  <button type="submit" className="cta secondary">Post Comment</button>
                </form>
              </article>
            </div>
          </div>
        </div>
      </section>

    </SiteLayout>
  );
};

export default Memorial;
