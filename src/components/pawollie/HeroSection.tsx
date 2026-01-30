import React from 'react';
import { pawollieLogoUrl, pawprintUrl } from '@/lib/brand-assets';

interface HeroSectionProps {
  onNavigate: (section: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const handleExploreClick = () => {
    onNavigate('services');
    const element = document.getElementById('services');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBookClick = () => {
    onNavigate('intake');
    const element = document.getElementById('intake');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://d64gsuwffb70l.cloudfront.net/694089d9f886fb409f4804a9_1765837380737_2cbaf40c.jpg')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#2D3561]/70 via-[#2D3561]/50 to-[#9DB5A5]/60" />
      </div>

      {/* Animated Stars */}
      <div className="absolute inset-0 stars-bg opacity-50" />
      
      {/* Floating Stars */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-twinkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          <svg
            className="w-2 h-2 text-[#D4AF37]"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Oliver Logo */}
        <div className="mb-8 animate-float">
          <img
            src={pawollieLogoUrl}
            alt="Oliver - Pawollie Sense Mascot"
            className="w-48 h-48 md:w-64 md:h-64 mx-auto rounded-full shadow-2xl border-4 border-white/30"
          />
        </div>

        {/* Title with Pawprint */}
        <h1 className="hero-title font-display text-5xl md:text-7xl font-bold text-white mb-3 tracking-tight">
          <img className="brand-title" src="/assets/branding/pawollie-sense-title-w500.png" alt="Pawollie Sense" />
        </h1>

        {/* Tagline */}
        <p className="hero-tagline">
          Your dog knows your soul. Now you can learn theirs.
        </p>

        {/* Decorative Line */}
        <div className="flex items-center justify-center mb-8">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#D4AF37]" />
          <svg className="w-6 h-6 mx-4 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#D4AF37]" />
        </div>

        {/* Description */}
        <p className="font-body text-lg text-white/85 max-w-2xl mx-auto mb-10 leading-relaxed">
          Intuitive, symbolic, and spiritually guided insights into your pet&apos;s emotional world—past, present, and beyond.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleExploreClick}
            className="px-8 py-4 bg-white text-[#2D3561] font-display font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg"
          >
            Explore Our Services
          </button>
          <button
            onClick={handleBookClick}
            className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#2D3561] font-display font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg animate-pulse-glow"
          >
            Book a Reading
          </button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <button
            onClick={handleExploreClick}
            className="text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Constellation Lines SVG */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <path
          d="M100,200 L300,150 L500,300 L700,100 L900,250"
          stroke="#D4AF37"
          strokeWidth="1"
          fill="none"
          className="animate-constellation"
        />
        <path
          d="M150,600 L350,550 L450,700 L650,500 L850,650"
          stroke="#D4AF37"
          strokeWidth="1"
          fill="none"
          className="animate-constellation"
          style={{ animationDelay: '0.5s' }}
        />
        <path
          d="M200,400 L400,450 L600,350 L800,500"
          stroke="#9DB5A5"
          strokeWidth="1"
          fill="none"
          className="animate-constellation"
          style={{ animationDelay: '1s' }}
        />
      </svg>
    </section>
  );
};

export default HeroSection;
