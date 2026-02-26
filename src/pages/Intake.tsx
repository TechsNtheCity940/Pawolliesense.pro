import React, { useEffect, useMemo, useRef, useState } from 'react';
import SiteLayout from '@/components/site/SiteLayout';
import { useLocation } from 'react-router-dom';

type ServiceOption = {
  key: string;
  name: string;
  price: number;
  priceLabel: string;
  tag: string;
  desc: string;
  type: 'instant' | 'crafted';
};

declare global {
  interface Window {
    paypal?: {
      HostedButtons: (options: { hostedButtonId: string }) => {
        render: (selector: string) => Promise<void>;
      };
    };
  }
}

const SERVICES: ServiceOption[] = [
  {
    key: 'full_spirit_pawfile',
    name: 'Full Spirit Pawfile',
    price: 35,
    priceLabel: '$35',
    tag: 'Most Loved - Foundational Insight',
    desc: 'A complete spirit profile revealing your pet\'s spiritual archetype, personality traits, emotional energy, love language, communication style, and deeper soul patterns that shape who they are and how they connect with you.',
    type: 'crafted'
  },
  {
    key: 'behavior_bond_guidance',
    name: 'Behavior Bond Guidance',
    price: 40,
    priceLabel: '$40',
    tag: 'Practical Support - Bond Healing',
    desc: 'A personalized insight into your pet\'s character and behavioral patterns, identifying emotional triggers, personality-driven responses, and the root cause behind challenges-paired with compassionate guidance to strengthen trust, balance, and connection.',
    type: 'crafted'
  },
  {
    key: 'pawmarks_pack',
    name: 'Pawmarks Pack (Memorial & Keepsake Experience)',
    price: 45,
    priceLabel: '$45',
    tag: 'Memorial - Keepsake Experience',
    desc: 'A heart-centered memorial experience honoring your pet\'s spirit, unspoken messages, and lasting bond-including a Forever Pawmarks memorial post preserved as a never-ending tribute to their life and love.',
    type: 'crafted'
  },
  {
    key: 'pawmark_post',
    name: 'Pawmark Post (Memorial Feed Post Only)',
    price: 15,
    priceLabel: '$15',
    tag: 'Memorial Post Only',
    desc: 'A memorial feed post honoring your pet with a tribute message, photo, and optional song link.',
    type: 'crafted'
  },
  {
    key: 'star_chart',
    name: 'Star Chart (Pet Astrology Insight)',
    price: 19,
    priceLabel: '$19',
    tag: 'Deep Discovery',
    desc: 'A personalized star chart explaining your pet\'s temperament, emotional wiring, and soul patterns that influence how they love, learn, and relate.',
    type: 'crafted'
  },
  {
    key: 'paw_reading',
    name: 'Paw Reading (Pawprint Insight)',
    price: 19,
    priceLabel: '$19',
    tag: 'Deep Discovery',
    desc: 'An intuitive reading of your pet\'s pawprint to understand their needs, emotional expressions, personality traits, and the unique ways they give and receive love.',
    type: 'crafted'
  },
  {
    key: 'pawollie_vision',
    name: 'Pawollie Vision (Spirit Portrait)',
    price: 19,
    priceLabel: '$19',
    tag: 'Deep Discovery',
    desc: 'A custom spirit-style portrait capturing your pet\'s energy, presence, and soul essence-created as a meaningful visual keepsake.',
    type: 'crafted'
  },
  {
    key: 'express_pawdate',
    name: 'Express Pawdate',
    price: 9,
    priceLabel: '$9',
    tag: 'Quick Quest - Instant delivery',
    desc: 'A quick emotional and energetic check-in offering insight into your pet\'s current mood, needs, or inner state.',
    type: 'instant'
  },
  {
    key: 'quick_quest',
    name: 'Quick Quest (One Question Insight)',
    price: 9,
    priceLabel: '$9',
    tag: 'Quick Quest - Instant delivery',
    desc: 'A focused response to one specific question, providing fast intuitive clarity when you need reassurance or direction.',
    type: 'instant'
  },
  {
    key: 'bond_spark',
    name: 'Bond Spark (Mini Insight)',
    price: 9,
    priceLabel: '$9',
    tag: 'Quick Quest - Instant delivery',
    desc: 'A short personality-based insight highlighting one meaningful way to support, connect with, or uplift your pet right now-perfect for gifting or quick guidance.',
    type: 'instant'
  },
  {
    key: 'all_paws_pack',
    name: 'All-Paws Pack (Every Service Included)',
    price: 119,
    priceLabel: '$119',
    tag: 'Best Value - Great Gift',
    desc: 'The complete Pawollie Sense experience-all services combined into one deeply personalized journey, with optional keepsakes and upgrades available.',
    type: 'crafted'
  },
  {
    key: 'furmily_pack',
    name: 'Furmily Pack (Multi-Pet Household Pack)',
    price: 79,
    priceLabel: '$79',
    tag: 'Multi-Pet - Great Gift',
    desc: 'Choose any two services per pet for every animal in your home, no matter how many-created for families who want insight, understanding, and care for all their companions.',
    type: 'crafted'
  }
];

const QUICK_TONES = [
  { value: 'calm', label: 'Calm + grounding' },
  { value: 'uplifting', label: 'Uplifting + hopeful' },
  { value: 'direct', label: 'Direct + clear' },
  { value: 'comforting', label: 'Comforting + soft' }
];

const QUICK_SERVICE_KEYS = ['express_pawdate', 'quick_quest', 'bond_spark'];
const DEEP_SERVICE_KEYS = ['star_chart', 'paw_reading', 'pawollie_vision'];
const PACK_SERVICE_KEYS = ['all_paws_pack', 'furmily_pack'];

const QUICK_PROMPTS: Record<string, { label: string; placeholder: string; required: boolean }> = {
  express_pawdate: {
    label: 'Anything you want us to tune into? (optional)',
    placeholder: 'Example: mood shifts, new environment, recent changes.',
    required: false
  },
  quick_quest: {
    label: 'Your one question / request',
    placeholder: 'Example: What does my pet need from me right now?',
    required: true
  },
  bond_spark: {
    label: 'Anything you want highlighted? (optional)',
    placeholder: 'Example: ways to support, comfort, or uplift today.',
    required: false
  }
};

const FURMILY_SERVICE_OPTIONS = [
  'Full Spirit Pawfile',
  'Behavior Bond Guidance',
  'Pawmarks Pack (Memorial & Keepsake Experience)',
  'Star Chart (Pet Astrology Insight)',
  'Paw Reading (Pawprint Insight)',
  'Pawollie Vision (Spirit Portrait)',
  'Express Pawdate',
  'Quick Quest (One Question Insight)',
  'Bond Spark (Mini Insight)'
];

