import React, { useMemo, useState } from 'react';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminSession } from '@/hooks/useAdminSession';

type ServiceType = 'instant' | 'crafted';

const SERVICES: { key: string; label: string; price: number; type: ServiceType }[] = [
  { key: 'express_pawdate', label: 'Express Pawdate', price: 9, type: 'instant' },
  { key: 'quick_quest', label: 'Quick Quest (One Question Insight)', price: 9, type: 'instant' },
  { key: 'bond_spark', label: 'Bond Spark (Mini Insight)', price: 9, type: 'instant' },
  { key: 'full_spirit_pawfile', label: 'Full Spirit Pawfile', price: 35, type: 'crafted' },
  { key: 'behavior_bond_guidance', label: 'Behavior Bond Guidance', price: 40, type: 'crafted' },
  { key: 'star_chart', label: 'Star Chart (Pet Astrology Insight)', price: 19, type: 'crafted' },
  { key: 'paw_reading', label: 'Paw Reading (Pawprint Insight)', price: 19, type: 'crafted' },
  { key: 'pawollie_vision', label: 'Pawollie Vision (Spirit Portrait)', price: 19, type: 'crafted' }
];

const AdminTestServices: React.FC = () => {
  const { status, error, busy, login, logout } = useAdminSession();
  const [guardianName, setGuardianName] = useState('Test Guardian');
  const [email, setEmail] = useState('test@example.com');
  const [petName, setPetName] = useState('Test Pup');
  const [species, setSpecies] = useState('Dog');
  const [breed, setBreed] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [relationship, setRelationship] = useState('Guardian / Owner');
  const [timezone, setTimezone] = useState('America/Chicago');
  const [pfTraits, setPfTraits] = useState('');
  const [pfBond, setPfBond] = useState('');
  const [bgStory, setBgStory] = useState('');
  const [ddNotes, setDdNotes] = useState('');
  const [pmStatus, setPmStatus] = useState('Living');
  const [pmHonor, setPmHonor] = useState('');
  const [pmMessage, setPmMessage] = useState('');
  const [scLocation, setScLocation] = useState('');
  const [scTime, setScTime] = useState('');
  const [pawSource, setPawSource] = useState('Photo of paw / pawprint');
  const [visionStyle, setVisionStyle] = useState('Soft celestial (default)');
  const [packGoal, setPackGoal] = useState('');
  const [allPawsNotes, setAllPawsNotes] = useState('');
  const [tone, setTone] = useState('calm');
  const [prompt, setPrompt] = useState('What does my pet need most today?');
  const [context, setContext] = useState('Testing quick quest flow.');
  const [runEmails, setRunEmails] = useState(true);
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<
    { service: string; readingId?: string; status: 'ok' | 'error'; message: string }[]
  >([]);

  const instantKeys = useMemo(() => new Set(SERVICES.filter((s) => s.type === 'instant').map((s) => s.key)), []);

  const basePayload = () => ({
      guardian_name: guardianName.trim() || 'Test Guardian',
      email: email.trim() || 'test@example.com',
      pet_name: petName.trim() || 'Test Pup',
      species,
      breed,
      birth_date: birthDate || undefined,
      relationship,
      timezone,
      pf_traits: pfTraits,
      pf_bond: pfBond,
      bg_story: bgStory,
      dd_notes: ddNotes,
      pm_status: pmStatus,
      pm_honor: pmHonor,
      pm_message: pmMessage,
      sc_location: scLocation,
      sc_time: scTime,
      paw_source: pawSource,
      vision_style: visionStyle,
      pack_goal: packGoal,
      allpaws_notes: allPawsNotes,
      consent: true,
      qq_tone: tone,
      qq_prompt: prompt,
      qq_context: context
    });

  const submitIntake = async (serviceKey: string, price: number) => {
    const payload = {
      ...basePayload(),
      services: [serviceKey],
      selected_service: serviceKey,
      service_choice: serviceKey,
      estimated_total: String(price)
    };

    const response = await fetch('/api/intake-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || 'Intake submission failed.');
    }
    return result?.readingId as string | undefined;
  };

  const fulfillQuickQuest = async (readingId: string, serviceKey: string) => {
    const response = await fetch('/api/admin/quick-quest-fulfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        readingId,
        service: serviceKey,
        question: prompt
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
      throw new Error(result?.error || 'Quick quest fulfillment failed.');
    }
    return result;
  };

  const runTest = async (serviceKey: string, price: number) => {
    setRunning((prev) => ({ ...prev, [serviceKey]: true }));
    try {
      const readingId = await submitIntake(serviceKey, price);
      if (!readingId) throw new Error('No reading ID returned.');
      if (runEmails && instantKeys.has(serviceKey)) {
        await fulfillQuickQuest(readingId, serviceKey);
      }
      setResults((prev) => [
        { service: serviceKey, readingId, status: 'ok', message: 'Submitted successfully.' },
        ...prev
      ]);
    } catch (err: any) {
      setResults((prev) => [
        { service: serviceKey, status: 'error', message: err?.message || 'Test failed.' },
        ...prev
      ]);
    } finally {
      setRunning((prev) => ({ ...prev, [serviceKey]: false }));
    }
  };

  const runAll = async () => {
    for (const service of SERVICES) {
      // eslint-disable-next-line no-await-in-loop
      await runTest(service.key, service.price);
    }
  };

  if (status !== 'authed') {
    return (
      <AdminLoginCard
        title="Admin Test Harness"
        description="Sign in to run test service submissions without payment."
        error={error}
        busy={busy}
        onLogin={login}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <header className="bg-[#2D3561] text-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">Service Test Harness</h1>
            <p className="font-body text-white/70 text-sm">
              Submit test intakes without payment. Quick quests can auto-complete + email.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="px-4 py-2 border border-white/30 text-white font-display font-semibold rounded-full hover:bg-white/10 transition-colors"
            >
              Back to Admin
            </a>
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 bg-white text-[#2D3561] font-display font-semibold rounded-full hover:bg-white/90 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-display text-xl font-semibold text-[#2D3561] mb-4">Intake Form (Test Data)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="font-body text-sm text-[#3A3A3A]">
              Guardian name
              <input
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={guardianName}
                onChange={(event) => setGuardianName(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Email for confirmations
              <input
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Pet name
              <input
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={petName}
                onChange={(event) => setPetName(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Species
              <select
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={species}
                onChange={(event) => setSpecies(event.target.value)}
              >
                <option>Dog</option>
                <option>Cat</option>
                <option>Other</option>
              </select>
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Breed / mix
              <input
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={breed}
                onChange={(event) => setBreed(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Birth date
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Relationship
              <select
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={relationship}
                onChange={(event) => setRelationship(event.target.value)}
              >
                <option>Guardian / Owner</option>
                <option>Co-guardian</option>
                <option>Family member</option>
                <option>Foster</option>
                <option>Other</option>
              </select>
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Time zone
              <select
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
              >
                <option value="America/Chicago">America/Chicago</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Denver">America/Denver</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="UTC">UTC</option>
              </select>
            </label>
            <label className="font-body text-sm text-[#3A3A3A] md:col-span-2">
              Personality traits (Full Spirit Pawfile)
              <textarea
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm min-h-[80px]"
                value={pfTraits}
                onChange={(event) => setPfTraits(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A] md:col-span-2">
              Bond description (Full Spirit Pawfile)
              <textarea
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm min-h-[80px]"
                value={pfBond}
                onChange={(event) => setPfBond(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A] md:col-span-2">
              Behavior story (Behavior Bond Guidance)
              <textarea
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm min-h-[80px]"
                value={bgStory}
                onChange={(event) => setBgStory(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A] md:col-span-2">
              Deep notes (Star Chart / Paw Reading / Vision)
              <textarea
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm min-h-[80px]"
                value={ddNotes}
                onChange={(event) => setDdNotes(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Memorial status
              <select
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={pmStatus}
                onChange={(event) => setPmStatus(event.target.value)}
              >
                <option>Living</option>
                <option>Passed</option>
                <option>Transitioning / elder stage</option>
              </select>
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Star chart location
              <input
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={scLocation}
                onChange={(event) => setScLocation(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Star chart time
              <input
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={scTime}
                onChange={(event) => setScTime(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Paw reading source
              <select
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={pawSource}
                onChange={(event) => setPawSource(event.target.value)}
              >
                <option>Photo of paw / pawprint</option>
                <option>Ink pawprint (memorial)</option>
                <option>I will upload what I have</option>
              </select>
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Vision style
              <select
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={visionStyle}
                onChange={(event) => setVisionStyle(event.target.value)}
              >
                <option>Soft celestial (default)</option>
                <option>Tranquil starlight</option>
                <option>Constellation outline</option>
                <option>Memorial glow</option>
              </select>
            </label>
            <label className="font-body text-sm text-[#3A3A3A] md:col-span-2">
              Memorial honor text
              <textarea
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm min-h-[80px]"
                value={pmHonor}
                onChange={(event) => setPmHonor(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A] md:col-span-2">
              Memorial message
              <textarea
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm min-h-[80px]"
                value={pmMessage}
                onChange={(event) => setPmMessage(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A] md:col-span-2">
              Pack goal
              <input
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={packGoal}
                onChange={(event) => setPackGoal(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A] md:col-span-2">
              All-Paws notes
              <textarea
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm min-h-[80px]"
                value={allPawsNotes}
                onChange={(event) => setAllPawsNotes(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A]">
              Quick quest tone
              <input
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={tone}
                onChange={(event) => setTone(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A] md:col-span-2">
              Quick quest prompt
              <input
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </label>
            <label className="font-body text-sm text-[#3A3A3A] md:col-span-2">
              Quick quest context
              <input
                className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 text-sm"
                value={context}
                onChange={(event) => setContext(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-body text-[#3A3A3A]">
              <input
                type="checkbox"
                checked={runEmails}
                onChange={(event) => setRunEmails(event.target.checked)}
              />
              Auto-complete quick quests + send email
            </label>
            <button
              type="button"
              onClick={runAll}
              className="px-4 py-2 bg-[#2D3561] text-white rounded-lg font-display text-sm font-semibold hover:bg-[#3D4A7A]"
            >
              Run all tests
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICES.map((service) => (
            <div key={service.key} className="bg-white rounded-2xl shadow-lg p-5 flex flex-col gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#2D3561]">{service.label}</h3>
                <p className="text-sm text-[#3A3A3A]/70 font-body">${service.price} • {service.type}</p>
              </div>
              <button
                type="button"
                onClick={() => runTest(service.key, service.price)}
                disabled={Boolean(running[service.key])}
                className="px-4 py-2 bg-[#D4AF37] text-[#2D3561] rounded-lg font-display text-sm font-semibold hover:bg-[#E5C158] disabled:opacity-70"
              >
                {running[service.key] ? 'Running...' : 'Run test'}
              </button>
            </div>
          ))}
        </section>

        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="font-display text-xl font-semibold text-[#2D3561] mb-3">Results</h2>
          {results.length === 0 ? (
            <p className="text-sm text-[#3A3A3A]/70 font-body">No tests run yet.</p>
          ) : (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={`${result.service}-${index}`} className="border border-[#9DB5A5]/20 rounded-xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-body text-sm">
                      <strong>{result.service}</strong>
                      {result.readingId ? ` • Reading ID: ${result.readingId}` : ''}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        result.status === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {result.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#3A3A3A]/70 mt-2">{result.message}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminTestServices;
