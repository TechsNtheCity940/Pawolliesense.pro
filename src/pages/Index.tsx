import React from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';
const Index: React.FC = () => {
  const testimonials = [
    {
      name: 'Behavior Bond Guidance',
      role: 'Relationship Reading',
      note: 'I didn’t realize how much my dog was carrying for me until this. The reading felt like someone finally translated the quiet language between us. The guidance was gentle, specific, and weirdly spot-on.',
      photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Calm Home Reset',
      role: 'Support Plan',
      note: 'This wasn’t fluff. It gave me a clear way to support my dog without guilt or guesswork. Within days, our home felt calmer—and my dog looked relieved.',
      photo: 'https://images.unsplash.com/photo-1504595403659-9088ce801e29?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Behavior Bond Guidance',
      role: 'Why Behind the Behavior',
      note: 'The Behavior Bond Guidance didn’t just explain the behavior… it explained the why. It helped me respond with trust instead of frustration. That shift changed everything.',
      photo: 'https://images.unsplash.com/photo-1525253086316-d0c936c814f8?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Empowered Guardian',
      role: 'Actionable Coaching',
      note: 'I’ve paid for “advice” before that made me feel like I was failing. Pawollie Sense did the opposite—it made me feel capable. Like, “Okay. I know what to do now.”',
      photo: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Soul Discovery',
      role: 'Deep Bond Reading',
      note: 'The Soul Discovery reading hit like a warm truth. It didn’t just describe my dog—it described our bond. I’ve reread it three times and each time I notice something new.',
      photo: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'PupDate Add-on',
      role: 'Daily Guidance',
      note: 'The PupDate add-on is my favorite quick reset. When I’m unsure what my dog needs that day, it gives me a simple focus: comfort, play, space, or reassurance.',
      photo: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Paw Reading + Aura Insight',
      role: 'Personality Blueprint',
      note: 'The Paw Reading + Aura Insight felt like a personality blueprint. It explained my dog’s quirks in a way that made me respect them more instead of trying to “fix” them.',
      photo: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Guardian Grace',
      role: 'Dignity & Respect',
      note: 'This gave my dog dignity. That’s the best way I can describe it. Like their inner world mattered—and I finally learned how to honor it.',
      photo: 'https://images.unsplash.com/photo-1517840545249-7b958d4a65e6?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Loop Breaker',
      role: 'Calming Protocol',
      note: 'We were stuck in a loop: me anxious, my dog anxious, everyone spiraling. This helped me break the loop. The steps were practical, and the tone was so kind.',
      photo: 'https://images.unsplash.com/photo-1504208434309-cb69f4fe52b0?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Birth Chart / Star Reading',
      role: 'Rhythms & Tendencies',
      note: 'The Birth Chart/Star reading was surprisingly grounding. It didn’t overclaim—it gave patterns and tendencies that made our routines make sense.',
      photo: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Forever Paw-Marks',
      role: 'Memorial',
      note: 'I thought I was “fine” until I read it and started crying in a good way. It gave me closure without trying to replace grief. It just… held it gently.',
      photo: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Gentle Goodbye',
      role: 'Memorial',
      note: 'It felt like a goodbye that wasn’t rushed. Like my love had somewhere to land.',
      photo: 'https://images.unsplash.com/photo-1504198458649-3128b932f49b?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Softened Grief',
      role: 'Memorial',
      note: 'The memorial message didn’t erase the pain—but it softened the sharp edges. I could breathe again.',
      photo: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Quote Card',
      role: 'Quiet Language',
      note: '“It translated the quiet language between us.”',
      photo: 'https://images.unsplash.com/photo-1525253013412-55e0e1b2e1ba?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Quote Card',
      role: 'Accurate & Gentle',
      note: '“Specific, gentle, and shockingly accurate.”',
      photo: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Quote Card',
      role: 'Clear Plan',
      note: '“It gave me a plan—not guilt.”',
      photo: 'https://images.unsplash.com/photo-1477973770766-6228305816df?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Quote Card',
      role: 'New Understanding',
      note: '“I understand my dog in a whole new way.”',
      photo: 'https://images.unsplash.com/photo-1467521335787-2f0fc0f0c3c6?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Quote Card',
      role: 'Calmer Home',
      note: '“Our home got calmer within days.”',
      photo: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=500&q=80'
    },
    {
      name: 'Quote Card',
      role: 'Gentle Closure',
      note: '“Closure that didn’t feel forced.”',
      photo: 'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?auto=format&fit=crop&w=500&q=80'
    }
  ];

  return (
    <SiteLayout
      footerLinks={[
        { label: 'Services', to: '/services' },
        { label: 'FAQ', to: '/faq' },
        { label: 'About', to: '/about' },
        { label: 'Community', to: '/community' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section id="home" className="hero">
        <div className="container home-layout">
          <div className="home-intro">
            <h1 className="hero-title">
              <img className="brand-title" src="/assets/branding/pawollie-sense-title-w500.png" alt="Pawollie Sense" />
            </h1>
            <p className="hero-script">
              Our dogs dedicate their lives to learning us - our moods, our patterns, our hearts - often knowing us better than we know ourselves. Pawollie Sense was created to give that devotion back. This work exists to help you discover your dog's inner world: their spirit, emotional language, needs, and the deeper bond they share with you. Whether you are strengthening your connection, navigating behavioral or emotional changes, celebrating their presence, or honoring their life and legacy, Pawollie Sense is designed to give their voice meaning, preserve their story, and deepen the love you experience together - again and again.
            </p>
            <div className="nav-grid">
              <Link className="nav-tile" to="/story">Our Story</Link>
              <Link className="nav-tile" to="/services">Full Services</Link>
              <Link className="nav-tile" to="/services#quick-quest">Quick Quests</Link>
              <Link className="nav-tile" to="/keepsakes">Keepsake Shop</Link>
              <Link className="nav-tile" to="/community">Wag Book</Link>
              <Link className="nav-tile" to="/memorial">Forever Pawmarks</Link>
            </div>
            <div className="nav-mini">
              <a className="nav-link" href="mailto:pawolliesense@gmail.com">Contact Us</a>
              <Link className="nav-link" to="/faq">FAQ</Link>
              <Link className="nav-link" to="/faq#disclaimers">Disclaimers</Link>
            </div>
          </div>
          <div className="home-aside">
            <div className="logo-panel">
              <img
                className="hero-logo"
                src="/assets/LOGO%20SMILE.png"
                alt="Illustrated Pawollie Sense logo featuring Oliver"
              />
            </div>
            <div className="welcome-oli">
              <img
                src="/assets/branding/oli%20welcome%20transparent.png"
                alt="Welcome Oliver illustration"
              />
            </div>
            <div className="cta-row single hero-cta welcome-cta">
              <Link className="cta wide" to="/intake">Begin Your Journey</Link>
            </div>
            <div className="aside-stack"></div>
          </div>
        </div>
      </section>

      <section className="section section-flush">
        <div className="container testimonial-marquee">
          <div className="marquee-header">
            <div>
              <p className="eyebrow">Client love</p>
              <h2 className="section-title">What clients are saying</h2>
            </div>
          </div>
          <div className="marquee-window" role="region" aria-label="Rolling client testimonials">
            <div className="marquee-track">
              {[...testimonials, ...testimonials].map((t, idx) => (
                <div className="marquee-card card soft" key={`${t.name}-${idx}`}>
                  <div className="testimonial-avatar">
                    <img src={t.photo} alt={`${t.name} portrait`} loading="lazy" />
                  </div>
                  <p className="testimonial-quote">"{t.note}"</p>
                  <div className="testimonial-name">{t.name}</div>
                  <div className="testimonial-role">{t.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split-panels">
          <div className="card">
            <h2 className="section-title">Our Story</h2>
            <p className="section-lede">
              Pawollie Sense was born from the understanding that animals are more than companions. They are teachers, protectors, and sentient beings whose spirits meet us where words cannot. The connection we share with them is not bound by routine, obedience, or time—it is built on trust, recognition, and a love that shapes who we become.
            </p>
            <p className="section-lede">
              This work exists to honor that bond and help it grow stronger through every stage of life and beyond. Pawollie Sense transforms love into understanding, and understanding into presence—guiding deeper connection, mutual respect, and lasting harmony between humans and their animals. Because when we truly see the spirit behind the eyes, the bond doesn’t end with goodbye. It continues, carried forward, living on through the love we learn to give.
            </p>
            <div className="hero-actions">
              <Link className="cta secondary" to="/about">Learn More</Link>
            </div>
          </div>
          <div className="card split-border">
            <h2 className="section-title">How it Works</h2>
            <p className="section-lede">1) Choose your reading: pick the service (and any add-ons) that fits what you need right now.</p>
            <p className="section-lede">2) Submit photos + intake form: upload 2–5 clear photos (include paws for Paw Reading) and tell us what to focus on.</p>
            <p className="section-lede">3) Receive your reading: we create your personalized reading and deliver it digitally so you can save it and revisit anytime.</p>
            <p className="section-lede">Disclaimer: Spiritual/interpretive guidance only— not veterinary or professional training advice.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card">
            <div className="pill">Most loved · Best starting point</div>
            <h2 className="section-title">Pawollie favorites</h2>
            <p className="section-lede">The services people choose most often to understand, support, and honor their companions.</p>
            <div className="grid">
              <div className="card col-4">
                <div className="pill mini">Most Loved · Foundational Insight</div>
                <h3 className="service-title">Full Spirit Pawfile — $35</h3>
                <p className="service-desc">A complete spirit profile revealing archetype, personality, emotional energy, love language, and soul patterns.</p>
              </div>
              <div className="card col-4">
                <div className="pill mini">Practical Support · Bond Healing</div>
                <h3 className="service-title">Behavior Bond Guidance — $40</h3>
                <p className="service-desc">Root-cause insight into behavior with compassionate steps to strengthen trust, balance, and connection.</p>
              </div>
              <div className="card col-4">
                <div className="pill mini">Memorial · Eternal Honor</div>
                <h3 className="service-title">Pawmarks Pack — $45</h3>
                <p className="service-desc">Memorial spirit reading, unspoken messages, a Forever Pawmarks tribute post crafted for your pet, and a special keepsake custom made for you in honor of your lost love. Keepsake storybook available for an additional cost that varies based on the custom book.</p>
              </div>
            </div>
            <div className="hero-actions">
              <Link className="cta secondary" to="/services">Discover more</Link>
              <Link className="cta" to="/intake">Start an intake</Link>
            </div>
          </div>
        </div>
      </section>


    </SiteLayout>
  );
};

export default Index;



