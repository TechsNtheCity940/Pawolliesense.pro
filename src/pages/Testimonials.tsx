import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const Testimonials: React.FC = () => {
  return (
    <SiteLayout
      footerLinks={[
        { label: 'Services', to: '/services' },
        { label: 'Intake', to: '/intake' },
        { label: 'Memorial', to: '/memorial' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Emotional proof | Real stories</div>
            <h1 className="hero-title">Testimonials</h1>
            <p className="section-lede">Words from clients who felt seen, supported, and understood.</p>
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
          <h2 className="section-title">What clients are saying</h2>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div className="testimonial-avatar">
                <img src="/assets/pawollelogo.png" alt="Testimonial portrait placeholder" />
              </div>
              <h3>Aisha and Luna</h3>
              <p>When Luna stopped eating, I did not know what to do. You helped me understand her world.</p>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-avatar">
                <img src="/assets/pawollelogo.png" alt="Testimonial portrait placeholder" />
              </div>
              <h3>Marcus and Milo</h3>
              <p>The reading felt grounded and gentle. It gave me comfort without false promises.</p>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-avatar">
                <img src="/assets/pawollelogo.png" alt="Testimonial portrait placeholder" />
              </div>
              <h3>Renee and Ivy</h3>
              <p>This helped me honor our bond with grace. I felt seen and supported.</p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Testimonials;
