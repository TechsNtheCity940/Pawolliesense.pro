import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

type KeepsakeProduct = {
  key: string;
  title: string;
  price: string;
  desc: string;
  cta: string;
  to: string;
};

const keepsakeProducts: KeepsakeProduct[] = [
  {
    key: 'memorial_print',
    title: 'Memorial canvas or framed print',
    price: '$79',
    desc: 'Get your favorite portion of your reading printed on a canvas.',
    cta: 'Start memorial keepsake',
    to: '/intake?service=pawmarks_pack&keepsake=memorial_print'
  },
  {
    key: 'chart_certificate',
    title: 'Star chart certificate',
    price: '$39',
    desc: "Your pet's birth/star reading turned into a printable certificate (digital + optional print).",
    cta: 'Start chart keepsake',
    to: '/intake?service=star_chart&keepsake=chart_certificate'
  },
  {
    key: 'apparel',
    title: 'Pawollie constellation tee/hoodie',
    price: 'Tee $44 / Hoodie $69',
    desc: 'Name + constellation map or Pawollie Vision portrait printed on apparel.',
    cta: 'Start apparel keepsake',
    to: '/intake?service=pawollie_vision&keepsake=apparel'
  },
  {
    key: 'tag_ornament',
    title: 'Keepsake tag / ornament',
    price: '$29',
    desc: 'Keychain tag or ornament memorializing pets who have crossed over, with name + dates.',
    cta: 'Start tag or ornament',
    to: '/intake?service=pawmarks_pack&keepsake=tag_ornament'
  }
];

const Keepsakes: React.FC = () => {
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
            <p className="section-lede">
              Turn your reading into something you can hold, frame, wear, or gift. Every keepsake is made from your photos and intake details-never generic art.
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
              Choose a keepsake and we will transform your submitted photos, notes, or reading excerpts into a finished piece.
            </p>
            <div className="grid">
              {keepsakeProducts.map((product) => (
                <div className="card col-6" key={product.key}>
                  <h3 className="service-title">{product.title}</h3>
                  <p className="price" style={{ marginBottom: 12 }}>{product.price}</p>
                  <p className="service-desc">{product.desc}</p>
                  <div className="hero-actions">
                    <Link className="cta secondary" to={product.to}>{product.cta}</Link>
                  </div>
                </div>
              ))}
            </div>
            <p className="mini">Note: Each keepsake is produced using your provided photos, names, dates, and reading content-no stock templates.</p>
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
                <p>Admin reviews each keepsake request before approval and Shopify print/ship fulfillment.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <h2 className="section-title">Make your reading timeless</h2>
            <p className="section-lede">
              Right after you receive your reading, you can turn it into a print, certificate, apparel piece, or memorial tag/ornament.
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
