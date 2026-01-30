import React from 'react';
import { pawollieLogoUrl, pawprintUrl } from '@/lib/brand-assets';

const AboutSection: React.FC = () => {
  const reasons = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'See Pets as Individuals',
      description: 'Help owners see their pets as individuals, not just animals',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Comfort & Clarity',
      description: 'Provide comfort, clarity, and meaning during difficult transitions',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      title: 'Preserve Legacy',
      description: "Preserve a pet's spiritual and emotional legacy",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: 'Strengthen Bonds',
      description: 'Strengthen the bond between human and animal through understanding',
    },
  ];

  return (
    <section id="about" className="py-24 bg-[#F5F1E8] relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 opacity-5">
        <img
          src="https://d64gsuwffb70l.cloudfront.net/694089d9f886fb409f4804a9_1765837414597_22ef29f4.png"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-[#9DB5A5]/30 text-[#2D3561] font-display text-sm font-semibold rounded-full mb-4">
            Our Story
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#2D3561] mb-6">
            About Pawollie Sense
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
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Image Side */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={pawollieLogoUrl}
                alt="Oliver - The inspiration behind Pawollie Sense"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D3561]/30 to-transparent" />
            </div>
          </div>

          {/* Text Side */}
          <div className="space-y-6">
            <p className="font-body text-lg text-[#3A3A3A] leading-relaxed">
              Pawollie Sense was created from the belief that animals are not merely companions, but conscious beings with emotional memory, spiritual depth, and purpose. Our pets walk beside us through joy, trauma, healing, and transition—often carrying our burdens quietly while guiding us back to ourselves.
            </p>
            <p className="font-body text-lg text-[#3A3A3A] leading-relaxed">
              This service was born from lived experience, loss, and an undeniable bond that transcended the physical. Pawollie Sense exists to honor that bond.
            </p>
            <p className="font-body text-lg text-[#3A3A3A] leading-relaxed">
              We provide intuitive, symbolic, and spiritually guided insights into your pet's emotional world—past, present, and beyond—helping owners better understand their companions, support their behaviors with compassion, and preserve their legacy when they pass.
            </p>
            <div className="bg-[#9DB5A5]/20 border-l-4 border-[#D4AF37] p-4 rounded-r-lg">
              <p className="font-body text-[#2D3561] italic">
                This is not a replacement for veterinary or behavioral professionals. Pawollie Sense is a spiritual and interpretive service, designed to complement love, care, and understanding—not override medical or ethical responsibility.
              </p>
            </div>
          </div>
        </div>

        {/* Why We Started */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-16">
          <h3 className="font-display text-3xl font-bold text-[#2D3561] mb-6 text-center">
            Why We Started Pawollie Sense
          </h3>
          <p className="font-body text-lg text-[#3A3A3A] leading-relaxed text-center max-w-3xl mx-auto mb-8">
            Pawollie Sense began after experiencing profound connection and loss with a beloved dog whose presence felt purposeful, protective, and deeply aware. When traditional explanations fell short of capturing that bond, intuitive exploration revealed something clearer.
          </p>
          
          {/* Reasons Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((reason, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-2xl bg-[#F5F1E8] hover:bg-[#9DB5A5]/20 transition-colors duration-300"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2D3561] text-[#D4AF37] mb-4">
                  {reason.icon}
                </div>
                <h4 className="font-display text-lg font-bold text-[#2D3561] mb-2">
                  {reason.title}
                </h4>
                <p className="font-body text-sm text-[#3A3A3A]">
                  {reason.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6 border border-[#9DB5A5]/30">
          <p className="font-display text-lg text-[#2D3561] text-center leading-relaxed italic">
            Animals teach us how to stay present, how to love without condition, and how to return to ourselves.
          </p>
        </div>

        {/* Closing Statement */}
        <div className="text-center">
          <p className="font-body text-xl text-[#2D3561] italic max-w-2xl mx-auto">
            Pawollie Sense is rooted in reverence, not spectacle. Every session is approached with care, grounding, and ethical intention.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
