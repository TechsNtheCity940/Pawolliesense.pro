import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const Services: React.FC = () => {
  return (
    <SiteLayout
      footerLinks={[
        { label: 'FAQ', to: '/faq' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Service overview | Pricing | Gentle guidance</div>
            <h1 className="hero-title">Services</h1>
            <p className="section-lede">Choose the reading that best matches your questions and your companion&apos;s needs.</p>
            <div className="hero-actions">
              <Link className="cta" to="/intake">Start the Intake</Link>
            </div>
          </div>
          <div className="stack">
            <img className="hero-logo" src="/assets/pawollelogo.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card service-block service-block-primary">
            <h2 className="section-title">Most chosen · Best starting point</h2>
            <div className="grid">
              <div className="card col-12">
                <div className="pill mini">Most Loved · Foundational Insight</div>
                <h3 className="service-title">Full Spirit Pawfile — $35</h3>
                <p className="service-desc">
                  A complete spirit profile revealing your pet’s spiritual archetype, personality traits, emotional energy, love language,
                  communication style, and deeper soul patterns that shape who they are and how they connect with you.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="full_spirit_pawfile">Choose this service</Link>
                </div>
              </div>
              <div className="card col-12">
                <div className="pill mini">Practical Support · Bond Healing</div>
                <h3 className="service-title">Behavior Bond Guidance — $40</h3>
                <p className="service-desc">
                  A personalized insight into your pet’s character and behavioral patterns, identifying emotional triggers, personality-driven
                  responses, and the root cause behind challenges—paired with compassionate guidance to strengthen trust, balance, and connection.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="behavior_bond_guidance">Choose this service</Link>
                </div>
              </div>
              <div className="card col-12">
                <div className="pill mini">Memorial · Great Gift · Eternal Honor</div>
                <h3 className="service-title">Pawmarks Pack (Memorial &amp; Keepsake Experience) — $45</h3>
                <p className="service-desc">
                  A heart-centered memorial experience honoring your pet’s spirit, unspoken messages, and lasting bond—including a Forever Pawmarks
                  admin-created memorial post, preserved as a never-ending tribute to their life and love.
                </p>
                <p className="service-desc">
                  What’s included: memorial spirit reading, unspoken messages, Forever Pawmarks memorial post customized to your pet. Optional keepsake
                  storybook available for an additional cost that varies based on the custom book.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="pawmarks_pack">Choose this service</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card service-block service-block-discovery">
            <h2 className="section-title">🔍 Deep Discoveries</h2>
            <div className="grid">
              <div className="card col-12">
                <h3 className="service-title">Star Chart (Pet Astrology Insight) — $19</h3>
                <p className="service-desc">
                  A personalized star chart explaining your pet’s temperament, emotional wiring, and soul patterns that influence how they love, learn, and relate.
                </p>
                <p className="mini">
                  Keepsake options: digital star chart (included), printed certificate for framing (add-on), full star chart canvas for wall display (add-on).
                  Printed/canvas options start at $29.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="star_chart">Choose this service</Link>
                </div>
              </div>
              <div className="card col-12">
                <h3 className="service-title">Paw Reading (Pawprint Insight) — $19</h3>
                <p className="service-desc">
                  An intuitive reading of your pet’s pawprint to understand their needs, emotional expressions, personality traits, and the unique ways they give and receive love.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="paw_reading">Choose this service</Link>
                </div>
              </div>
              <div className="card col-12">
                <h3 className="service-title">Pawollie Vision (Spirit Portrait) — $19</h3>
                <p className="service-desc">
                  A custom spirit-style portrait capturing your pet’s energy, presence, and soul essence—created as a meaningful visual keepsake.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="pawollie_vision">Choose this service</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card service-block service-block-quick" id="quick-quest">
            <h2 className="section-title">⚡ Quick Quests</h2>
            <div className="grid">
              <div className="card col-12">
                <h3 className="service-title">Express Pawdate — $9</h3>
                <p className="service-desc">
                  A quick emotional and energetic check-in offering insight into your pet’s current mood, needs, or inner state.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="express_pawdate">Choose this service</Link>
                </div>
              </div>
              <div className="card col-12">
                <h3 className="service-title">Quick Quest (One Question Insight) — $9</h3>
                <p className="service-desc">
                  A focused response to one specific question, providing fast intuitive clarity when you need reassurance or direction.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="quick_quest">Choose this service</Link>
                </div>
              </div>
              <div className="card col-12">
                <h3 className="service-title">Bond Spark (Mini Insight) — $9</h3>
                <p className="service-desc">
                  A short personality-based insight highlighting one meaningful way to support, connect with, or uplift your pet right now—perfect for gifting or quick guidance.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="bond_spark">Choose this service</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card service-block service-block-pack">
            <h2 className="section-title">🐕 Pawollie Packs</h2>
            <div className="grid">
              <div className="card col-12">
                <div className="pill mini">Best Value · Great Gift</div>
                <h3 className="service-title">All-Paws Pack (Every Service Included) — $119</h3>
                <p className="service-desc">
                  The complete Pawollie Sense experience—all services combined into one deeply personalized journey, with optional keepsakes and upgrades available.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="all_paws_pack">Choose this pack</Link>
                </div>
              </div>
              <div className="card col-12">
                <div className="pill mini">Multi-Pet · Great Gift</div>
                <h3 className="service-title">Furmily Pack (Multi-Pet Household Pack) — $79</h3>
                <p className="service-desc">
                  Choose any two services per pet for every animal in your home, no matter how many—created for families who want insight, understanding, and care for all their companions.
                </p>
                <div className="hero-actions">
                  <Link className="cta secondary" to="/intake" data-select-service="furmily_pack">Choose this pack</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card service-block service-block-community" id="community-care">
            <h2 className="section-title community-care-title">
              <img
                className="community-care-icon"
                src="/assets/branding/community-care.png"
                alt=""
                aria-hidden="true"
              />
              Community care
            </h2>
            <h3 className="service-title">Pass N’ Prints (Pay-It-Forward Program) — Optional Add-On</h3>
            <p className="section-lede">
              Contribute toward community-supported readings for families facing hardship. All requests are reviewed case by case, and not all submissions are approved.
            </p>
            <p className="mini">
              Requests are reviewed individually. Availability depends on community contributions. Approval decisions are not guaranteed. Response timeframe and outcome are
              communicated via email after submission. This program exists to extend care ethically, respectfully, and sustainably.
            </p>
            <div className="hero-actions">
              <Link className="cta secondary" to="/intake">Add pay-it-forward</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-panel">
            <h2 className="section-title">Ready to choose?</h2>
            <p className="section-lede">Complete the intake first, then you will be routed to secure payment.</p>
            <div className="hero-actions">
              <Link className="cta" to="/intake">Open Intake Form</Link>
            </div>
            <p className="mini">
              Pawollie Sense provides intuitive, symbolic, and reflective insight intended to support emotional understanding and connection. Services are not a substitute for
              veterinary, medical, or behavioral diagnosis.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Services;
