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
    cta: 'Order memorial print'
  },
  {
    key: 'chart_certificate',
    title: 'Star chart certificate',
    desc: 'Your pet\'s birth/star reading turned into a printable certificate (digital + optional print).',
    cta: 'Request chart certificate'
  },
  {
    key: 'apparel',
    title: 'Pawollie constellation tee/hoodie',
    desc: 'Name + constellation map or Pawollie Vision portrait printed on apparel.',
    cta: 'Design apparel'
  },
  {
    key: 'tag_ornament',
    title: 'Keepsake tag / ornament',
    desc: 'Keychain tag or ornament memorializing pets who have crossed over, with name + dates.',
    cta: 'Create tag or ornament'
  },
  {
    key: 'storybook_pdf',
    title: 'Storybook keepsake (digital PDF)',
    desc: 'A personalized, page-ready story built from your submission; print upgrade available.',
    cta: 'Start storybook'
  },
  {
    key: 'printed_book',
    title: 'Printed book add-on',
    desc: 'Once your PDF is locked, we print and ship it; future upgrade to animation available.',
    cta: 'Add printed book'
  }
];
const Intake: React.FC = () => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const location = useLocation();
  const [selectedService, setSelectedService] = useState<string>('');
  const [quickTone, setQuickTone] = useState('calm');
  const [furmilyCount, setFurmilyCount] = useState(2);
  const [keepsakes, setKeepsakes] = useState<string[]>([]);
  const [quickQuestStatus, setQuickQuestStatus] = useState<{
    state: 'idle' | 'submitting' | 'success' | 'error';
    message?: string;
  }>({ state: 'idle' });

  const selectedServiceMeta = useMemo(
    () => SERVICES.find((service) => service.key === selectedService) ?? null,
    [selectedService]
  );

  const total = useMemo(() => selectedServiceMeta?.price ?? 0, [selectedServiceMeta]);

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
  const wantsPrintedBook = keepsakes.includes('printed_book');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const service = params.get('service');
    if (!service) return;
    if (SERVICES.some((item) => item.key === service)) {
      setSelectedService(service);
    }
  }, [location.search]);

  const toggleKeepsake = (key: string) => {
    setKeepsakes((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]));
  };

  const handlePreview = () => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const payload: Record<string, string | string[]> = {};
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
    console.log('Pawollie intake preview', payload);
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
    payload.wagbook_selected = keepsakes.includes('printed_book');
    payload.estimated_total = String(total);

    return payload;
  };

  const mirrorIntakeToSupabase = (form: HTMLFormElement) => {
    try {
      const payload = buildIntakePayload(form);
      fetch('/api/intake-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true
      });
    } catch (error) {
      console.warn('Supabase mirror failed', error);
    }
  };

  const handleIntakeSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (selectedService === 'quick_quest') {
      handleQuickQuestSubmit(event);
      return;
    }

    const form = event.currentTarget;
    if (form) {
      mirrorIntakeToSupabase(form);
    }
  };

  const handleQuickQuestSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (selectedService !== 'quick_quest') return;
    event.preventDefault();

    const form = event.currentTarget;
    const data = new FormData(form);

    if (!data.get('consent')) {
      setQuickQuestStatus({ state: 'error', message: 'Please confirm consent before submitting.' });
      return;
    }

    const payload = {
      service: 'quick_quest',
      guardian_name: String(data.get('guardian_name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      timezone: String(data.get('timezone') || '').trim(),
      relationship: String(data.get('relationship') || '').trim(),
      pet_name: String(data.get('pet_name') || '').trim(),
      species: String(data.get('species') || '').trim(),
      breed: String(data.get('breed') || '').trim(),
      birth_date: String(data.get('birth_date') || '').trim(),
      qq_tone: String(data.get('qq_tone') || '').trim(),
      question: String(data.get('qq_prompt') || '').trim(),
      context: String(data.get('qq_context') || '').trim(),
      estimated_total: String(data.get('estimated_total') || '').trim(),
      consent: true
    };

    if (!payload.guardian_name || !payload.email || !payload.pet_name || !payload.question) {
      setQuickQuestStatus({ state: 'error', message: 'Please complete the required Quick Quest fields.' });
      return;
    }

    try {
      setQuickQuestStatus({ state: 'submitting' });
      const response = await fetch('/api/quick-quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Quick Quest submission failed.');
      }

      setQuickQuestStatus({
        state: 'success',
        message: 'Your Quick Quest is processing now. Watch your email for the response.'
      });
      window.setTimeout(() => {
        window.location.href = '/thank-you';
      }, 1200);
    } catch (error: any) {
      setQuickQuestStatus({
        state: 'error',
        message: error?.message || 'Unable to submit your Quick Quest right now.'
      });
    }
  };

  return (
    <SiteLayout
      footerLinks={[
        { label: 'Services', to: '/services' },
        { label: 'FAQ', to: '/faq' },
        { label: 'Cart', to: '/cart' },
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

              {quickQuestStatus.state === 'error' && (
                <div className="notice intake-summary-note">
                  {quickQuestStatus.message || 'Quick Quest submission failed. Please try again.'}
                </div>
              )}
              {quickQuestStatus.state === 'success' && (
                <div className="notice intake-summary-note intake-note-ok">
                  {quickQuestStatus.message}
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

              <div className="intake-field">
                <label>Upload photos (optional but recommended)</label>
                <input id="photos" type="file" name="photos" multiple accept="image/*" />
                <div className="intake-hint">Photos are automatically named and organized during submission.</div>
              </div>

              {isQuick ? (
                <section className="intake-module">
                  <h2>{selectedServiceMeta?.name ?? 'Quick Quest'} ({selectedServiceMeta?.priceLabel ?? '$9'})</h2>
                  <p className="intake-hint">Instant delivery after PayPal confirms payment.</p>
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
                    </div>
                  ) : null}

                  {selectedService === 'paw_reading' ? (
                    <div className="intake-field">
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
                        <button
                          type="button"
                          className="intake-keepsake-btn"
                          onClick={() => toggleKeepsake(item.key)}
                        >
                          {keepsakes.includes(item.key) ? 'Selected' : item.cta}
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
                          <input name="k_ship_name" placeholder="Name for the package" />
                        </div>
                        <div>
                          <label>Ship-to country</label>
                          <input name="k_ship_country" placeholder="US, Canada, etc." />
                        </div>
                      </div>
                      <div className="intake-field">
                        <label>Notes for the keepsake(s)</label>
                        <textarea name="k_notes" placeholder="Exact names, dates, preferred quote, layout requests, etc."></textarea>
                      </div>
                      {wantsPrintedBook ? (
                        <div className="intake-field">
                          <h4>Wag Book details (required for printed book)</h4>
                          <div className="intake-row">
                            <div>
                              <label>Character names</label>
                              <input name="wagbook_character_names" required placeholder="Pet + family names to include" />
                            </div>
                            <div>
                              <label>Cover photo URL</label>
                              <input name="wagbook_cover_image" required placeholder="Link to the cover photo" />
                            </div>
                          </div>
                          <div className="intake-field">
                            <label>General story idea</label>
                            <textarea
                              name="wagbook_storyline"
                              required
                              placeholder="Short plot, themes, or key moments to highlight"
                            ></textarea>
                          </div>
                          <div className="intake-field">
                            <label>Reference images (comma separated URLs)</label>
                            <textarea
                              name="wagbook_reference_images"
                              placeholder="Links to photos you want used"
                            ></textarea>
                          </div>
                          <div className="intake-field">
                            <label>Upload reference photos (optional)</label>
                            <input type="file" name="wagbook_reference_files" accept="image/*" multiple />
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

              <h2 className="intake-step-title">3) Pay &amp; submit</h2>
              <div className="intake-hint">
                Email-only delivery. Quick Quests ($9) are delivered instantly after PayPal confirms payment.
              </div>

              <div id="paypal-buttons" className="intake-paypal"></div>
              <div className="intake-fineprint">
                By paying, you confirm the information submitted is accurate to the best of your knowledge.
              </div>
            </form>

            <aside className="intake-card intake-summary">
              <h2>Order Summary</h2>
              <div className="sumline"><span>Selected service</span><strong>{summaryService}</strong></div>
              <div className="sumline"><span>Delivery</span><strong>Email</strong></div>

              <div className="total">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>

              {isInstant ? (
                <div className="notice intake-summary-note intake-note-ok">
                  Instant delivery enabled. Your result will be generated and emailed automatically after PayPal confirms.
                </div>
              ) : null}

              {isCrafted ? (
                <div className="notice intake-summary-note">
                  Crafted service selected. After payment, your intake is queued for creation and delivered by email.
                </div>
              ) : null}

              {keepsakes.length ? (
                <div className="notice intake-summary-note">
                  Keepsake add-ons selected. Final at-cost total may vary by size + shipping; you can confirm costs in your fulfillment step.
                </div>
              ) : null}

              <button className="intake-preview-btn" type="button" onClick={handlePreview}>
                Preview Submission (dev)
              </button>
              <div className="intake-fineprint">Logs the structured payload in Console for backend testing.</div>
            </aside>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default Intake;
