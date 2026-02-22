import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';
import { listProfiles, type PawmarkProfile } from '@/lib/pawmarksApi';

const PAGE_SIZE = 9;
const ROTATE_MS = 8000;

const titleClassMap: Record<PawmarkProfile['titleStyle'], string> = {
  serif: 'pawmarks-title--serif',
  script: 'pawmarks-title--script',
  caps: 'pawmarks-title--caps',
  soft: 'pawmarks-title--soft'
};

const shuffleProfiles = (items: PawmarkProfile[]) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const Pawmarks: React.FC = () => {
  const [profiles, setProfiles] = useState<PawmarkProfile[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const nextProfiles = await listProfiles();
        setProfiles(shuffleProfiles(nextProfiles));
      } catch (error: any) {
        setLoadError(error?.message || 'Unable to load Pawmarks.');
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => {});
  }, []);

  const totalProfiles = profiles.length;
  const pageCount = Math.ceil(totalProfiles / PAGE_SIZE);

  useEffect(() => {
    setPageIndex(0);
  }, [totalProfiles]);

  useEffect(() => {
    if (pageCount <= 1) return;
    const intervalId = window.setInterval(() => {
      setPageIndex((current) => (current + 1) % pageCount);
    }, ROTATE_MS);
    return () => window.clearInterval(intervalId);
  }, [pageCount]);

  const visibleProfiles = useMemo(() => {
    if (!totalProfiles) return [];
    const count = Math.min(PAGE_SIZE, totalProfiles);
    const startIndex = (pageIndex * PAGE_SIZE) % totalProfiles;
    return Array.from({ length: count }, (_, index) => profiles[(startIndex + index) % totalProfiles]);
  }, [pageIndex, profiles, totalProfiles]);

  const gridProfiles = useMemo(() => {
    const slots = Array.from({ length: PAGE_SIZE }, (_, index) => visibleProfiles[index] ?? null);
    return slots;
  }, [visibleProfiles]);

  return (
    <SiteLayout
      footerLinks={[
        { label: 'Services', to: '/services' },
        { label: 'Keepsakes', to: '/keepsakes' },
        { label: 'Memorial', to: '/memorial' }
      ]}
    >
      <section className="hero pawmarks-hero">
        <div className="container hero-grid pawmarks-hero-grid pawmarks-shell">
          <div className="hero-card">
            <div className="pill">Forever Pawmarks | Memorial Profiles</div>
            <h1 className="hero-title">Pawmarks</h1>
            <p className="section-lede">
              A living library of love. Each Pawmark preserves a story, a face, and a bond.
            </p>
            <div className="hero-actions">
              <Link className="cta" to="/intake?service=pawmark_post">
                Request a Pawmark - $15
              </Link>
            </div>
          </div>
          <div className="stack pawmarks-hero-aside">
            <img className="hero-logo" src="/assets/branding/oliver_globe_transparent.png" alt="Pawollie Sense globe illustration" />
          </div>
        </div>
      </section>

      <section className="section pawmarks-section">
        <div className="container pawmarks-shell">
          {loading ? (
            <div className="card">
              <h2 className="section-title">Loading Pawmarks</h2>
              <p className="section-lede">Please wait while memorial profiles load.</p>
            </div>
          ) : loadError ? (
            <div className="card">
              <h2 className="section-title">Unable to load Pawmarks</h2>
              <p className="section-lede">{loadError}</p>
            </div>
          ) : profiles.length ? (
            <div className="pawmarks-menu-grid">
              {gridProfiles.map((profile, index) =>
                profile ? (
                  <Link key={profile.id} className="pawmarks-menu-card" to={`/pawmarks/${profile.id}`}>
                    <div className="pawmarks-menu-media">
                      <img src={profile.heroImage} alt={`${profile.petName} memorial portrait`} />
                    </div>
                    <div className="pawmarks-menu-meta">
                      <h3 className={`pawmarks-title ${titleClassMap[profile.titleStyle]}`}>
                        {profile.petName}
                      </h3>
                      {profile.tagline ? (
                        <p className="pawmarks-tagline">"{profile.tagline}"</p>
                      ) : null}
                    </div>
                  </Link>
                ) : (
                  <div key={`placeholder-${index}`} className="pawmarks-menu-card pawmarks-menu-card--placeholder">
                    <div className="pawmarks-menu-media" aria-hidden="true"></div>
                    <div className="pawmarks-menu-meta">
                      <p className="pawmarks-placeholder-title">Pawmark coming soon</p>
                      <p className="pawmarks-tagline">A new tribute will appear here.</p>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="card">
              <h2 className="section-title">No Pawmarks yet</h2>
              <p className="section-lede">Start the first memorial profile to begin the collection.</p>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
};

export default Pawmarks;
