import React from 'react';
import { pawprintUrl } from '@/lib/brand-assets';

interface Tribute {
  id: string;
  petName: string;
  headline: string;
  excerpt: string;
  date?: string;
  tags?: string[];
  featured?: boolean;
  photos?: string[];
  musicTitle?: string;
  musicUrl?: string;
}

const SoulRolesSection: React.FC = () => {
  const tributes: Tribute[] = [
    {
      id: 'oliver',
      petName: 'Oliver Herbert',
      headline: 'My lost love',
      excerpt: 'Oliver is the heart behind Pawollie Sense. Details of his memorial story will be added here so his legacy lives in every reading we share.',
      date: 'Forever',
      tags: ['Inspiration', 'Pawmarks Pack'],
      featured: true,
      photos: [],
      musicTitle: 'Oliver’s Song',
      musicUrl: '',
    },
    {
      id: 'buissie',
      petName: 'Buissie',
      headline: 'Soft paws, steady heart',
      excerpt: '“Buissie curled at the foot of the bed every stormy night. A gentle anchor in the loudest moments.”',
      date: 'May 2024',
      tags: ['Comfort', 'Anchor'],
      photos: [],
    },
    {
      id: 'little-livy',
      petName: 'Little Livy',
      headline: 'Light feet, bright soul',
      excerpt: '“Livy chased sunbeams and taught us to look for tiny joys. Her spark is still in every corner.”',
      date: 'March 2024',
      tags: ['Joy', 'Play'],
      photos: [],
      musicTitle: 'Livy’s Lullaby',
      musicUrl: '',
    },
    {
      id: 'pumba',
      petName: 'Pumba',
      headline: 'Guardian of the garden',
      excerpt: '“He watched the tomatoes like treasure. Pumba’s care made our home feel safe and growing.”',
      date: 'January 2024',
      tags: ['Guardian', 'Family'],
      photos: [],
    },
    {
      id: 'toot',
      petName: 'Toot',
      headline: 'Tiny trumpet of joy',
      excerpt: '“Toot’s wiggles were the morning alarm. The house still hums with that happy rhythm.”',
      date: 'December 2023',
      tags: ['Joy', 'Morning light'],
      photos: [],
      musicTitle: 'Toot’s Tune',
      musicUrl: '',
    },
    {
      id: 'thomaas',
      petName: 'Thomaas',
      headline: 'Old soul with kind eyes',
      excerpt: '“Thomaas sat beside us during every hard conversation. A silent counselor with endless patience.”',
      date: 'October 2023',
      tags: ['Wise', 'Healer'],
      photos: [],
    },
    {
      id: 'luna',
      petName: 'Luna',
      headline: 'Gentle moonlight in our home',
      excerpt: '“She waited by the door every night, reminding us to rest. Her softness taught us how to slow down.”',
      date: 'June 2024',
      tags: ['Comfort', 'Family'],
      photos: [],
    },
    {
      id: 'marley',
      petName: 'Marley',
      headline: 'The watcher on the porch',
      excerpt: '“He never missed a sunrise. Marley’s gaze told us the day would always be okay.”',
      date: 'April 2024',
      tags: ['Guardian', 'Loyalty'],
      photos: [],
    },
    {
      id: 'coco',
      petName: 'Coco',
      headline: 'Tiny paws, endless warmth',
      excerpt: '“Her little footsteps echoed like a heartbeat through the house. She held our family together.”',
      date: 'February 2024',
      tags: ['Healer', 'Joy'],
      photos: [],
    },
  ];

  const quotes = [
    '“What we have once enjoyed we can never lose; all that we love deeply becomes a part of us.” — Helen Keller',
    '“Until one has loved an animal, a part of one’s soul remains unawakened.” — Anatole France',
    '“Grief is the price we pay for love.” — Queen Elizabeth II',
  ];

  return (
    <section
      id="furever-loved"
      className="py-24 bg-gradient-to-b from-[#2D3561] via-[#1E2440] to-[#0f1328] relative overflow-hidden"
    >
      <div className="absolute inset-0 stars-bg opacity-20" />
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full opacity-10" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          <path d="M50,150 L200,220 L380,140 L520,240 L700,180 L880,260" stroke="#D4AF37" strokeWidth="0.5" fill="none" />
          <path d="M120,640 L260,520 L430,610 L620,520 L820,640" stroke="#9DB5A5" strokeWidth="0.5" fill="none" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 border border-white/15 text-white font-display text-sm">
            <img src={pawprintUrl} alt="" className="w-5 h-5 brightness-0 invert" />
            Furever Loved Community Feed
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-4 mb-4">
            Honoring every pawprint that stays on our hearts
          </h2>
          <p className="font-body text-white/75 max-w-2xl mx-auto">
            A back-end curated memorial feed for Pawmarks Pack families. Each tribute is handled with care and reverence so
            your companion’s story is held in light.
          </p>
          <p className="mt-3 font-body text-white/60 text-sm">
            Submissions are added by the Pawollie Sense team to keep this space safe, gentle, and intentional.
          </p>
        </div>

        {/* Quotes */}
        <div className="grid gap-4 md:grid-cols-3 mb-10">
          {quotes.map((quote, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-white/80 font-body text-sm leading-relaxed"
            >
              {quote}
            </div>
          ))}
        </div>

        {/* Featured Tribute */}
        {tributes
          .filter((t) => t.featured)
          .map((tribute) => (
            <div
              key={tribute.id}
              className="mb-10 rounded-3xl border border-white/15 bg-white/10 backdrop-blur shadow-2xl p-6 md:p-8 relative overflow-hidden"
            >
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl" />
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-display text-sm text-white/60 uppercase tracking-[0.2em]">Featured Tribute</p>
                  <h3 className="font-display text-3xl font-bold text-white mt-2">{tribute.petName}</h3>
                  <p className="font-body text-white/70">{tribute.headline}</p>
                </div>
                <span className="px-4 py-2 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] font-display text-sm border border-[#D4AF37]/30">
                  Pawmarks Pack
                </span>
              </div>
              <p className="font-body text-white/85 mt-6 leading-relaxed">{tribute.excerpt}</p>
              <div className="mt-4 flex items-center gap-3 text-white/60 font-body text-sm">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <img src={pawprintUrl} alt="" className="w-4 h-4 brightness-0 invert" />
                  Furever Loved
                </span>
                {tribute.tags?.map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-6 grid sm:grid-cols-3 gap-3">
                {(tribute.photos && tribute.photos.length > 0 ? tribute.photos : [pawprintUrl, pawprintUrl, pawprintUrl]).map(
                  (photo, idx) => (
                    <div key={idx} className="aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-white/5">
                      <img src={photo} alt={`${tribute.petName} tribute ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  )
                )}
              </div>
              <div className="mt-4">
                <p className="font-display text-sm text-white/70 mb-2">Memory music</p>
                {tribute.musicUrl ? (
                  <audio controls className="w-full">
                    <source src={tribute.musicUrl} />
                    Your browser does not support the audio element.
                  </audio>
                ) : (
                  <button className="px-4 py-2 rounded-full border border-white/20 text-white/75 font-display text-sm bg-white/5">
                    Add a song (team uploaded)
                  </button>
                )}
                {tribute.musicTitle && (
                  <p className="font-body text-white/60 text-xs mt-1">{tribute.musicTitle}</p>
                )}
              </div>
            </div>
          ))}

        {/* Feed Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {tributes
            .filter((t) => !t.featured)
            .map((tribute) => (
              <div
                key={tribute.id}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 hover:border-[#D4AF37]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xl font-bold text-white">{tribute.petName}</h4>
                  {tribute.date && <span className="text-white/50 text-sm font-body">{tribute.date}</span>}
                </div>
                <p className="font-display text-sm text-[#D4AF37] mt-1">{tribute.headline}</p>
              <p className="font-body text-white/75 mt-3 leading-relaxed">{tribute.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(tribute.tags || []).map((tag) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/65 text-xs font-display">
                    {tag}
                  </span>
                ))}
              </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {(tribute.photos && tribute.photos.length > 0 ? tribute.photos : [pawprintUrl, pawprintUrl, pawprintUrl]).map(
                    (photo, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-white/10 bg-white/5">
                        <img src={photo} alt={`${tribute.petName} memory ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    )
                  )}
                </div>
                <div className="mt-3">
                  <p className="font-display text-xs text-white/70 mb-1">Memory music</p>
                  {tribute.musicUrl ? (
                    <audio controls className="w-full">
                      <source src={tribute.musicUrl} />
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <button className="px-3 py-2 rounded-full border border-white/15 text-white/70 font-display text-xs bg-white/5 w-full text-center">
                      Add a song (team uploaded)
                    </button>
                  )}
                  {tribute.musicTitle && (
                    <p className="font-body text-white/60 text-[11px] mt-1">{tribute.musicTitle}</p>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* Submission / Curation Note */}
        <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="font-display text-lg text-white">How to be added</p>
            <p className="font-body text-white/70 text-sm mt-1">
              Furever Loved is curated by Pawollie Sense. Pawmarks Pack clients can request additions or updates through the team;
              all tributes are added from the back-end to protect privacy and ensure care. Each post supports multiple photos so your companion’s story can be told in full.
            </p>
          </div>
          <a
            href="mailto:hello@pawolliesense.com?subject=Add%20my%20tribute%20to%20Furever%20Loved"
            className="px-5 py-3 rounded-full bg-[#D4AF37] text-[#2D3561] font-display font-semibold shadow-lg hover:bg-[#E5C158] transition-colors text-center"
          >
            Request an Update
          </a>
        </div>
      </div>
    </section>
  );
};

export default SoulRolesSection;
