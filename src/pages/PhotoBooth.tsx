import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const PhotoBooth: React.FC = () => {
  return (
    <SiteLayout
      footerLinks={[
        { label: 'Home', to: '/#home' },
        { label: 'Memorial', to: '/memorial' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Constellation accents | Downloadable keepsake | Optional upload</div>
            <h1 className="hero-title">Photo Booth</h1>
            <p className="section-lede">
              Upload a favorite photo and generate a constellation-themed keepsake. You can download it, or submit it as a tribute.
            </p>
            <div className="hero-actions">
              <Link className="cta secondary" to="/intake">Book a Reading</Link>
              <Link className="cta secondary" to="/memorial">Post to Memorial</Link>
            </div>
            <p className="mini">Tip: Choose a high-resolution photo for the sharpest result.</p>
          </div>
          <div className="stack">
            <img className="hero-logo" src="/assets/pawollelogo.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid">
            <div className="card col-6">
              <h2 className="section-title">Create your keepsake</h2>
              <form
                id="photobooth-form"
                name="pawollie-photobooth"
                method="POST"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                action="/thank-you"
                encType="multipart/form-data"
              >
                <input type="hidden" name="form-name" value="pawollie-photobooth" />
                <input type="hidden" name="owner_last_name_derived" value="" />

                <p hidden>
                  <label>Do not fill this out: <input name="bot-field" /></label>
                </p>

                <div className="notice">
                  <p className="mini">
                    Photo naming reminder: intake files should be labeled LASTNAME_1, LASTNAME_2, LASTNAME_3, and LASTNAME_4.
                    Please upload photos before completing the intake form to avoid delays.
                  </p>
                </div>

                <div className="field">
                  <label htmlFor="booth_owner_full_name">Your first and last name</label>
                  <input id="booth_owner_full_name" name="owner_full_name" autoComplete="name" required />
                </div>

                <div className="field">
                  <label htmlFor="booth_pet_name">Pet name (optional)</label>
                  <input id="booth_pet_name" name="pet_name" />
                </div>

                <div className="field">
                  <label htmlFor="booth_photo">Upload photo</label>
                  <input id="booth_photo" type="file" name="photo" accept="image/*" required />
                  <p className="help">We will generate a keepsake preview below. You can download it or submit it.</p>
                </div>

                <div className="field">
                  <span className="label">Accents</span>
                  <div className="checkbox-grid">
                    <label className="checkbox"><input id="booth_stars" type="checkbox" name="accent_stars" value="yes" defaultChecked /> Constellation sparkle overlay</label>
                    <label className="checkbox"><input id="booth_paw" type="checkbox" name="accent_paw" value="yes" defaultChecked /> Paw watermark</label>
                  </div>
                </div>

                <div className="field">
                  <span className="label">Public or private preference</span>
                  <div className="checkbox-grid">
                    <label className="checkbox"><input type="radio" name="visibility" value="private" defaultChecked /> Private</label>
                    <label className="checkbox"><input type="radio" name="visibility" value="public" /> Public</label>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="booth_message">Optional message</label>
                  <textarea id="booth_message" name="message" rows={4} placeholder="A short tribute, milestone, or memory (optional)"></textarea>
                </div>

                <div className="hero-actions">
                  <button className="cta secondary" type="button" id="booth_download">Download keepsake</button>
                  <button className="cta" type="submit">Submit tribute</button>
                </div>

                <p className="mini">
                  File handling: your upload is labeled using your last name and "photobooth" for organization.
                </p>
              </form>
            </div>

            <div className="card col-6">
              <h2 className="section-title">Preview</h2>
              <p className="section-lede">Your constellation keepsake preview appears here after you upload a photo.</p>
              <canvas id="booth_canvas" width={1200} height={1200} className="canvas-frame"></canvas>
              <p className="mini">If the preview is blank, try a different image format (JPG or PNG) or a smaller file size.</p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default PhotoBooth;
