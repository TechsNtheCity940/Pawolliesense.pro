import React, { useState } from 'react';
import { pawprintUrl } from '@/lib/brand-assets';

interface Testimonial {
  id: number;
  name: string;
  petName: string;
  petType: string;
  service: string;
  quote: string;
  rating: number;
}

const TestimonialsSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials: Testimonial[] = [
    {
      id: 1,
      name: 'Sarah M.',
      petName: 'Luna',
      petType: 'Golden Retriever',
      service: 'Paw Reading',
      quote: "The insights about Luna's protective nature and her role as my guardian were incredibly accurate. It helped me understand why she's always so alert when strangers approach. This reading brought me so much closer to understanding her.",
      rating: 5,
    },
    {
      id: 2,
      name: 'Michael T.',
      petName: 'Max',
      petType: 'German Shepherd',
      service: 'Behavior & Emotional Insight',
      quote: "After Max's anxiety worsened following our move, I was desperate for answers. The emotional insight session revealed patterns I hadn't noticed and gave me tools to support him better. He's so much calmer now.",
      rating: 5,
    },
    {
      id: 3,
      name: 'Jennifer L.',
      petName: 'Bella',
      petType: 'Labrador Mix',
      service: 'Spirit Profile',
      quote: "Learning that Bella is a 'Healer Soul' explained everything about our bond. She came into my life during my hardest year, and now I understand why. This service is truly special.",
      rating: 5,
    },
    {
      id: 4,
      name: 'David R.',
      petName: 'Charlie',
      petType: 'Beagle',
      service: 'Memorial Reading',
      quote: "Losing Charlie was the hardest thing I've ever experienced. The memorial reading gave me closure and helped me see the beautiful purpose of our time together. I'm forever grateful.",
      rating: 5,
    },
    {
      id: 5,
      name: 'Amanda K.',
      petName: 'Rosie',
      petType: 'Poodle',
      service: 'Pet Birth Chart',
      quote: "The birth chart reading was fascinating! It explained Rosie's quirky personality traits and her need for routine. Now I understand her so much better and can support her needs.",
      rating: 5,
    },
  ];

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-24 bg-[#F5F1E8] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-5">
        <img
          src="https://d64gsuwffb70l.cloudfront.net/694089d9f886fb409f4804a9_1765837414597_22ef29f4.png"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-[#9DB5A5]/30 text-[#2D3561] font-display text-sm font-semibold rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#2D3561] mb-6">
            Stories from Our Community
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

        {/* Testimonial Carousel */}
        <div className="relative">
          {/* Main Testimonial Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 relative">
            {/* Quote Icon */}
            <div className="absolute -top-6 left-8">
              <div className="w-12 h-12 bg-[#D4AF37] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
            </div>

            {/* Stars */}
            <div className="flex justify-center mb-6 mt-4">
              {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                <svg
                  key={i}
                  className="w-6 h-6 text-[#D4AF37]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
              ))}
            </div>

            {/* Quote */}
            <blockquote className="font-body text-xl text-[#3A3A3A] text-center leading-relaxed mb-8 italic">
              "{testimonials[activeIndex].quote}"
            </blockquote>

            {/* Author Info */}
            <div className="text-center">
              <p className="font-display text-lg font-bold text-[#2D3561]">
                {testimonials[activeIndex].name}
              </p>
              <p className="font-body text-[#9DB5A5]">
                {testimonials[activeIndex].petName} • {testimonials[activeIndex].petType}
              </p>
              <span className="inline-block mt-2 px-3 py-1 bg-[#2D3561]/10 text-[#2D3561] font-display text-sm rounded-full">
                {testimonials[activeIndex].service}
              </span>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center items-center mt-8 space-x-4">
            <button
              onClick={prevTestimonial}
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[#2D3561] hover:bg-[#2D3561] hover:text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === activeIndex
                      ? 'bg-[#D4AF37] w-8'
                      : 'bg-[#9DB5A5]/50 hover:bg-[#9DB5A5]'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-[#2D3561] hover:bg-[#2D3561] hover:text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
