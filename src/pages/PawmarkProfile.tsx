import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';
import { getProfile, toYouTubeEmbed, type PawmarkProfile } from '@/lib/pawmarksApi';

const titleClassMap: Record<PawmarkProfile['titleStyle'], string> = {
  serif: 'pawmarks-title--serif',
  script: 'pawmarks-title--script',
  caps: 'pawmarks-title--caps',
  soft: 'pawmarks-title--soft'
};

const formatDate = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const PawmarkProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<PawmarkProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setLoadError('');
        const nextProfile = await getProfile(id);
        setProfile(nextProfile);
      } catch (error: any) {
        setLoadError(error?.message || 'Unable to load this Pawmark.');
      } finally {
        setLoading(false);
      }
    };
    load().catch(() => {});
  }, [id]);

  const posts = useMemo(() => {
    if (!profile) return [];
    return [...profile.posts].sort((a, b) => b.createdAt - a.createdAt);
  }, [profile]);

  if (loading) {
    return (
      <SiteLayout footerLinks={[{ label: 'Pawmarks', to: '/pawmarks' }]}>
        <section className="section">
          <div className="container">
            <div className="card">
              <h2 className="section-title">Loading Pawmark</h2>
              <p className="section-lede">Please wait while this memorial profile loads.</p>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  if (!profile) {
    return (
      <SiteLayout footerLinks={[{ label: 'Pawmarks', to: '/pawmarks' }]}>
        <section className="section">
          <div className="container">
            <div className="card">
              <h2 className="section-title">Pawmark not found</h2>
              <p className="section-lede">
                {loadError || 'We could not locate that memorial profile.'}
              </p>
              <Link className="cta secondary" to="/pawmarks">
                Back to Pawmarks
              </Link>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout
      footerLinks={[
        { label: 'Pawmarks', to: '/pawmarks' },
        { label: 'Keepsakes', to: '/keepsakes' },
        { label: 'Services', to: '/services' }
      ]}
    >
      <section className="hero pawmarks-profile-hero">
        <div className="container pawmarks-profile-grid">
          <div className="pawmarks-profile-card">
            <div className="pill">Forever Pawmarks</div>
            <h1 className={`pawmarks-title ${titleClassMap[profile.titleStyle]}`}>{profile.petName}</h1>
            <p className="pawmarks-owner">Loved by {profile.ownerName}</p>
            {profile.tagline ? <p className="pawmarks-tagline">{profile.tagline}</p> : null}
            <div className="pawmarks-profile-meta">
              {profile.dates ? <span>{profile.dates}</span> : null}
              {profile.species ? <span>{profile.species}</span> : null}
            </div>
            <div className="hero-actions">
              <Link className="cta secondary" to="/pawmarks">
                Back to Pawmarks
              </Link>
            </div>
          </div>
          <div className="pawmarks-profile-media">
            <img src={profile.heroImage} alt={`${profile.petName} memorial portrait`} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="pawmarks-posts-card">
            {profile.bio ? <p className="pawmarks-bio">{profile.bio}</p> : null}
            {posts.length ? (
              <div className="pawmarks-posts">
                {posts.map((post) => {
                  const embed = post.youtubeUrl ? toYouTubeEmbed(post.youtubeUrl) : null;
                  return (
                    <article key={post.id} className="pawmarks-post">
                      <div className="pawmarks-post-header">
                        <h3>{post.title || 'Memory'}</h3>
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                      {post.body ? <p>{post.body}</p> : null}
                      {post.images?.length ? (
                        <div className="pawmarks-post-gallery">
                          {post.images.map((img) => (
                            <img key={img} src={img} alt={`${profile.petName} memory`} />
                          ))}
                        </div>
                      ) : null}
                      {embed ? (
                        <div className="pawmarks-post-video">
                          <iframe
                            src={embed}
                            title={`Tribute video for ${profile.petName}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="pawmarks-empty">
                <p>No posts yet. This Pawmark is ready for its first tribute.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default PawmarkProfile;