const KEEPSAKES = [
  {
    key: 'memorial_print',
    title: 'Memorial canvas or framed print',
    desc: 'Get your favorite portion of your reading printed on a canvas.',
    cta: 'Add memorial print',
    priceLabel: '$79'
  },
  {
    key: 'chart_certificate',
    title: 'Star chart certificate',
    desc: 'Your pet\'s birth/star reading turned into a printable certificate (digital + optional print).',
    cta: 'Add chart certificate',
    priceLabel: '$39'
  },
  {
    key: 'apparel',
    title: 'Pawollie constellation tee/hoodie',
    desc: 'Name + constellation map or Pawollie Vision portrait printed on apparel (tee: $44, hoodie: $69).',
    cta: 'Add apparel keepsake',
    priceLabel: '$44+'
  },
  {
    key: 'tag_ornament',
    title: 'Keepsake tag / ornament',
    desc: 'Keychain tag or ornament memorializing pets who have crossed over, with name + dates.',
    cta: 'Add tag or ornament',
    priceLabel: '$29'
  }
];

const KEEPSAKE_PRICES: Record<string, number> = {
  memorial_print: 79,
  chart_certificate: 39,
  apparel: 44,
  tag_ornament: 29
};

const APPAREL_PRICES = {
  tee: 44,
  hoodie: 69
};

const VALID_KEEPSAKE_KEYS = new Set(Object.keys(KEEPSAKE_PRICES));

const PAYPAL_HOSTED_SDK_SRC = 'https://www.paypal.com/sdk/js?client-id=BAAp8LDFJ3ShdhXqqjkmc47raYL4GHUAebnE98zbMmm68og4ZWfOMgOnWxK8r_fIx4rz3UTPaVMI6l2rGk&components=hosted-buttons&enable-funding=venmo&currency=USD';

const PAYPAL_HOSTED_BUTTON_BY_SERVICE: Record<string, string> = {
  pawmarks_pack: '4ERWHGFHAEXL4',
  pawmark_post: 'NZCUPV236B3LQ',
  full_spirit_pawfile: 'RDMZX65XWUDPJ',
  behavior_bond_guidance: 'K8DB358DKGQ7C',
  star_chart: 'U3DWX4QSS2VKW',
  paw_reading: 'U3DWX4QSS2VKW',
  pawollie_vision: 'U3DWX4QSS2VKW',
  express_pawdate: '8BGQ5M2KS2D78',
  quick_quest: '8BGQ5M2KS2D78',
  bond_spark: '8BGQ5M2KS2D78',
  all_paws_pack: 'PYDDPVJGRKFJ2',
  furmily_pack: '6DHTR8PG3XSSS'
};

let paypalHostedSdkPromise: Promise<void> | null = null;

