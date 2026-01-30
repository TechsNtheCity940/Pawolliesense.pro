import React from 'react';
import { pawprintUrl } from '@/lib/brand-assets';

interface FooterProps {
  onNavigate: (section: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };


  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1E2540] relative overflow-hidden">
      {/* Constellation Background */}
      <div className="absolute inset-0 stars-bg opacity-10" />
      
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="brand-lockup mb-6">
              <img
                src="/assets/branding/pawollie-round-logo.png"
                alt="Pawollie Sense"
                className="brand-icon rounded-full"
              />
              <img className="brand-title" src="/assets/branding/pawollie-sense-title-w500.png" alt="Pawollie Sense" />
            </div>
            <p className="font-body text-white/60 text-sm leading-relaxed mb-6">
              "Your dog knows your soul. Now you can learn theirs."
            </p>
            <p className="font-body text-white/60 text-sm leading-relaxed">
              Intuitive, symbolic, and spiritually guided insights into your pet's emotional world.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-bold text-white mb-6">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { id: 'home', label: 'Home' },
                { id: 'about', label: 'Our Story' },
                { id: 'services', label: 'Pawollie Picks' },
                { id: 'photobooth', label: 'Photo Booth' },
                { id: 'intake', label: 'Intake Form' },
                { id: 'contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => handleNavClick(link.id)}
                    className="font-body text-white/60 hover:text-[#D4AF37] transition-colors text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-lg font-bold text-white mb-6">
              Our Services
            </h4>
            <ul className="space-y-3">
              {[
                'Paw Reading — Emotional & Energetic Insight',
                'Behavior & Aura Paw-file',
                'Soul Discovery — Soul Role & Bond Meaning',
                'Pet Birth Chart — Symbolic Personality Mapping',
                'Pawmarks Pack — Legacy & Transition Insight',
                'Combone Pack — Full Pawollie Experience',
                'Furmily Pack — Whole Household Bundle',
                'Pawsitive Pupdate (Solo / Add-on)',
                'Pawollie Vision Photo',
              ].map((service) => (
                <li key={service}>
                  <button
                    onClick={() => handleNavClick('services')}
                    className="font-body text-white/60 hover:text-[#D4AF37] transition-colors text-sm text-left"
                  >
                    {service}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="font-display text-lg font-bold text-white mb-6">
              Contact & Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:hello@pawolliesense.com"
                  className="font-body text-white/60 hover:text-[#D4AF37] transition-colors text-sm"
                >
                  hello@pawolliesense.com
                </a>
              </li>
              <li>
                <button
                  onClick={() => alert('Privacy Policy page coming soon!')}
                  className="font-body text-white/60 hover:text-[#D4AF37] transition-colors text-sm"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Terms of Service page coming soon!')}
                  className="font-body text-white/60 hover:text-[#D4AF37] transition-colors text-sm"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert('Ethical Disclosure page coming soon!')}
                  className="font-body text-white/60 hover:text-[#D4AF37] transition-colors text-sm"
                >
                  Ethical Disclosure
                </button>
              </li>
            </ul>

            {/* Social Icons */}
            <div className="mt-6">
              <h5 className="font-display text-sm font-semibold text-white/80 mb-3">
                Follow Us
              </h5>
              <div className="flex space-x-3">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert('Instagram link coming soon!'); }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#D4AF37] hover:text-[#2D3561] transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert('Facebook link coming soon!'); }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#D4AF37] hover:text-[#2D3561] transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); alert('TikTok link coming soon!'); }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-[#D4AF37] hover:text-[#2D3561] transition-all"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="font-body text-white/40 text-sm">
              &copy; {currentYear} Pawollie Sense. All rights reserved.
            </p>
            <p className="font-body text-white/40 text-sm mt-2 md:mt-0">
              In loving memory of Oliver
              <img
                src={pawprintUrl}
                alt=""
                className="inline-block h-4 w-4 ml-2 brightness-0 invert opacity-40"
              />
            </p>
          </div>
        </div>
      </div>

      {/* Decorative Constellation */}
      <svg
        className="absolute bottom-0 left-0 w-full h-32 pointer-events-none opacity-10"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        <path
          d="M0,50 L200,30 L400,60 L600,20 L800,50 L1000,30"
          stroke="#D4AF37"
          strokeWidth="1"
          fill="none"
        />
        <circle cx="200" cy="30" r="3" fill="#D4AF37" />
        <circle cx="400" cy="60" r="3" fill="#D4AF37" />
        <circle cx="600" cy="20" r="3" fill="#D4AF37" />
        <circle cx="800" cy="50" r="3" fill="#D4AF37" />
      </svg>
    </footer>
  );
};

export default Footer;
