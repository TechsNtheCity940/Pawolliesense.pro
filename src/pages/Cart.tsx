import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const Cart: React.FC = () => {
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
            <div className="pill">Secure payment | Stripe checkout</div>
            <h1 className="hero-title">Cart</h1>
            <p className="section-lede">Select your service and complete payment with Stripe.</p>
            <p className="mini">After payment, complete your intake and photo upload.</p>
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
              <h2 className="section-title">Your selection</h2>
              <form id="cart-form">
                <div className="field">
                  <label htmlFor="cart_service">Choose a service</label>
                  <select id="cart_service" name="cart_service" defaultValue="">
                    <option value="">Select a service</option>
                    <option value="quick_quest">Quick Quest - $5</option>
                    <option value="past_life_pawprint">Past-Life Pawprint Reading - $5</option>
                    <option value="canine_birth_chart">Canine Birth Chart - $15</option>
                    <option value="behavior_spirit_scan">Personality &amp; Behavior Spirit Scan - $20</option>
                    <option value="full_soul_profile">Full Soul Discovery Profile - $30</option>
                  </select>
                  <p className="help">Leave blank if you only want a daily service.</p>
                </div>
                <div className="field">
                  <span className="label">Daily services (optional)</span>
                  <div className="checkbox-grid">
                    <label className="checkbox">
                      <input type="checkbox" name="daily_services" value="pawollie_vision" /> Pawollie Vision - $4.99 (or $2.99 with any core service)
                    </label>
                    <label className="checkbox">
                      <input type="checkbox" name="daily_services" value="pawsitive_pupdate" /> Pawsitive Pupdate - $4.99 (or $2.99 with any core service)
                    </label>
                  </div>
                </div>
                <div className="field">
                  <span className="label">Add-ons (pricing confirmed by email)</span>
                  <div className="checkbox-grid">
                    <label className="checkbox"><input type="checkbox" name="cart_add_ons" value="soul_transition" /> Soul Transition and Next-Life Pathway</label>
                    <label className="checkbox"><input type="checkbox" name="cart_add_ons" value="golden_aura" /> Golden Aura Glow</label>
                    <label className="checkbox"><input type="checkbox" name="cart_add_ons" value="bonding_guidance" /> Bonding Guidance Card</label>
                    <label className="checkbox"><input type="checkbox" name="cart_add_ons" value="extra_photos" /> Extra Photo Add-On</label>
                  </div>
                </div>
                <div className="total">
                  <div>
                    <div className="total-label">Total due</div>
                    <div className="help">Calculated from your service selection and any daily add-ons.</div>
                  </div>
                  <div className="total-amount"><span id="cart_total">$0</span></div>
                </div>
              </form>
            </div>

            <div className="card col-6">
              <h2 className="section-title">Pay with Stripe</h2>
              <p className="section-lede">Checkout securely with card, Apple Pay, or Google Pay.</p>
              <button className="cta" id="stripe-checkout-btn" type="button">Proceed to Checkout</button>
              <div id="result-message" className="mini" aria-live="polite"></div>
              <p className="mini">Secure Stripe checkout opens in a new page.</p>
              <p className="mini">After payment, continue to the intake form for photos and details.</p>
              <Link className="cta secondary" to="/intake">Go to Intake Form</Link>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Cart;
