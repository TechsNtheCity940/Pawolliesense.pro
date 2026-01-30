import React, { useState, useEffect } from 'react';
import Header from './pawollie/Header';
import HeroSection from './pawollie/HeroSection';
import AboutSection from './pawollie/AboutSection';
import ServicesSection from './pawollie/ServicesSection';
import SoulRolesSection from './pawollie/SoulRolesSection';
import ProcessSection from './pawollie/ProcessSection';
import TestimonialsSection from './pawollie/TestimonialsSection';
import PhotoBoothSection from './pawollie/PhotoBoothSection';
import IntakeFormSection from './pawollie/IntakeFormSection';
import FAQSection from './pawollie/FAQSection';
import NewsletterSection from './pawollie/NewsletterSection';
import ContactSection from './pawollie/ContactSection';
import Footer from './pawollie/Footer';



const AppLayout: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home');

  // Track scroll position to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'services', 'furever-loved', 'photobooth', 'intake', 'contact'];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigate = (section: string) => {
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Fixed Header */}
      <Header activeSection={activeSection} onNavigate={handleNavigate} />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection onNavigate={handleNavigate} />

        {/* About / Story Section */}
        <AboutSection />

        {/* Services Section - Pawollie Picks */}
        <ServicesSection onNavigate={handleNavigate} />

        {/* Soul Roles Section */}
        <SoulRolesSection />

        {/* How It Works / Process Section */}
        <ProcessSection onNavigate={handleNavigate} />


        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Photo Booth Section */}
        <PhotoBoothSection />

        {/* Intake Form Section */}
        <IntakeFormSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Newsletter Section */}
        <NewsletterSection />

        {/* Contact Section */}
        <ContactSection />


      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Scroll to Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

// Scroll to Top Button Component
const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 w-14 h-14 bg-[#D4AF37] text-[#2D3561] rounded-full shadow-lg flex items-center justify-center hover:bg-[#E5C158] transition-all transform hover:-translate-y-1 z-50"
      aria-label="Scroll to top"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
};

export default AppLayout;
