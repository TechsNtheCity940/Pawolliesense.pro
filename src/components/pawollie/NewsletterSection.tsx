import React, { useState } from 'react';
import { subscribeToNewsletter } from '@/lib/database';

const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: subscribeError } = await subscribeToNewsletter(email);
      
      if (subscribeError) {
        throw subscribeError;
      }

      setSubmitSuccess(true);
      setEmail('');
    } catch (err: any) {
      console.error('Newsletter subscription error:', err);
      setError(err.message || 'Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-r from-[#2D3561] to-[#3D4A7A] relative overflow-hidden">
      {/* Stars Background */}
      <div className="absolute inset-0 stars-bg opacity-30" />
      
      {/* Decorative Elements */}
      {[...Array(8)].map((_, i) => (
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/20 mb-6">
            <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Stay Connected with Pawollie Sense
          </h2>
          <p className="font-body text-white/80 mb-8 max-w-xl mx-auto">
            Receive gentle wisdom, pet care insights, and updates on new services delivered to your inbox.
          </p>

          {/* Form */}
          {submitSuccess ? (
            <div className="bg-green-500/20 border border-green-500/50 rounded-2xl p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-display text-lg font-semibold text-white">
                Welcome to the Pawollie Family!
              </p>
              <p className="font-body text-white/70 text-sm mt-2">
                Check your inbox for a welcome message from us.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-5 py-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 font-body focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-4 font-display font-bold rounded-full transition-all ${
                    isSubmitting
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-[#D4AF37] text-[#2D3561] hover:bg-[#E5C158] hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>
              {error && (
                <p className="mt-3 text-red-400 font-body text-sm">{error}</p>
              )}
              <p className="mt-4 font-body text-white/50 text-xs">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