const loadPayPalHostedSdk = () => {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.paypal?.HostedButtons) return Promise.resolve();
  if (paypalHostedSdkPromise) return paypalHostedSdkPromise;

  paypalHostedSdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PAYPAL_HOSTED_SDK_SRC}"]`);
    if (existing) {
      if (window.paypal?.HostedButtons) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load PayPal SDK.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = PAYPAL_HOSTED_SDK_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load PayPal SDK.'));
    document.body.appendChild(script);
  });

  return paypalHostedSdkPromise;
};
const Intake: React.FC = () => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const location = useLocation();
  const [selectedService, setSelectedService] = useState<string>('');
  const [quickTone, setQuickTone] = useState('calm');
  const [furmilyCount, setFurmilyCount] = useState(2);
  const [keepsakes, setKeepsakes] = useState<string[]>([]);
  const [apparelItemType, setApparelItemType] = useState<'tee' | 'hoodie'>('tee');
  const [submitStatus, setSubmitStatus] = useState<{
    state: 'idle' | 'submitting' | 'success' | 'error';
    message?: string;
  }>({ state: 'idle' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [intakeReadyForPayment, setIntakeReadyForPayment] = useState(false);
  const [savedReadingId, setSavedReadingId] = useState<string>('');
  const [paypalHostedError, setPaypalHostedError] = useState('');

  const selectedServiceMeta = useMemo(
    () => SERVICES.find((service) => service.key === selectedService) ?? null,
    [selectedService]
  );

  const total = useMemo(() => selectedServiceMeta?.price ?? 0, [selectedServiceMeta]);
  const keepsakeTotal = useMemo(
    () => keepsakes.reduce((sum, key) => {
      if (key === 'apparel') {
        return sum + (apparelItemType === 'hoodie' ? APPAREL_PRICES.hoodie : APPAREL_PRICES.tee);
      }
      return sum + (KEEPSAKE_PRICES[key] || 0);
    }, 0),
    [keepsakes, apparelItemType]
  );
  const grandTotal = total + keepsakeTotal;

  const summaryService = useMemo(
    () => selectedServiceMeta?.name ?? 'None selected',
    [selectedServiceMeta]
  );

  const isQuick = QUICK_SERVICE_KEYS.includes(selectedService);
  const isDeep = DEEP_SERVICE_KEYS.includes(selectedService);
  const isPack = PACK_SERVICE_KEYS.includes(selectedService);
  const isPawmark = selectedService === 'pawmarks_pack' || selectedService === 'pawmark_post';
  const quickPrompt = QUICK_PROMPTS[selectedService] ?? QUICK_PROMPTS.quick_quest;

  const isInstant = selectedServiceMeta?.type === 'instant';
  const isCrafted = selectedServiceMeta?.type === 'crafted';
  const showKeepsakes = Boolean(isCrafted && selectedService !== 'pawmark_post');
  const showCommunity = Boolean(isCrafted && selectedService !== 'pawmark_post');
  const hostedButtonId = useMemo(
    () => PAYPAL_HOSTED_BUTTON_BY_SERVICE[selectedService] || '',
    [selectedService]
  );
  const hostedContainerId = useMemo(
    () => (hostedButtonId ? `paypal-hosted-container-${hostedButtonId.toLowerCase()}` : ''),
    [hostedButtonId]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const service = params.get('service');
    if (!service) return;
    if (SERVICES.some((item) => item.key === service)) {
      setSelectedService(service);
    }
  }, [location.search]);

  useEffect(() => {
    if (!selectedService) return;
    const params = new URLSearchParams(location.search);
    const keepsakeParams = params.getAll('keepsake')
      .map((value) => String(value || '').trim().toLowerCase())
      .filter((value) => VALID_KEEPSAKE_KEYS.has(value));
    if (!keepsakeParams.length) return;

    const selectedServiceDef = SERVICES.find((item) => item.key === selectedService);
    const canAttachKeepsakes = Boolean(selectedServiceDef?.type === 'crafted' && selectedService !== 'pawmark_post');
    if (!canAttachKeepsakes) return;

    setKeepsakes(Array.from(new Set(keepsakeParams)));
    const apparelQuery = String(params.get('apparel') || '').trim().toLowerCase();
    if (apparelQuery === 'hoodie') {
      setApparelItemType('hoodie');
    }
  }, [location.search, selectedService]);

  useEffect(() => {
    setIntakeReadyForPayment(false);
    setSavedReadingId('');
    setPaypalHostedError('');
    setKeepsakes([]);
    setApparelItemType('tee');
    setSubmitStatus((prev) => (prev.state === 'submitting' ? prev : { state: 'idle' }));
  }, [selectedService]);

  useEffect(() => {
    if (!intakeReadyForPayment || !hostedButtonId || !hostedContainerId) return;

    let cancelled = false;
    const renderHostedButton = async () => {
      try {
        setPaypalHostedError('');
        await loadPayPalHostedSdk();
        if (cancelled) return;

        const container = document.getElementById(hostedContainerId);
        if (!container) return;
        container.innerHTML = '';

        if (!window.paypal?.HostedButtons) {
          throw new Error('PayPal hosted buttons are not available.');
        }

        await window.paypal.HostedButtons({ hostedButtonId }).render(`#${hostedContainerId}`);
      } catch (error: any) {
        if (cancelled) return;
        setPaypalHostedError(error?.message || 'Unable to load PayPal button.');
      }
    };

    renderHostedButton();

    return () => {
      cancelled = true;
      const container = document.getElementById(hostedContainerId);
      if (container) container.innerHTML = '';
    };
  }, [hostedButtonId, hostedContainerId, intakeReadyForPayment]);

  const handlePlaceOrder = () => {
    const form = formRef.current;
    if (!form) return;
    form.requestSubmit();
  };

  const toggleKeepsake = (key: string) => {
    setKeepsakes((current) => (
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    ));
  };

  const buildIntakePayload = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const payload: Record<string, string | string[] | boolean> = {};
    data.forEach((value, key) => {
      const normalized = value instanceof File ? value.name : String(value);
      const existing = payload[key];
      if (!existing) {
        payload[key] = normalized;
      } else if (Array.isArray(existing)) {
        payload[key] = [...existing, normalized];
      } else {
        payload[key] = [existing, normalized];
      }
    });

    payload.selected_service = selectedService;
    payload.keepsakes = keepsakes;
    payload.wagbook_selected = false;
    payload.estimated_total = String(total);

    return payload;
  };

  const submitNetlifyForm = async (form: HTMLFormElement) => {
    const formData = new FormData(form);
    await fetch('/', {
      method: 'POST',
      body: formData
    });
  };

  const submitIntakeToSupabase = async (form: HTMLFormElement) => {
    const payload = buildIntakePayload(form);
    const response = await fetch('/api/intake-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || 'Intake submission failed.');
    }
    return result;
  };

  const getSelectedPhotoFiles = (form: HTMLFormElement) => {
    const data = new FormData(form);
    const queue: Array<{ file: File; photoType: string }> = [];

    const ownerPhoto = data.get('owner_photo');
    if (ownerPhoto instanceof File && ownerPhoto.size > 0) {
      queue.push({ file: ownerPhoto, photoType: 'owner_profile' });
    }

    data.getAll('pet_photos').forEach((item) => {
      if (item instanceof File && item.size > 0) {
        queue.push({ file: item, photoType: 'pet_photo' });
      }
    });

    data.getAll('photos').forEach((item) => {
      if (item instanceof File && item.size > 0) {
        queue.push({ file: item, photoType: 'intake_photo' });
      }
    });

    return queue;
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
      reader.readAsDataURL(file);
    });

  const uploadIntakePhotos = async (
    readingId: string,
    files: Array<{ file: File; photoType: string }>
  ) => {
    for (const entry of files) {
      const base64 = await fileToBase64(entry.file);
      const response = await fetch('/api/intake-upload-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingId,
          fileName: entry.file.name,
          fileType: entry.file.type,
          photoType: entry.photoType,
          base64
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || `Failed to upload ${entry.file.name}.`);
      }
    }
  };

  const createPayPalCheckout = async (serviceKey: string, readingId?: string, email?: string) => {
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart: [{ id: serviceKey, quantity: 1 }],
        readingId,
        email
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.url) {
      throw new Error(result?.error || 'PayPal checkout failed.');
    }
    return result.url as string;
  };

  const handleIntakeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedService) {
      setSubmitStatus({ state: 'error', message: 'Please choose a service before continuing.' });
      return;
    }

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const photoFiles = getSelectedPhotoFiles(form);

    try {
      setIsSubmitting(true);
      setIntakeReadyForPayment(false);
      setSavedReadingId('');
      setSubmitStatus({ state: 'submitting', message: 'Saving your intake...' });
      await submitNetlifyForm(form);
      const intakeResult = await submitIntakeToSupabase(form);
      const readingId = String(intakeResult?.readingId || '').trim();
      setSavedReadingId(readingId);
      if (photoFiles.length) {
        if (!readingId) {
          throw new Error('Unable to link uploaded photos to this order.');
        }
        setSubmitStatus({ state: 'submitting', message: `Uploading ${photoFiles.length} photo(s)...` });
        await uploadIntakePhotos(readingId, photoFiles);
      }

      if (hostedButtonId) {
        setIntakeReadyForPayment(true);
        setSubmitStatus({
          state: 'success',
          message: 'Intake saved. Complete payment with the PayPal button below.'
        });
        return;
      }

      const checkoutUrl = await createPayPalCheckout(selectedService, readingId, email);
      window.location.href = checkoutUrl;
    } catch (error: any) {
      setSubmitStatus({
        state: 'error',
        message: error?.message || 'Unable to start checkout. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SiteLayout
      footerLinks={[
        { label: 'Services', to: '/services' },
        { label: 'FAQ', to: '/faq' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section className="section intake-shell">
        <div className="intake-wrap">
          <header className="intake-header">
            <div className="intake-title">
              <h1>Begin Your Pawollie Sense Experience</h1>
              <p className="intake-sub">
                Intuitive experiences created to help you understand, guide, and honor the animals who walk beside you.
                Choose a service to reveal only the questions needed for that experience.
              </p>
              <div className="intake-pill">
                <span>Payment:</span> <strong>PayPal</strong>
                <span>Delivery:</span> <strong>Email-only</strong>
                <span>Instant:</span> <strong>$9 Quick Quests</strong>
              </div>
            </div>
            <div className="intake-hero-art">
              <img src="/assets/oli_globe_2.png" alt="Pawollie Sense globe illustration" />
            </div>
          </header>

          <div className="intake-grid">
            <form
              ref={formRef}
              id="intakeForm"
              className="intake-card intake-form-card"
              name="pawollie-intake"
              method="POST"
              data-netlify="true"
              data-netlify-honeypot="bot-field"
              action="/thank-you"
              encType="multipart/form-data"
              autoComplete="on"
              onSubmit={handleIntakeSubmit}
            >
              <input type="hidden" name="form-name" value="pawollie-intake" />
              <input type="hidden" name="selected_service_summary" value={summaryService} />
              <input type="hidden" name="estimated_total" value={String(total)} />

              <p hidden>
                <label>Do not fill this out: <input name="bot-field" /></label>
              </p>

              {submitStatus.state === 'error' && (
                <div className="notice intake-summary-note">
                  {submitStatus.message || 'Submission failed. Please try again.'}
                </div>
              )}
              {submitStatus.state === 'submitting' && (
                <div className="notice intake-summary-note">
                  {submitStatus.message || 'Preparing secure checkout...'}
                </div>
              )}
              {submitStatus.state === 'success' && (
                <div className="notice intake-summary-note intake-note-ok">
                  {submitStatus.message}
                </div>
              )}

              <h2 className="intake-step-title">1) Choose your service</h2>
              <div className="intake-service-grid">
                {SERVICES.map((service) => (
                  <label key={service.key} className="intake-service-card">
                    <div className="intake-service-top">
                      <div className="intake-service-choice">
                        <input
                          type="radio"
                          name="service_choice"
                          value={service.key}
                          checked={selectedService === service.key}
                          onChange={() => setSelectedService(service.key)}
                        />
                        <strong>{service.name}</strong>
                      </div>
                      <span className="intake-service-price">{service.priceLabel}</span>
                    </div>
                    <p>{service.desc}</p>
                    <span className="intake-service-tag">{service.tag}</span>
                  </label>
                ))}
              </div>

              <div className="intake-divider"></div>

              <h2 className="intake-step-title">2) Guardian + Pet basics</h2>
              <div className="intake-row">
                <div>
                  <label>Guardian name <span className="intake-req">*</span></label>
                  <input name="guardian_name" required placeholder="Your name" />
                </div>
                <div>
                  <label>Email <span className="intake-req">*</span></label>
                  <input type="email" name="email" required placeholder="you@email.com" />
                </div>
              </div>

              <div className="intake-row">
                <div>
                  <label>Time zone</label>
                  <select name="timezone" defaultValue="America/Chicago">
                    <option value="America/Chicago">America/Chicago</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="America/Denver">America/Denver</option>
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div>
                  <label>Relationship to pet</label>
                  <select name="relationship" defaultValue="Guardian / Owner">
                    <option>Guardian / Owner</option>
                    <option>Co-guardian</option>
                    <option>Family member</option>
                    <option>Foster</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="intake-row">
                <div>
                  <label>Pet name <span className="intake-req">*</span></label>
                  <input name="pet_name" required placeholder="Oliver" />
                </div>
                <div>
                  <label>Species</label>
                  <select name="species" defaultValue="Dog">
                    <option>Dog</option>
                    <option>Cat</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="intake-row">
                <div>
                  <label>Breed / mix (if known)</label>
                  <input name="breed" placeholder="Shorkie, etc." />
                </div>
                <div>
                  <label>Birth date (optional)</label>
                  <input type="date" name="birth_date" />
                </div>
              </div>

              <section className="intake-module">
                <h2>Universal Intake (Required for all services)</h2>
                <div className="intake-row">
                  <div>
                    <label>Age (or best estimate) <span className="intake-req">*</span></label>
                    <input name="age" required placeholder="Example: 3 years" />
                  </div>
                  <div>
                    <label>Sex + spayed/neutered <span className="intake-req">*</span></label>
                    <input name="sex" required placeholder="Example: Female, spayed" />
                  </div>
                </div>
                <div className="intake-row">
                  <div>
                    <label>How long have you had your pet? <span className="intake-req">*</span></label>
                    <input name="owner_duration" required placeholder="Example: 2 years" />
                  </div>
                  <div>
                    <label>Rescue/rehomed? (yes/no)</label>
                    <select name="rescue_rehomed" defaultValue="no">
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>
                <div className="intake-field">
                  <label>Rescue/rehomed details (if yes)</label>
                  <textarea name="rescue_details" placeholder="Share any adoption, foster, or rehoming context."></textarea>
                </div>
                <div className="intake-row">
                  <div>
                    <label>Home environment <span className="intake-req">*</span></label>
                    <input name="home_environment" required placeholder="Kids, other pets, space, routine" />
                  </div>
                  <div>
                    <label>Energy level <span className="intake-req">*</span></label>
                    <select name="energy_level" defaultValue="medium">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="intake-field">
                  <label>Primary goal for this reading <span className="intake-req">*</span></label>
                  <textarea name="primary_goal" required placeholder="What result do you want from this service?"></textarea>
                </div>
                <div className="intake-field">
                  <label>Top 3 concerns <span className="intake-req">*</span></label>
                  <textarea name="top_concerns" required placeholder="Bond, behavior, anxiety, grief, communication, etc."></textarea>
                </div>
                <div className="intake-field">
                  <label>Behavior notes</label>
                  <textarea name="behavior_notes" placeholder="What/when/where/how often/triggers."></textarea>
                </div>
                <div className="intake-field">
                  <label>Health notes</label>
                  <textarea name="health_notes" placeholder="Known conditions, meds, vet context."></textarea>
                </div>
                <div className="intake-field">
                  <label>Training history</label>
                  <textarea name="training_history" placeholder="What has been tried and results."></textarea>
                </div>
                <div className="intake-row">
                  <div>
                    <label>Birth time (if known)</label>
                    <input name="birth_time" placeholder="Exact, approximate, or unknown" />
                  </div>
                  <div>
                    <label>Birth location (if known)</label>
                    <input name="birth_location" placeholder="City, State, Country" />
                  </div>
                </div>
                <div className="intake-field">
                  <label>If birth details are unknown, add notes</label>
                  <textarea name="birth_unknown_notes" placeholder="Estimated timeframe + location or unknown context."></textarea>
                </div>
                <div className="intake-row">
                  <div>
                    <label>Preferred tone</label>
                    <select name="owner_tone" defaultValue="gentle">
                      <option value="gentle">Gentle</option>
                      <option value="direct">Direct</option>
                      <option value="uplifting">Uplifting</option>
                    </select>
                  </div>
                  <div>
                    <label>Spiritual depth</label>
                    <select name="spiritual_level" defaultValue="medium">
                      <option value="light">Light</option>
                      <option value="medium">Medium</option>
                      <option value="deep">Deep</option>
                    </select>
                  </div>
                </div>
                <div className="intake-row">
                  <div>
                    <label>Want actionable steps?</label>
                    <select name="want_action_steps" defaultValue="yes">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label>Anything to avoid mentioning?</label>
                    <input name="avoid_mentions" placeholder="Optional boundaries or topics to avoid" />
                  </div>
                </div>
                <div className="intake-field">
                  <label>Photo checklist (mark what you are providing)</label>
                  <div className="intake-row">
                    <label className="intake-checkbox"><input type="checkbox" name="core_photo_face" /> Face/eyes close-up</label>
                    <label className="intake-checkbox"><input type="checkbox" name="core_photo_full_body" /> Full body standing</label>
                  </div>
                  <div className="intake-row">
                    <label className="intake-checkbox"><input type="checkbox" name="core_photo_paw" /> Paw pads close-up</label>
                    <label className="intake-checkbox"><input type="checkbox" name="core_photo_candid" /> Candid in their element</label>
                  </div>
                  <label className="intake-checkbox"><input type="checkbox" name="core_photo_memorial" /> Memorial photos (if applicable)</label>
                </div>
              </section>

              <div className="intake-field">
                <label>Guardian photo (optional)</label>
                <input id="owner_photo" type="file" name="owner_photo" accept="image/*" />
                <div className="intake-hint">If provided, this image is saved to the customer profile.</div>
              </div>

              <div className="intake-field">
                <label>Pet photos (recommended)</label>
                <input id="pet_photos" type="file" name="pet_photos" multiple accept="image/*" />
                <div className="intake-hint">Upload clear images for AI generation and keepsake production.</div>
              </div>

              <div className="intake-field">
                <label>Additional reference photos (optional)</label>
                <input id="photos" type="file" name="photos" multiple accept="image/*" />
                <div className="intake-hint">Extra references are also attached to this order.</div>
              </div>

              {isQuick ? (
                <section className="intake-module">
                  <h2>{selectedServiceMeta?.name ?? 'Quick Quest'} ({selectedServiceMeta?.priceLabel ?? '$9'})</h2>
                  <p className="intake-hint">Instant delivery after payment confirms.</p>
                  <input type="hidden" name="qq_type" value={selectedService} />
                  <div className="intake-row">
                    <div>
                      <label>Tone</label>
                      <select name="qq_tone" value={quickTone} onChange={(event) => setQuickTone(event.target.value)}>
                        {QUICK_TONES.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="intake-field">
                    <label>
                      {quickPrompt.label} {quickPrompt.required ? <span className="intake-req">*</span> : null}
                    </label>
                    <textarea
                      name="qq_prompt"
                      required={quickPrompt.required}
                      placeholder={quickPrompt.placeholder}
                    ></textarea>
                  </div>
                  <div className="intake-field">
                    <label>Context (optional)</label>
                    <textarea name="qq_context" placeholder="Anything relevant: routine change, mood, environment, recent events..."></textarea>
                  </div>
                </section>
              ) : null}

              {selectedService === 'full_spirit_pawfile' ? (
                <section className="intake-module">
                  <h2>{selectedServiceMeta?.name ?? 'Full Spirit Pawfile'} ({selectedServiceMeta?.priceLabel ?? '$35'})</h2>
                  <p className="intake-hint">Spiritual archetype, traits, emotional energy, love language, communication style, deeper soul patterns.</p>
                  <div className="intake-row">
                    <div>
                      <label>Top personality words (up to 6)</label>
                      <input name="pf_traits" placeholder="gentle, watchful, playful, wise..." />
                    </div>
                    <div>
                      <label>How do they show love?</label>
                      <input name="pf_love" placeholder="cuddles, follows me, brings toys, eye contact..." />
                    </div>
                  </div>
                  <div className="intake-field">
                    <label>How do they communicate most clearly?</label>
                    <textarea name="pf_communicate" placeholder="What signals do they use-body language, sounds, routines, behaviors?"></textarea>
                  </div>
                  <div className="intake-field">
                    <label>Bond snapshot: what's your connection like?</label>
                    <textarea name="pf_bond" placeholder="How you feel together, what's special about them, what you've learned..."></textarea>
                  </div>
                </section>
              ) : null}

              {selectedService === 'behavior_bond_guidance' ? (
                <section className="intake-module">
                  <h2>{selectedServiceMeta?.name ?? 'Behavior Bond Guidance'} ({selectedServiceMeta?.priceLabel ?? '$40'})</h2>
                  <p className="intake-hint">Emotional triggers + personality-driven responses + compassionate guidance for trust and balance.</p>
                  <div className="intake-row">
                    <div>
                      <label>Primary focus</label>
                      <select name="bg_focus" defaultValue="Anxiety / fear">
                        <option>Anxiety / fear</option>
                        <option>Reactivity</option>
                        <option>Separation stress</option>
                        <option>Sudden shift</option>
                        <option>Bond strengthening</option>
                        <option>Transition / end-of-life support</option>
                      </select>
                    </div>
                    <div>
                      <label>When did this begin?</label>
                      <input name="bg_when" placeholder="Example: 2 months ago" />
                    </div>
                  </div>
                  <div className="intake-field">
                    <label>What happens (details + frequency)?</label>
                    <textarea name="bg_story" placeholder="Describe triggers, intensity, patterns, what helps, what worsens..."></textarea>
                  </div>
                  <div className="intake-field">
                    <label>Recent life changes?</label>
                    <textarea name="bg_changes" placeholder="Move, new schedule, new pet, loss, health changes..."></textarea>
                  </div>
                  <div className="intake-divider"></div>
                  <h3>Behavior Deep-Dive Add-on Intake</h3>
                  <div className="intake-field">
                    <label>1) Exact behaviors of concern</label>
                    <textarea name="bg_behaviors" placeholder="List each behavior that concerns you."></textarea>
                  </div>
                  <div className="intake-row">
                    <div>
                      <label>2) When did each begin?</label>
                      <input name="bg_start" placeholder="Example: after moving homes in November" />
                    </div>
                    <div>
                      <label>3) Triggers you notice</label>
                      <input name="bg_triggers" placeholder="Sounds, strangers, separation, routines, etc." />
                    </div>
                  </div>
                  <div className="intake-row">
                    <div>
                      <label>4) Frequency + intensity (1-10)</label>
                      <input name="bg_frequency_intensity" placeholder="Example: daily, intensity 7/10" />
                    </div>
                    <div>
                      <label>5) What helps / what worsens?</label>
                      <input name="bg_helps_worse" placeholder="Calming routines, specific stressors, etc." />
                    </div>
                  </div>
                  <div className="intake-field">
                    <label>6) Daily routine</label>
                    <textarea name="bg_routine" placeholder="Wake, meals, walks, play, alone time."></textarea>
                  </div>
                  <div className="intake-field">
                    <label>7) Recent changes</label>
                    <textarea name="bg_recent_changes" placeholder="Move, new pet, new person, schedule changes."></textarea>
                  </div>
                  <div className="intake-field">
                    <label>8) Vet notes</label>
                    <textarea name="bg_vet_notes" placeholder="Pain, allergies, hearing/vision, meds, vet observations."></textarea>
                  </div>
                </section>
              ) : null}

              {isPawmark ? (
                <section className="intake-module">
                  <h2>
                    {selectedServiceMeta
                      ? `${selectedServiceMeta.name} (${selectedServiceMeta.priceLabel})`
                      : 'Pawmark'}
                  </h2>
                  <p className="intake-hint">
                    {selectedService === 'pawmark_post'
                      ? 'Memorial feed post only. Share how they should be honored, a tribute, and optional song.'
                      : 'A heart-centered memorial experience honoring your pet\'s spirit, unspoken messages, and a Forever Pawmarks memorial post.'}
                  </p>
                  <div className="intake-row">
                    <div>
                      <label>Status</label>
                      <select name="pm_status" defaultValue="Living">
                        <option>Living</option>
                        <option>Passed</option>
                        <option>Transitioning / elder stage</option>
                      </select>
                    </div>
                    <div>
                      <label>Community memorial post visibility</label>
                      <select name="pm_visibility" defaultValue="private">
                        <option value="private">Private (email-only)</option>
                        <option value="community">Forever Pawmarks (admin-created memorial post)</option>
                      </select>
                    </div>
                  </div>
                  <div className="intake-field">
                    <label>How should they be honored?</label>
                    <textarea name="pm_honor" placeholder="Comforting, celebratory, story-driven, spiritual, light, etc."></textarea>
                  </div>
                  <div className="intake-field">
                    <label>Unspoken message request (optional)</label>
                    <textarea name="pm_message" placeholder="What do you wish you could hear from them? What do you hope to understand?"></textarea>
                  </div>
                  <div className="intake-divider"></div>
                  <h3>Memorial / Grief Support Intake</h3>
                  <div className="intake-field">
                    <label>Owner's relationship story</label>
                    <textarea name="memorial_story" placeholder="Share the relationship story in a few sentences."></textarea>
                  </div>
                  <div className="intake-row">
                    <div>
                      <label>Favorite quirks / routines</label>
                      <input name="memorial_quirks" placeholder="Little habits, routines, favorite things." />
                    </div>
                    <div>
                      <label>Hardest part right now</label>
                      <input name="memorial_hardest_part" placeholder="What feels heaviest today?" />
                    </div>
                  </div>
                  <div className="intake-row">
                    <div>
                      <label>Closure message as if from your pet?</label>
                      <select name="memorial_closure_message" defaultValue="no">
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label>Spiritual level for memorial</label>
                      <select name="memorial_spiritual_level" defaultValue="medium">
                        <option value="light">Light</option>
                        <option value="medium">Medium</option>
                        <option value="deep">Deep</option>
                      </select>
                    </div>
                  </div>
                  <div className="intake-field">
                    <label>Anything to avoid mentioning?</label>
                    <input name="memorial_avoid" placeholder="Optional boundaries for memorial language." />
                  </div>
                  <div className="intake-row">
                    <div>
                      <label>Song tribute (YouTube link optional)</label>
                      <input name="pm_song_youtube" placeholder="https://youtube.com/..." />
                    </div>
                    <div>
                      <label>Or upload audio (optional)</label>
                      <input type="file" name="pm_song_file" accept="audio/*" />
                    </div>
                  </div>
                </section>
              ) : null}

              {isDeep ? (
                <section className="intake-module">
                  <h2>{selectedServiceMeta?.name ?? 'Deep Discovery'} ({selectedServiceMeta?.priceLabel ?? '$19'})</h2>
                  <input type="hidden" name="dd_type" value={selectedService} />
                  <div className="intake-row">
                    <div>
                      <label>Focus</label>
                      <select name="dd_focus" defaultValue="Personality + temperament">
                        <option>Personality + temperament</option>
                        <option>Emotional wiring</option>
                        <option>Bond + communication</option>
                        <option>Comfort + reassurance</option>
                      </select>
                    </div>
                  </div>

                  {selectedService === 'star_chart' ? (
                    <div className="intake-field">
                      <h3>Birth Chart Details</h3>
                      <div className="intake-row">
                        <div>
                          <label>Birth location</label>
                          <input name="sc_location" placeholder="City, State, Country" />
                        </div>
                        <div>
                          <label>Birth time (optional)</label>
                          <input name="sc_time" placeholder="Example: 3:20 PM" />
                        </div>
                      </div>
                      <div className="intake-hint">If time is unknown, we create a symbolic reading using date + place.</div>
                      <div className="intake-field">
                        <label>If unknown, add adoption date/location and early-life notes</label>
                        <textarea name="bc_unknown_notes" placeholder="Include any estimate or known timeline notes."></textarea>
                      </div>
                    </div>
                  ) : null}

                  {selectedService === 'paw_reading' ? (
                    <div className="intake-field">
                      <h3>Past Life Opt-in Intake</h3>
                      <div className="intake-row">
                        <div>
                          <label>Comfortable with symbolic spiritual framing?</label>
                          <select name="pl_opt_in" defaultValue="yes">
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div>
                          <label>Depth level</label>
                          <select name="pl_depth" defaultValue="light">
                            <option value="light">Light</option>
                            <option value="medium">Medium</option>
                            <option value="deep">Deep</option>
                          </select>
                        </div>
                      </div>
                      <div className="intake-row">
                        <div>
                          <label>Focus area</label>
                          <select name="pl_focus" defaultValue="bond">
                            <option value="bond">Bond</option>
                            <option value="lessons">Lessons</option>
                            <option value="purpose">Purpose</option>
                            <option value="patterns">Patterns</option>
                          </select>
                        </div>
                        <div>
                          <label>Paw photos provided?</label>
                          <select name="pl_paw_photos" defaultValue="yes">
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>
                      <div className="intake-field">
                        <label>Anything to avoid mentioning?</label>
                        <textarea name="pl_avoid" placeholder="Share topics you'd like excluded."></textarea>
                      </div>
                      <label>Pawprint source</label>
                      <select name="paw_source" defaultValue="Photo of paw / pawprint">
                        <option>Photo of paw / pawprint</option>
                        <option>Ink pawprint (memorial)</option>
                        <option>I will upload what I have</option>
                      </select>
                      <div className="intake-hint">Upload a clear paw photo if possible (optional but helps).</div>
                    </div>
                  ) : null}

                  {selectedService === 'pawollie_vision' ? (
                    <div className="intake-field">
                      <label>Portrait vibe</label>
                      <select name="vision_style" defaultValue="Soft celestial (default)">
                        <option>Soft celestial (default)</option>
                        <option>Tranquil starlight</option>
                        <option>Constellation outline</option>
                        <option>Memorial glow</option>
                      </select>
                      <div className="intake-hint">Upload 1-3 clear face photos for best results.</div>
                    </div>
                  ) : null}

                  <div className="intake-field">
                    <label>Anything important to include?</label>
                    <textarea name="dd_notes" placeholder="Symbols, colors, traits, bond notes, or what you want reflected..."></textarea>
                  </div>
                </section>
              ) : null}

              {isPack ? (
                <section className="intake-module">
                  <h2>
                    {selectedServiceMeta
                      ? `${selectedServiceMeta.name} (${selectedServiceMeta.priceLabel})`
                      : 'Pawollie Pack'}
                  </h2>
                  <input type="hidden" name="pack_choice" value={selectedService} />
                  <div className="intake-row">
                    <div>
                      <label>What do you want most from this pack?</label>
                      <input name="pack_goal" placeholder="Clarity, comfort, bond, memorial honoring..." />
                    </div>
                  </div>

                  {selectedService === 'all_paws_pack' ? (
                    <div className="intake-field">
                      <div className="intake-hint">All-Paws includes every service. Provide any extra context that matters:</div>
                      <textarea
                        name="allpaws_notes"
                        placeholder="Key behaviors, bond story, memorial context (if any), what you want emphasized..."
                      ></textarea>
                      <div className="intake-divider"></div>
                      <h3>Personality Focus details</h3>
                      <div className="intake-row">
                        <div>
                          <label>Top personality words (up to 6)</label>
                          <input name="pf_traits" placeholder="gentle, watchful, playful, wise..." />
                        </div>
                        <div>
                          <label>How do they show love?</label>
                          <input name="pf_love" placeholder="cuddles, follows me, brings toys, eye contact..." />
                        </div>
                      </div>
                      <div className="intake-field">
                        <label>How do they communicate most clearly?</label>
                        <textarea name="pf_communicate" placeholder="Body language, sounds, routines, behaviors."></textarea>
                      </div>
                      <div className="intake-field">
                        <label>Bond snapshot</label>
                        <textarea name="pf_bond" placeholder="How you feel together and what feels most special."></textarea>
                      </div>

                      <div className="intake-divider"></div>
                      <h3>Behavior Focus details</h3>
                      <div className="intake-field">
                        <label>Exact behaviors of concern</label>
                        <textarea name="bg_behaviors" placeholder="List each behavior, when it happens, and what triggers it."></textarea>
                      </div>
                      <div className="intake-row">
                        <div>
                          <label>When did each begin?</label>
                          <input name="bg_start" placeholder="Example: after moving homes in November" />
                        </div>
                        <div>
                          <label>Frequency + intensity (1-10)</label>
                          <input name="bg_frequency_intensity" placeholder="Example: daily, intensity 7/10" />
                        </div>
                      </div>
                      <div className="intake-row">
                        <div>
                          <label>Triggers</label>
                          <input name="bg_triggers" placeholder="Sounds, strangers, separation, routines, etc." />
                        </div>
                        <div>
                          <label>What helps / worsens?</label>
                          <input name="bg_helps_worse" placeholder="Calming routines and stressors." />
                        </div>
                      </div>
                      <div className="intake-field">
                        <label>Daily routine + recent changes</label>
                        <textarea name="bg_routine" placeholder="Wake, meals, walks, play, alone time, and recent changes."></textarea>
                      </div>
                      <div className="intake-field">
                        <label>Vet notes for behavior context</label>
                        <textarea name="bg_vet_notes" placeholder="Pain, allergies, hearing/vision changes, meds, or vet observations."></textarea>
                      </div>

                      <div className="intake-divider"></div>
                      <h3>Past Life Opt-in (for bundle)</h3>
                      <div className="intake-row">
                        <div>
                          <label>Include Past Life section?</label>
                          <select name="pl_opt_in" defaultValue="no">
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        </div>
                        <div>
                          <label>Depth level</label>
                          <select name="pl_depth" defaultValue="light">
                            <option value="light">Light</option>
                            <option value="medium">Medium</option>
                            <option value="deep">Deep</option>
                          </select>
                        </div>
                      </div>
                      <div className="intake-row">
                        <div>
                          <label>Focus area</label>
                          <select name="pl_focus" defaultValue="bond">
                            <option value="bond">Bond</option>
                            <option value="lessons">Lessons</option>
                            <option value="purpose">Purpose</option>
                            <option value="patterns">Patterns</option>
                          </select>
                        </div>
                        <div>
                          <label>Paw photos provided?</label>
                          <select name="pl_paw_photos" defaultValue="no">
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        </div>
                      </div>
                      <div className="intake-field">
                        <label>Past Life topics to avoid</label>
                        <textarea name="pl_avoid" placeholder="Optional boundaries for this section."></textarea>
                      </div>

                      <div className="intake-divider"></div>
                      <h3>Birth Chart details</h3>
                      <div className="intake-row">
                        <div>
                          <label>Birth location</label>
                          <input name="sc_location" placeholder="City, State, Country" />
                        </div>
                        <div>
                          <label>Birth time</label>
                          <input name="sc_time" placeholder="Exact, approximate, or unknown" />
                        </div>
                      </div>
                      <div className="intake-field">
                        <label>If unknown, add adoption date/location + early-life notes</label>
                        <textarea name="bc_unknown_notes" placeholder="Include any timeline estimates you know."></textarea>
                      </div>
                    </div>
                  ) : null}

                  {selectedService === 'furmily_pack' ? (
                    <div className="intake-field">
                      <label>How many pets are in your home? <span className="intake-req">*</span></label>
                      <select
                        id="furmily_count"
                        name="furmily_count"
                        value={furmilyCount}
                        onChange={(event) => setFurmilyCount(Number(event.target.value))}
                      >
                        {[1, 2, 3, 4, 5].map((count) => (
                          <option key={count} value={count}>{count}</option>
                        ))}
                      </select>
                      <div className="intake-hint">
                        Furmily Pack: choose any two services per pet. This form collects each pet + their two choices.
                      </div>
                      <div className="intake-furmily-grid">
                        {Array.from({ length: furmilyCount }, (_, index) => (
                          <div key={`furmily-${index}`} className="intake-furmily-card">
                            <h3>Pet {index + 1}</h3>
                            <input
                              name={`furmily_pet_${index + 1}_name`}
                              placeholder="Pet name"
                            />
                            <div className="intake-row">
                              <div>
                                <label>Service choice A</label>
                                <select name={`furmily_pet_${index + 1}_service_a`}>
                                  {FURMILY_SERVICE_OPTIONS.map((option) => (
                                    <option key={`${option}-a`} value={option}>{option}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label>Service choice B</label>
                                <select name={`furmily_pet_${index + 1}_service_b`}>
                                  {FURMILY_SERVICE_OPTIONS.map((option) => (
                                    <option key={`${option}-b`} value={option}>{option}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {showCommunity ? (
                <section className="intake-module">
                  <h2>Community Care (Optional Add-On)</h2>
                  <p className="intake-hint">
                    Pass N' Prints is community-supported and reviewed case-by-case. Decision and timeframe communicated via email.
                  </p>
                  <label className="intake-checkbox">
                    <input type="checkbox" name="pass_n_prints" />
                    I'd like to request Pass N' Prints consideration (optional)
                  </label>
                </section>
              ) : null}

              {showKeepsakes ? (
                <section className="intake-module">
                  <h2>Optional Keepsakes (Add-Ons)</h2>
                  <p className="intake-hint">
                    Turn your reading into something you can hold, frame, wear, or gift. Each keepsake is built from your submission.
                  </p>
                  <div className="intake-keepsake-grid">
                    {KEEPSAKES.map((item) => (
                      <div key={item.key} className={`intake-keepsake-card${keepsakes.includes(item.key) ? ' selected' : ''}`}>
                        <h4>{item.title}</h4>
                        <p className="intake-keepsake-desc">{item.desc}</p>
                        <div className="intake-keepsake-meta">Price: {item.priceLabel}</div>
                        <button
                          type="button"
                          className="intake-keepsake-btn"
                          onClick={() => toggleKeepsake(item.key)}
                        >
                          {keepsakes.includes(item.key) ? 'Added' : item.cta}
                        </button>
                      </div>
                    ))}
                  </div>
                  {keepsakes.length ? (
                    <div className="intake-field intake-keepsake-config">
                      <h3>Keepsake Details</h3>
                      <div className="intake-row">
                        <div>
                          <label>Recipient name (shipping label)</label>
                          <input name="k_ship_name" required={keepsakes.length > 0} placeholder="Name for the package" />
                        </div>
                        <div>
                          <label>Recipient email</label>
                          <input type="email" name="k_ship_email" placeholder="Email for shipment updates" />
                        </div>
                      </div>
                      <div className="intake-row">
                        <div>
                          <label>Address line 1</label>
                          <input name="k_ship_address1" required={keepsakes.length > 0} placeholder="Street address" />
                        </div>
                        <div>
                          <label>Address line 2</label>
                          <input name="k_ship_address2" placeholder="Apt, suite, unit (optional)" />
                        </div>
                      </div>
                      <div className="intake-row">
                        <div>
                          <label>City</label>
                          <input name="k_ship_city" required={keepsakes.length > 0} placeholder="City" />
                        </div>
                        <div>
                          <label>State / Province</label>
                          <input name="k_ship_state" required={keepsakes.length > 0} placeholder="State or province" />
                        </div>
                      </div>
                      <div className="intake-row">
                        <div>
                          <label>Postal code</label>
                          <input name="k_ship_postal" required={keepsakes.length > 0} placeholder="ZIP or postal code" />
                        </div>
                        <div>
                          <label>Country</label>
                          <input name="k_ship_country" required={keepsakes.length > 0} placeholder="US, Canada, etc." />
                        </div>
                      </div>
                      <div className="intake-row">
                        <div>
                          <label>Phone (optional)</label>
                          <input name="k_ship_phone" placeholder="For carrier updates" />
                        </div>
                        <div>
                          <label>Design style preference</label>
                          <input name="k_style" placeholder="Minimal, celestial, memorial, etc." />
                        </div>
                      </div>
                      <div className="intake-field">
                        <label>Notes for the keepsake(s)</label>
                        <textarea name="k_notes" placeholder="Exact names, dates, preferred quote, layout requests, etc."></textarea>
                      </div>
                      {keepsakes.includes('memorial_print') ? (
                        <div className="intake-field">
                          <h4>Memorial print details</h4>
                          <div className="intake-row">
                            <div>
                              <label>Custom quote (optional)</label>
                              <input name="k_quote" placeholder="Text to feature on the print" />
                            </div>
                            <div>
                              <label>Use reading excerpt</label>
                              <input name="k_excerpt" placeholder="Paste favorite reading line if desired" />
                            </div>
                          </div>
                          <div className="intake-row">
                            <div>
                              <label>Print type</label>
                              <select name="k_memorial_format" defaultValue="canvas">
                                <option value="canvas">Canvas print</option>
                                <option value="framed">Framed print</option>
                                <option value="digital">Digital file only</option>
                              </select>
                            </div>
                            <div>
                              <label>Preferred orientation</label>
                              <select name="k_memorial_orientation" defaultValue="portrait">
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                                <option value="square">Square</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {keepsakes.includes('chart_certificate') ? (
                        <div className="intake-field">
                          <h4>Star chart certificate details</h4>
                          <div className="intake-row">
                            <div>
                              <label>Format</label>
                              <select name="k_chart_format" defaultValue="digital_printable">
                                <option value="digital_printable">Digital printable</option>
                                <option value="printed_certificate">Printed certificate</option>
                                <option value="both">Both digital + printed</option>
                              </select>
                            </div>
                            <div>
                              <label>Include constellation style</label>
                              <select name="k_chart_style" defaultValue="classic">
                                <option value="classic">Classic certificate</option>
                                <option value="celestial">Celestial map style</option>
                                <option value="modern">Modern clean style</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {keepsakes.includes('apparel') ? (
                        <div className="intake-field">
                          <h4>Apparel details</h4>
                          <div className="intake-row">
                            <div>
                              <label>Item type</label>
                              <select
                                name="k_apparel_item"
                                value={apparelItemType}
                                onChange={(event) => setApparelItemType(event.target.value === 'hoodie' ? 'hoodie' : 'tee')}
                              >
                                <option value="tee">T-shirt</option>
                                <option value="hoodie">Hoodie</option>
                              </select>
                            </div>
                            <div>
                              <label>Size</label>
                              <select name="k_apparel_size" defaultValue="M">
                                {['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'].map((size) => (
                                  <option key={size} value={size}>{size}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="intake-row">
                            <div>
                              <label>Color</label>
                              <input name="k_apparel_color" placeholder="Black, navy, seafoam, etc." />
                            </div>
                            <div>
                              <label>Art source</label>
                              <select name="k_apparel_art_source" defaultValue="constellation_map">
                                <option value="constellation_map">Constellation map</option>
                                <option value="pawollie_vision">Pawollie Vision portrait</option>
                              </select>
                            </div>
                          </div>
                          <div className="intake-field">
                            <label>Text to print (optional)</label>
                            <input name="k_apparel_text" placeholder="Favorite quote or short line to include" />
                          </div>
                        </div>
                      ) : null}
                      {keepsakes.includes('tag_ornament') ? (
                        <div className="intake-field">
                          <h4>Tag / ornament details</h4>
                          <div className="intake-row">
                            <div>
                              <label>Engraved name</label>
                              <input name="k_tag_name" placeholder="Pet name for tag/ornament" />
                            </div>
                            <div>
                              <label>Dates</label>
                              <input name="k_tag_dates" placeholder="Birth + crossing dates" />
                            </div>
                          </div>
                          <div className="intake-row">
                            <div>
                              <label>Material</label>
                              <select name="k_tag_material" defaultValue="metal">
                                <option value="metal">Metal</option>
                                <option value="acrylic">Acrylic</option>
                                <option value="wood">Wood</option>
                              </select>
                            </div>
                            <div>
                              <label>Shape</label>
                              <select name="k_tag_shape" defaultValue="round">
                                <option value="round">Round</option>
                                <option value="heart">Heart</option>
                                <option value="bone">Bone</option>
                                <option value="star">Star</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </section>
              ) : null}

              <div className="intake-divider"></div>

              <h2 className="intake-step-title">Professional note</h2>
              <div className="intake-hint">
                Pawollie Sense provides intuitive, symbolic, and reflective insight intended to support emotional understanding and connection.
                Services are not a substitute for veterinary, medical, or behavioral diagnosis.
              </div>

              <label className="intake-checkbox">
                <input type="checkbox" name="consent" required />
                I understand and consent to proceed. <span className="intake-req">*</span>
              </label>

              <div className="intake-divider"></div>

              <h2 className="intake-step-title">3) Save intake &amp; pay</h2>
              <div className="intake-hint">
                Save the intake first. Then complete payment using the PayPal button for the selected service.
              </div>
              <button className="cta wide" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving intake...' : 'Save Intake'}
              </button>
              <div className="intake-fineprint">
                By paying, you confirm the information submitted is accurate to the best of your knowledge.
              </div>
              {intakeReadyForPayment && hostedButtonId ? (
                <div className="intake-field">
                  <h3>Complete Payment</h3>
                  <div className="intake-hint">
                    {savedReadingId ? `Intake saved (ID: ${savedReadingId}).` : 'Intake saved.'} Use the PayPal button below to complete checkout.
                  </div>
                  <div id={hostedContainerId}></div>
                  {paypalHostedError ? (
                    <div className="notice intake-summary-note">
                      {paypalHostedError}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </form>

            <aside className="intake-card intake-summary">
              <h2>Order Summary</h2>
              <div className="sumline"><span>Selected service</span><strong>{summaryService}</strong></div>
              <div className="sumline"><span>Delivery</span><strong>Email</strong></div>
              <div className="sumline"><span>Service total (due now)</span><strong>${total.toFixed(2)}</strong></div>
              <div className="sumline">
                <span>Keepsakes</span>
                <strong>{keepsakes.length ? keepsakes.length : 'None'}</strong>
              </div>
              <div className="sumline">
                <span>Keepsake add-ons</span>
                <strong>{keepsakes.length ? `$${keepsakeTotal.toFixed(2)}` : 'None'}</strong>
              </div>

              <div className="total">
                <span>Estimated total</span>
                <strong>${grandTotal.toFixed(2)}</strong>
              </div>

              {isInstant ? (
                <div className="notice intake-summary-note intake-note-ok">
                  Instant delivery enabled. Your result will be generated after payment confirmation.
                </div>
              ) : null}

              {isCrafted ? (
                <div className="notice intake-summary-note">
                  Crafted service selected. After payment, your intake is queued for creation and delivered by email.
                </div>
              ) : null}

              {keepsakes.length ? (
                <div className="notice intake-summary-note">
                  Keepsakes are fulfilled through Shopify draft orders after admin approval. Final keepsake invoice is sent separately.
                </div>
              ) : null}

              <button className="intake-preview-btn" type="button" onClick={handlePlaceOrder}>
                Place Order
              </button>
            </aside>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Intake;
