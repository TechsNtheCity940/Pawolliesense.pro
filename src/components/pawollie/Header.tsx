import React, { useState, useEffect } from 'react';
interface HeaderProps {
  activeSection: string;
  onNavigate: (section: string) => void;
}

const Header: React.FC<HeaderProps> = ({ activeSection, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'Our Story' },
    { id: 'services', label: 'Pawollie Picks' },
    { id: 'furever-loved', label: 'Furever Loved' },
    { id: 'photobooth', label: 'Photo Booth' },
    { id: 'intake', label: 'Intake Form' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (sectionId: string) => {
    onNavigate(sectionId);
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center group"
          >
            <div className="brand-lockup">
              <img
                src="/assets/branding/pawollie-round-logo.png"
                alt="Pawollie Sense - Oliver"
                className="brand-icon rounded-full transition-transform group-hover:scale-105"
              />
              <img className="brand-title hidden sm:block" src="/assets/branding/pawollie-sense-title-w500.png" alt="Pawollie Sense" />
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`px-4 py-2 rounded-full font-display text-sm font-medium transition-all duration-200 ${
                  activeSection === item.id
                    ? 'bg-[#2D3561] text-white'
                    : 'text-[#3A3A3A] hover:bg-[#9DB5A5]/30 hover:text-[#2D3561]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <button
              onClick={() => handleNavClick('intake')}
              className="px-6 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#2D3561] font-display font-semibold rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Book a Reading
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-[#2D3561] hover:bg-[#9DB5A5]/20"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-md rounded-2xl shadow-xl mb-4 overflow-hidden">
            <nav className="py-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full px-6 py-3 text-left font-display font-medium transition-colors ${
                    activeSection === item.id
                      ? 'bg-[#2D3561] text-white'
                      : 'text-[#3A3A3A] hover:bg-[#9DB5A5]/20'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="px-4 pt-4">
                <button
                  onClick={() => handleNavClick('intake')}
                  className="w-full px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#2D3561] font-display font-semibold rounded-full"
                >
                  Book a Reading
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
