import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const Faq: React.FC = () => {
  return (
    <SiteLayout
      footerLinks={[
        { label: 'Services', to: '/services' },
        { label: 'Intake', to: '/intake' },
        { label: 'About', to: '/about' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Answers and clarity</div>
            <h1 className="hero-title">FAQ</h1>
            <p className="section-lede">Quick guidance on readings, photos, delivery timing, and care.</p>
            <div className="hero-actions">
              <Link className="cta" to="/intake">Start the Intake</Link>
              <Link className="cta secondary" to="/services">View Services</Link>
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
            <h2 className="section-title">Frequently asked questions</h2>
            <div className="faq">
              <details>
                <summary>Is this a medical or behavioral diagnosis?</summary>
                <p>No. Pawollie Sense is a spiritual and interpretive service and does not replace veterinary or behavioral professionals.</p>
              </details>
              <details>
                <summary>How many photos should I upload?</summary>
                <p>Upload 2 to 4 clear photos. An extra photo add-on allows 5 uploads.</p>
              </details>
              <details>
                <summary>How long does delivery take?</summary>
                <p>Full readings are delivered in 3 to 5 business days. Daily services are delivered instantly.</p>
              </details>
              <details>
                <summary>What if my pet has passed?</summary>
                <p>We honor memorial readings with care, compassion, and respect for your pets legacy.</p>
              </details>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Faq;
