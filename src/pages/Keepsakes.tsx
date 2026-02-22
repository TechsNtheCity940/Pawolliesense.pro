import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const keepsakeProducts = [
  {
    title: 'Memorial canvas or framed print',
    desc: 'Get your favorite portion of your reading printed on a canvas.',
    cta: 'Order memorial print'
  },
  {
    title: 'Star chart certificate',
    desc: 'Your pet’s birth/star reading turned into a printable certificate (digital + optional print).',
    cta: 'Request chart certificate'
  },
  {
    title: 'Pawollie constellation tee/hoodie',
    desc: 'Name + constellation map or Pawollie Vision portrait printed on apparel.',
    cta: 'Design apparel'
  },
  {
    title: 'Keepsake tag / ornament',
    desc: 'Keychain tag or ornament memorializing pets who have crossed over, with name + dates.',
    cta: 'Create tag or ornament'
  },
  {
    title: 'Storybook keepsake (digital PDF)',
    desc: 'A personalized, page-ready story built from your submission; print upgrade available.',
    cta: 'Start storybook'
  },
  {
    title: 'Printed book add-on',
    desc: 'Once your PDF is locked, we print and ship it; future upgrade to animation available.',
    cta: 'Add printed book'
  }
];

const Keepsakes: React.FC = () => {
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);

  return (
    <SiteLayout
      footerLinks={[
        { label: 'Home', to: '/#home' },
        { label: 'Services', to: '/services' },
        { label: 'FAQ', to: '/faq' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Keepsake Shop | Custom-made from your submission</div>
            <h1 className="hero-title">Keepsake Shop</h1>
            <p className="section-lede" style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.4rem' }}>(COMING SOON)</p>
            <p className="section-lede">
              Turn your reading into something you can hold, frame, wear, or gift. Every keepsake is made from your photos and intake details—never generic art.
            </p>
            <div className="hero-actions">
              <Link className="cta" to="/intake">Start a Keepsake Intake</Link>
              <Link className="cta secondary" to="/services">View Services</Link>
            </div>
          </div>
          <div className="stack">
            <img className="hero-logo" src="/assets/branding/oli_globe_6.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">Turn your reading into a real keepsake</h2>
            <p className="section-lede">
              Choose a keepsake and we’ll transform your submitted photos, notes, or reading excerpts into a finished piece. We start small to keep quality high.
            </p>
            <div className="grid">
              {keepsakeProducts.map((product) => (
                <div className="card col-6" key={product.title}>
                  <h3 className="service-title">{product.title}</h3>
                  <p className="service-desc">{product.desc}</p>
                  <div className="hero-actions">
                    <button
                      type="button"
                      className="cta secondary"
                      disabled
                      onMouseEnter={() => setHoveredProduct(product.title)}
                      onMouseLeave={() => setHoveredProduct((prev) => (prev === product.title ? null : prev))}
                      style={{ opacity: 0.85, cursor: 'not-allowed' }}
                    >
                      {hoveredProduct === product.title ? 'Coming Soon' : product.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mini">Note: Each keepsake is produced using your provided photos, names, dates, and reading content—no stock templates.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">How it works</h2>
            <div className="steps">
              <div className="step">
                <h3>1. Choose your keepsake</h3>
                <p>Select one of the items above. Each starts with your reading + photos.</p>
              </div>
              <div className="step">
                <h3>2. Quick keepsake intake</h3>
                <p>Confirm shipping details, colors/size, engraving text, and the photo(s) to use.</p>
              </div>
              <div className="step">
                <h3>3. Proof + delivery</h3>
                <p>We send a proof/mockup. On approval, we fulfill and send tracking (or deliver the digital PDF).</p>
              </div>
            </div>
            <p className="mini">Current integration: “You collect + you place order.” We collect payment and place the order with our print partner manually while we validate demand. Automation/API fulfillment will follow once formats are locked.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">Make your reading timeless</h2>
            <p className="section-lede">
              Right after you receive your reading, you can turn it into: a print, mug, blanket, storybook, or apparel. We’ll prompt you with a one-click keepsake add-on link.
            </p>
            <div className="hero-actions">
              <Link className="cta secondary" to="/intake">Start a keepsake request</Link>
              <Link className="cta" to="/services">See readings</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Keepsakes;
