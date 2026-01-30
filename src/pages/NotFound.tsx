import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const NotFound: React.FC = () => {
  return (
    <SiteLayout>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">404 error</div>
            <h1 className="hero-title">Page not found</h1>
            <p className="section-lede">We could not locate the page you were looking for.</p>
            <div className="hero-actions">
              <Link className="cta" to="/#home">Return home</Link>
              <Link className="cta secondary" to="/services">Browse services</Link>
            </div>
          </div>
          <div className="stack">
            <img className="hero-logo" src="/assets/pawollelogo.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default NotFound;
