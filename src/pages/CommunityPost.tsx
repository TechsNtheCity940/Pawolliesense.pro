import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const BLOCKED_PATTERNS: RegExp[] = [
  /\b(hate|hateful|racist|sexist|bigot|slur)\b/i,
  /\b(violence|violent|abuse|abusive|cruel|cruelty|torture|kill|murder)\b/i,
  /\b(sexual|porn|nsfw|explicit)\b/i,
  /\b(drug|drugs|meth|cocaine|heroin)\b/i
];

const CommunityPost: React.FC = () => {
  const [error, setError] = useState('');

  const hasBlockedContent = (value: string) =>
    BLOCKED_PATTERNS.some((pattern) => pattern.test(value));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setError('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = [
      data.get('username'),
      data.get('pet_names'),
      data.get('caption')
    ]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
      .join(' ');

    if (values && hasBlockedContent(values)) {
      event.preventDefault();
      setError('This post appears to include content that violates our community guidelines. Please revise and try again.');
    }
  };

  return (
    <SiteLayout
      footerLinks={[
        { label: 'Community', to: '/community' },
        { label: 'Services', to: '/services' },
        { label: 'Memorial', to: '/memorial' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Community post | Gentle sharing | Guidelines first</div>
            <h1 className="hero-title">Share Your Companion</h1>
            <p className="section-lede">
              Share a moment, a memory, or a gentle update. We screen for harmful or unethical content to keep this space safe.
            </p>
            <div className="hero-actions">
              <Link className="cta secondary" to="/community">Back to Community</Link>
            </div>
          </div>
          <div className="stack">
            <img className="hero-logo" src="/assets/pawollelogo.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">Create your post</h2>
            <p className="section-lede">Posts with hateful, abusive, graphic, or exploitative content are blocked.</p>
            {error ? <p className="error" role="alert">{error}</p> : null}
            <form
              name="community-post"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              action="/thank-you"
              encType="multipart/form-data"
              onSubmit={handleSubmit}
            >
              <input type="hidden" name="form-name" value="community-post" />
              <p hidden>
                <label>Do not fill this out: <input name="bot-field" /></label>
              </p>

              <div className="field">
                <label htmlFor="community_post_username">Username</label>
                <input id="community_post_username" name="username" required />
              </div>

              <div className="field">
                <label htmlFor="community_post_pet_names">Pet name(s)</label>
                <input id="community_post_pet_names" name="pet_names" placeholder="Luna, Olive, Theo" required />
              </div>

              <div className="field">
                <label htmlFor="community_post_caption">Caption</label>
                <textarea id="community_post_caption" name="caption" rows={4} placeholder="Share the moment, memory, or update"></textarea>
              </div>

              <div className="field">
                <label htmlFor="community_post_photo">Upload a photo</label>
                <input id="community_post_photo" type="file" name="photo" accept="image/*" required />
                <p className="help">Images should be clear, well-lit, and respectful of pets and people.</p>
              </div>

              <label className="checkbox">
                <input type="checkbox" name="community_guidelines" required />
                <span>I confirm this post is respectful, non-graphic, and free of hateful or abusive content.</span>
              </label>

              <button type="submit" className="cta">Post to Community</button>
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default CommunityPost;
