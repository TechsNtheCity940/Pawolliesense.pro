import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SiteFooter, { type FooterLink } from './SiteFooter';
import WanderingPups from './WanderingPups';

const navLinks = [
  { label: 'Home', to: '/#home' },
  { label: 'Services', to: '/services' },
  { label: 'Quick Quests', to: '/services#quick-quest' },
  { label: 'Keepsakes', to: '/keepsakes' },
  { label: 'About Us', to: '/about' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Testimonials', to: '/testimonials' },
  { label: 'Our Story', to: '/story' },
  { label: 'Pawmarks', to: '/pawmarks' },
  { label: 'Community', to: '/community' },
  { label: 'Photo Booth', to: '/photobooth' },
  { label: 'Intake Form', to: '/intake' }
];

const SiteLayout: React.FC<{ children: React.ReactNode; footerLinks?: FooterLink[] }> = ({
  children,
  footerLinks
}) => {
  const location = useLocation();

  useEffect(() => {
    const pageKey = location.pathname === '/' ? 'home' : (location.pathname.split('/')[1] || 'home');
    document.body.dataset.page = pageKey;

    window.pawollieInitDrawer?.();
    window.pawollieInitIntakeForm?.();
    window.pawollieInitServicePickButtons?.();
    window.pawollieInitServicePreselectFromUrl?.();
    window.pawollieInitPhotoBooth?.();
    window.pawollieInitCommunityGame?.();

    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className="page-shell with-tracks">
      <aside className="track-border left" aria-hidden="true"></aside>
      <div className="page-content">
        <WanderingPups />
        <header className="site-header">
          <div className="site-header__logo">
            <img src="/assets/branding/oliver_transparent_7.png" alt="Pawollie Sense logo" />
          </div>
          <div className="site-brand">
            <span className="site-brand__title">Pawollie Sense</span>
            <span className="site-brand__tagline">
              Your pet knows your soul, now you can discover theirs.
            </span>
          </div>
          <button
            className="menu-btn"
            type="button"
            aria-label="Open menu"
            aria-expanded="false"
            aria-controls="site-drawer"
          >
            <span className="menu-icon" aria-hidden="true"><span></span></span>
          </button>
        </header>

        <div className="drawer-backdrop" hidden></div>
        <nav id="site-drawer" className="drawer" aria-label="Primary navigation">
          <div className="drawer-header">
            <div className="drawer-title">
              <span className="drawer-title__icon" aria-hidden="true"></span>
              <span>Navigate</span>
            </div>
            <button className="menu-btn" type="button" data-drawer-close aria-label="Close menu">Close</button>
          </div>
          <ul className="drawer-links">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <main>{children}</main>

        <SiteFooter links={footerLinks} />
      </div>
      <aside className="track-border right" aria-hidden="true"></aside>
    </div>
  );
};

export default SiteLayout;
