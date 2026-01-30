import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const ThankYou: React.FC = () => {
  return (
    <SiteLayout>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Submission received</div>
            <h1 className="hero-title">Thank you</h1>
            <p className="section-lede">Your form submission has been received.</p>
            <div className="hero-actions">
              <Link className="cta" to="/#home">Return home</Link>
              <Link className="cta secondary" to="/services">Browse services</Link>
            </div>
            <p className="mini">If you do not see a confirmation email, please check your spam or junk folder.</p>
          </div>
          <div className="stack">
            <img className="hero-logo" src="/assets/pawollelogo.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default ThankYou;
