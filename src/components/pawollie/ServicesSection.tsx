import React, { useState } from 'react';
import { pawprintUrl, pawLabelCalmUrl, pawLabelGridUrl, pawLabelJoyUrl } from '@/lib/brand-assets';

interface Service {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  icon: React.ReactNode;
  price: string;
  image?: string;
}

interface ServicesSectionProps {
  onNavigate: (section: string) => void;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ onNavigate }) => {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const coreServices: Service[] = [
    {
      id: 'paw-reading',
      title: 'Paw Reading — Emotional & Energetic Insight',
      shortDesc: 'Foundational symbolic + intuitive reading of your pet’s emotional world through their paws.',
      fullDesc:
        'The Paw Reading is the foundational Pawollie Sense service and centers on symbolic and intuitive interpretation of a pet’s emotional world through their physical presence, with particular emphasis on the paws. Front paws are interpreted as indicators of outward energy, protection, interaction style, and how the pet engages with their environment and owner. Back paws reflect grounding, emotional security, stability, and how the pet processes stress, safety, and rest. Clients submit 2–5 clear photos, with front and back paws strongly recommended. Using the intake history and visual symbolism, this service provides written insight into emotional temperament, loyalty style, unspoken needs, and the role the pet naturally plays within the household. This service is interpretive and spiritual in nature and is not medical, veterinary, or behavioral diagnosis.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
          />
        </svg>
      ),
      price: '$19.99',
      image: pawLabelCalmUrl,
    },
    {
      id: 'behavior-insight',
      title: 'Behavior & Aura Paw-file',
      shortDesc: 'Emotional and relational interpretation of recurring behaviors (not clinical training).',
      fullDesc:
        'This service explores recurring or concerning behaviors through emotional and relational interpretation rather than professional behavioral assessment. It is designed to help owners understand behaviors such as anxiety, protectiveness, withdrawal, clinginess, fear responses, or sudden changes following major life events (moves, illness, trauma, loss, or routine disruption). Interpretations are based on owner-provided history, intake responses, and submitted photos. The session identifies emotional triggers, coping behaviors, and how the pet’s actions relate to their sense of safety or purpose. This service does not replace veterinary care, training, or behavioral therapy and is intended to provide clarity, empathy, and supportive understanding only.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ),
      price: '$19.99',
      image: pawLabelGridUrl,
    },
    {
      id: 'spirit-profile',
      title: 'Soul Discovery — Soul Role & Bond Meaning',
      shortDesc: 'Reveal the symbolic soul role your pet fulfills and why your bond feels significant.',
      fullDesc:
        'The Spirit Profile identifies the symbolic soul role a pet fulfills in their owner’s life. Roles may include Guardian, Healer, Mirror Soul, Teacher, Old Soul, or Transitional Companion. This reading explains how the pet emotionally supports, reflects, or guides the owner, what the bond represents, and how the relationship functions beyond routine companionship. The focus is on meaning, connection, and emotional purpose rather than prediction, psychic claims, or supernatural assertions. This service helps owners better understand why the bond feels significant and how to honor it while the pet is living.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
      price: '$19.99',
      image: pawLabelCalmUrl,
    },
    {
      id: 'birth-chart',
      title: 'Pet Birth Chart — Symbolic Personality Mapping',
      shortDesc: 'Interpretive birth chart to understand temperament rhythms and comfort cycles.',
      fullDesc:
        'The Pet Birth Chart is a symbolic and interpretive personality map created using known or estimated birth information. When an exact birth date or time is unavailable, an intuitive midpoint or solar-based method is used and clearly disclosed. This chart highlights temperament tendencies, emotional rhythms, stress and comfort cycles, and compatibility themes between pet and owner. It is reflective rather than scientific or predictive and is intended to provide insight into how a pet naturally responds to their environment, routines, and emotional tone.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      price: '$19.99',
      image: pawLabelGridUrl,
    },
  ];

  const packServices: Service[] = [
    {
      id: 'pawmarks-pack',
      title: 'Pawmarks Pack — Legacy & Transition Insight',
      shortDesc: 'Memorial-focused insight with a permanent digital tribute space.',
      fullDesc:
        'The Memorial Reading is offered for pets who have passed and focuses on honoring the bond, providing emotional closure, and reflecting on the pet’s role and legacy. It symbolically interprets the meaning of the pet’s life with the owner and what remains emotionally carried forward. This service does not involve claims of direct communication, mediumship, or messages from the deceased. It is intentionally grounded, respectful, and designed to support grief through meaning rather than sensationalism. Includes a spot on the Digital Memorial Page — a long-term hosted memorial (feed/timeline style) where photos, tributes, and messages can be posted and kept accessible over time, public or private. A keepsake storybook can be added for an additional cost that varies based on the custom book.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      price: '$45',
      image: pawLabelCalmUrl,
    },
    {
      id: 'combone-pack',
      title: 'Combone Pack — Full Pawollie Experience',
      shortDesc: 'All core readings together with optional creative add-ons.',
      fullDesc:
        'The Full Package combines core Pawollie Sense services into a single, cohesive experience. It typically includes the Paw Reading, Behavior & Aura Paw-file, Pawollie Birth/Star Chart, and Soul Discovery, with optional add-ons such as a Pawollie Vision Photo and Pawsitive Pupdate. This package is designed for owners seeking a comprehensive understanding of their pet’s emotional world, role, and bond, ensuring no aspect of the relationship is viewed in isolation.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      price: '$39.99',
      image: pawLabelJoyUrl,
    },
    {
      id: 'furmily-pack',
      title: 'Furmily Pack — Whole Household Bundle',
      shortDesc: 'Soul Discovery + Aura Paw-file for every pet in the family.',
      fullDesc:
        'The Furmily Pack gives the Soul Discovery and Behavior & Aura Paw-file to every member of the family—no matter how many. Ideal for multi-pet households that want each companion’s emotional role, behaviors, and relational dynamics understood together.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      price: '$39.99',
      image: pawLabelGridUrl,
    },
  ];

  const addOns: Service[] = [
    {
      id: 'pupdate-solo',
      title: 'Pawsitive Pupdate (Solo)',
      shortDesc: 'Single daily read of your dog’s current mood or state of emotion.',
      fullDesc:
        'A quick-turn daily reading that captures your dog’s current mood and emotional state. Delivered as a concise check-in for days when you want a little extra clarity.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      price: '$4.99',
      image: pawLabelJoyUrl,
    },
    {
      id: 'pupdate-add',
      title: 'Pawsitive Pupdate (Add-on)',
      shortDesc: 'Add a daily mood check to any other service.',
      fullDesc:
        'Add this quick daily emotional read to any booked service for a lighter touch-in on your companion’s current energy. Perfect for pairing with Paw Reading or Behavior & Aura Paw-file.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
      price: '$2.99 (add-on)',
      image: pawLabelCalmUrl,
    },
    {
      id: 'pawollie-vision-photo',
      title: 'Pawollie Vision Photo',
      shortDesc: 'A generated portrait of your dog’s spirit in true nature with aura depicted.',
      fullDesc:
        'A custom-generated visual of your dog’s spirit, illustrating their essence and aura in a single keepsake image. Great as a standalone or alongside any reading.',
      icon: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h18M3 12h18M3 19h18" />
        </svg>
      ),
      price: '$9.99',
      image: pawLabelJoyUrl,
    },
  ];

  const handleBookService = (serviceId: string) => {
    window.dispatchEvent(new CustomEvent('pawollie:intake:select-service', { detail: { serviceId } }));
    onNavigate('intake');
    const element = document.getElementById('intake');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-24 bg-gradient-to-b from-[#2D3561] to-[#3D4A7A] relative overflow-hidden">
      {/* Constellation Background */}
      <div className="absolute inset-0 stars-bg opacity-30" />

      {/* Decorative Stars */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-twinkle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        >
          <svg className="w-2 h-2 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
          </svg>
        </div>
      ))}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-[#D4AF37]/20 text-[#D4AF37] font-display text-sm font-semibold rounded-full mb-4">
            Pawollie Picks
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Core Services</h2>
          <div className="flex items-center justify-center mb-8">
            <div className="h-px w-12 bg-[#D4AF37]" />
            <img src={pawprintUrl} alt="" className="w-8 h-8 mx-3 brightness-0 invert" />
            <div className="h-px w-12 bg-[#D4AF37]" />
          </div>
          <p className="font-body text-lg text-white/80 max-w-2xl mx-auto">
            Intuitive, symbolic, and spiritually guided offerings to understand your companion’s emotions, role, and rhythms.
          </p>
        </div>

        {/* Core Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coreServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:border-[#D4AF37]/50 transition-all duration-300 card-celestial ${
                expandedService === service.id ? 'lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              {service.image && (
                <div className="mb-4 overflow-hidden rounded-xl border border-white/20">
                  <img src={service.image} alt={service.title} className="w-full h-32 object-cover" />
                </div>
              )}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] mb-4">
                {service.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">{service.title}</h3>
              <p className="font-display text-2xl font-bold text-[#D4AF37] mb-3">{service.price}</p>
              <p className="font-body text-white/70 mb-4 text-sm leading-relaxed">
                {expandedService === service.id ? service.fullDesc : service.shortDesc}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                  className="px-4 py-2 text-sm font-display font-medium text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors"
                >
                  {expandedService === service.id ? 'Show Less' : 'Learn More'}
                </button>
                <button
                  onClick={() => handleBookService(service.id)}
                  className="px-4 py-2 text-sm font-display font-semibold bg-[#D4AF37] text-[#2D3561] rounded-full hover:bg-[#E5C158] transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pawollie Packs */}
        <div className="mt-16 text-center">
          <span className="inline-block px-4 py-1 bg-white/10 text-white font-display text-sm font-semibold rounded-full mb-3 border border-white/20">
            Pawollie Packs
          </span>
          <h3 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">Bundled Experiences</h3>
          <p className="font-body text-white/80 max-w-2xl mx-auto">
            Packages for deeper journeys, memorial support, and multi-pet families.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {packServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/15 hover:border-[#D4AF37]/50 transition-all duration-300 card-celestial ${
                expandedService === service.id ? 'lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              {service.image && (
                <div className="mb-4 overflow-hidden rounded-xl border border-white/15">
                  <img src={service.image} alt={service.title} className="w-full h-32 object-cover" />
                </div>
              )}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] mb-4">
                {service.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">{service.title}</h3>
              <p className="font-display text-2xl font-bold text-[#D4AF37] mb-3">{service.price}</p>
              <p className="font-body text-white/75 mb-4 text-sm leading-relaxed">
                {expandedService === service.id ? service.fullDesc : service.shortDesc}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                  className="px-4 py-2 text-sm font-display font-medium text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors"
                >
                  {expandedService === service.id ? 'Show Less' : 'Learn More'}
                </button>
                <button
                  onClick={() => handleBookService(service.id)}
                  className="px-4 py-2 text-sm font-display font-semibold bg-[#D4AF37] text-[#2D3561] rounded-full hover:bg-[#E5C158] transition-colors"
                >
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Intake + Ethical Callouts */}
        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/15">
            <h4 className="font-display text-xl font-bold text-[#D4AF37] mb-3">
              INTAKE, FILE HANDLING & SERVICE BEHAVIOR (FINALIZED)
            </h4>
            <p className="font-body text-white/80 text-sm leading-relaxed">
              All services require completion of a structured intake form. Clients provide pet history, behavioral context,
              service selection, consent acknowledgment, and 2–5 photos. For paw readings, front and back paws are strongly
              recommended. Uploaded files are stored under the customer’s last name for organizational continuity. All
              interpretations are based strictly on the information and images submitted; no services are performed without
              completed intake and consent.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/15">
            <h4 className="font-display text-xl font-bold text-[#D4AF37] mb-3">
              ETHICAL DISCLOSURE (FINALIZED LANGUAGE)
            </h4>
            <p className="font-body text-white/80 text-sm leading-relaxed">
              Pawollie Sense is a spiritual and interpretive service. It does not provide medical, veterinary, behavioral,
              psychological, or legal advice. It does not claim psychic ability, prediction, or mediumship. All insights are
              symbolic, reflective, and intended for comfort, understanding, and personal meaning only.
            </p>
          </div>
        </div>

        {/* Add-ons */}
        <div className="mt-16 text-center">
          <span className="inline-block px-4 py-1 bg-white/10 text-white font-display text-sm font-semibold rounded-full mb-3 border border-white/20">
            Pawsitive Add-ons
          </span>
          <h3 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">Quick companions to any service</h3>
          <p className="font-body text-white/80 max-w-2xl mx-auto">
            Lightweight upgrades for daily insight or a keepsake spirit portrait. Add them solo or pair with any reading.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {addOns.map((service) => (
            <div
              key={service.id}
              className={`bg-white/5 backdrop-blur-sm rounded-2xl p-5 border border-white/15 hover:border-[#D4AF37]/50 transition-all duration-300 card-celestial ${
                expandedService === service.id ? 'lg:col-span-2 lg:row-span-2' : ''
              }`}
            >
              {service.image && (
                <div className="mb-4 overflow-hidden rounded-xl border border-white/15">
                  <img src={service.image} alt={service.title} className="w-full h-32 object-cover" />
                </div>
              )}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] mb-4">
                {service.icon}
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">{service.title}</h3>
              <p className="font-display text-2xl font-bold text-[#D4AF37] mb-3">{service.price}</p>
              <p className="font-body text-white/75 mb-4 text-sm leading-relaxed">
                {expandedService === service.id ? service.fullDesc : service.shortDesc}
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                  className="px-4 py-2 text-sm font-display font-medium text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors"
                >
                  {expandedService === service.id ? 'Show Less' : 'Learn More'}
                </button>
                <button
                  onClick={() => handleBookService(service.id)}
                  className="px-4 py-2 text-sm font-display font-semibold bg-[#D4AF37] text-[#2D3561] rounded-full hover:bg-[#E5C158] transition-colors"
                >
                  Add Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
