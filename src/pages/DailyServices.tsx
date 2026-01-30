import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const DailyServices: React.FC = () => {
  return (
    <SiteLayout
      footerLinks={[
        { label: 'Services', to: '/services' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Instant delivery | Daily check-ins</div>
            <h1 className="hero-title">Daily Services</h1>
            <p className="section-lede">Quick spiritual snapshots delivered instantly for your companion.</p>
            <div className="hero-actions">
              <Link className="cta" to="/intake">Open Intake Form</Link>
            </div>
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
              <h2 className="section-title">Pawollie Vision</h2>
              <p className="section-lede">Receive a spirit aura image and a quick intuitive insight. Delivered instantly.</p>
              <p className="service-desc">Price: $4.99</p>
              <div className="hero-actions">
                <Link className="cta secondary" to="/intake">Purchase Pawollie Vision</Link>
              </div>
            </div>
            <div className="card col-6">
              <h2 className="section-title">Pawsitive Pupdate</h2>
              <p className="section-lede">A daily check-in read for your pet's current emotional state. Delivered instantly.</p>
              <p className="service-desc">Price: $4.99</p>
              <div className="hero-actions">
                <Link className="cta secondary" to="/intake">Purchase Pawsitive Pupdate</Link>
              </div>
            </div>
          </div>
          <p className="mini" style={{ marginTop: '1rem' }}>Daily services still require a photo upload for accuracy.</p>
        </div>
      </section>
    </SiteLayout>
  );
};

export default DailyServices;
