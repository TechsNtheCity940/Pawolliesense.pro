import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';

const ThankYou: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'capturing' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) return;

    const runCapture = async () => {
      try {
        setStatus('capturing');
        setMessage('Confirming your PayPal payment...');
        const response = await fetch(`/api/paypal/capture?token=${encodeURIComponent(token)}`, {
          method: 'POST'
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result?.ok) {
          throw new Error(result?.error || 'Unable to confirm PayPal payment.');
        }
        setStatus('success');
        setMessage('Payment confirmed. Your order is now in the admin queue.');
      } catch (error: any) {
        setStatus('error');
        setMessage(error?.message || 'We could not confirm payment automatically. Please contact support.');
      }
    };

    runCapture();
  }, []);

  return (
    <SiteLayout>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Submission received</div>
            <h1 className="hero-title">Thank you</h1>
            <p className="section-lede">Your form submission has been received.</p>
            {status === 'capturing' ? <p className="mini">{message}</p> : null}
            {status === 'success' ? <p className="mini">{message}</p> : null}
            {status === 'error' ? <p className="mini" style={{ color: '#9b3333' }}>{message}</p> : null}
            <div className="hero-actions">
              <Link className="cta" to="/#home">Return home</Link>
              <Link className="cta secondary" to="/services">Browse services</Link>
            </div>
            <p className="mini">If you do not see a confirmation email, please check your spam or junk folder.</p>
          </div>
          <div className="stack">
            <img className="hero-logo" src="/assets/pawollelogo.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default ThankYou;
