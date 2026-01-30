import React, { useState } from 'react';
import { pawprintUrl } from '@/lib/brand-assets';

interface FAQ {
  question: string;
  answer: string;
}

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQ[] = [
    {
      question: 'What is Pawollie Sense?',
      answer: 'Pawollie Sense is a spiritual and interpretive service that provides intuitive, symbolic insights into your pet\'s emotional world. We help owners better understand their companions, support their behaviors with compassion, and preserve their legacy. This is not a replacement for veterinary or behavioral professionals—it\'s designed to complement love, care, and understanding.',
    },
    {
      question: 'What photos do I need to submit?',
      answer: 'We require 2-5 clear photos of your pet. Front and back paw photos are strongly recommended for the most accurate reading. Additional photos of your pet\'s full body and face are helpful. Please ensure good lighting and clear focus in all images.',
    },
    {
      question: 'How long does it take to receive my reading?',
      answer: 'Most readings are completed within 3-5 business days after we receive your intake form and photos. Memorial readings and more complex services may take slightly longer. We\'ll keep you updated on the progress.',
    },
    {
      question: 'Can you communicate with deceased pets?',
      answer: 'Pawollie Sense does not claim mediumship or direct communication with deceased pets. Our Memorial Reading service focuses on emotional closure, legacy, and honoring the bond through symbolic interpretation. It\'s intentionally grounded and non-exploitative.',
    },
    {
      question: 'Is this a replacement for veterinary care?',
      answer: 'No. Pawollie Sense is a spiritual and interpretive service only. It does not provide medical, veterinary, behavioral, legal, or psychological advice. If your pet has health or behavioral concerns, please consult with qualified professionals.',
    },
    {
      question: 'What if I don\'t know my pet\'s exact birth date?',
      answer: 'For Pet Birth Chart readings, when exact birth date or time is unavailable, we use an intuitive midpoint or solar-based method, which is disclosed in your reading. The chart remains interpretive and symbolic rather than claiming astrological certainty.',
    },
    {
      question: 'How do I name my photo files?',
      answer: 'Please name your files using this format: [photo-type]_[petname]_[lastname].jpg. For example: front-paws_bella_smith.jpg. Photo types include: front-paws, back-paws, full-body, face, and extra.',
    },
    {
      question: 'Are readings confidential?',
      answer: 'Yes, all information you share is kept strictly confidential. Your intake form responses, photos, and reading results are used solely for your session and are never shared without your explicit consent.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute bottom-0 left-0 w-64 h-64 opacity-5">
        <img
          src="https://d64gsuwffb70l.cloudfront.net/694089d9f886fb409f4804a9_1765837414597_22ef29f4.png"
          alt=""
          className="w-full h-full object-cover"
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1 bg-[#9DB5A5]/30 text-[#2D3561] font-display text-sm font-semibold rounded-full mb-4">
            FAQ
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#2D3561] mb-6">
            Frequently Asked Questions
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

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`bg-[#F5F1E8] rounded-2xl overflow-hidden transition-all duration-300 ${
                openIndex === index ? 'shadow-lg' : ''
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="font-display text-lg font-semibold text-[#2D3561] pr-4">
                  {faq.question}
                </span>
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full bg-[#2D3561] flex items-center justify-center transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                >
                  <svg
                    className="w-4 h-4 text-[#D4AF37]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-5">
                  <p className="font-body text-[#3A3A3A] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Help */}
        <div className="mt-12 text-center">
          <p className="font-body text-[#3A3A3A] mb-4">
            Still have questions? We're here to help.
          </p>
          <a
            href="mailto:hello@pawolliesense.com"
            className="inline-flex items-center px-6 py-3 bg-[#2D3561] text-white font-display font-semibold rounded-full hover:bg-[#3D4A7A] transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Us
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
