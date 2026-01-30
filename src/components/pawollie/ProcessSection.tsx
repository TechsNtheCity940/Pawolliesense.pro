import React from 'react';
import { pawprintUrl } from '@/lib/brand-assets';

interface ProcessSectionProps {
  onNavigate: (section: string) => void;
}

const ProcessSection: React.FC<ProcessSectionProps> = ({ onNavigate }) => {
  const steps = [
    {
      number: '01',
      title: 'Complete Intake Form',
      description: 'Share details about your pet, your bond, and what you hope to discover through our comprehensive intake form.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Upload Photos',
      description: 'Submit 2-5 clear photos of your pet, including front and back paw shots for the most accurate reading.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Intuitive Interpretation',
      description: 'Our reader carefully analyzes your submission, interpreting symbolic patterns and emotional insights.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
    {
      number: '04',
      title: 'Receive Your Reading',
      description: 'Within 3-5 business days, receive your personalized written reading with deep insights into your pet\'s soul.',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const handleStartClick = () => {
    onNavigate('intake');
    const element = document.getElementById('intake');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-20 bg-white relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 opacity-5 transform rotate-45">
        <img
          src="https://d64gsuwffb70l.cloudfront.net/694089d9f886fb409f4804a9_1765837414597_22ef29f4.png"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-[#D4AF37]/20 text-[#2D3561] font-display text-sm font-semibold rounded-full mb-4">
            How It Works
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#2D3561] mb-6">
            Journey to True Bonding
          </h2>
          <div className="flex items-center justify-center mb-8">
            <div className="h-px w-12 bg-[#D4AF37]" />
            <img
              src={pawprintUrl}
              alt=""
              className="w-8 h-8 mx-3"
            />
            <div className="h-px w-12 bg-[#D4AF37]" />
          </div>
          <p className="font-body text-lg text-[#3A3A3A] max-w-2xl mx-auto">
            Our simple four-step process ensures a meaningful and personalized experience for you and your beloved companion.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-[#D4AF37] to-[#9DB5A5] z-0" style={{ width: 'calc(100% - 2rem)' }} />
              )}
              
              <div className="bg-[#F5F1E8] rounded-2xl p-6 relative z-10 h-full card-celestial">
                {/* Step Number */}
                <div className="absolute -top-4 -left-2 w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center">
                  <span className="font-display text-sm font-bold text-[#2D3561]">
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-[#2D3561] rounded-full flex items-center justify-center text-[#D4AF37] mb-4 mt-4">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-bold text-[#2D3561] mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-[#3A3A3A] text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleStartClick}
            className="px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#2D3561] font-display font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg"
          >
            Begin Your Reading Journey
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
