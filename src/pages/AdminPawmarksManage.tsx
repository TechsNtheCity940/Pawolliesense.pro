import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import AdminMediaPickerModal from '@/components/admin/AdminMediaPickerModal';
import { useAdminSession } from '@/hooks/useAdminSession';
import {
  type PawmarkProfile,
  type TitleStyle,
  listProfiles,
  saveProfile
} from '@/lib/pawmarksApi';

const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const normalizeImages = (value: string) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const AdminPawmarksManage: React.FC = () => {
  const { status, error, busy, login } = useAdminSession();
  const [profiles, setProfiles] = useState<PawmarkProfile[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<PawmarkProfile | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const sortedProfiles = useMemo(
    () => [...profiles].sort((a, b) => a.petName.localeCompare(b.petName)),
    [profiles]
  );

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const all = await listProfiles();
      setProfiles(all);
      if (!all.length) {
        setSelectedId('');
        setDraft(null);
        return;
      }

      const keep = selectedId && all.some((profile) => profile.id === selectedId) ? selectedId : all[0].id;
      const selected = all.find((profile) => profile.id === keep) || all[0];
      setSelectedId(selected.id);
      setDraft(JSON.parse(JSON.stringify(selected)));
    } catch (loadError: any) {
      setStatusNote(loadError?.message || 'Unable to load Pawmarks.');
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    loadProfiles().catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const selected = profiles.find((profile) => profile.id === selectedId);
    if (!selected) return;
    setDraft(JSON.parse(JSON.stringify(selected)));
  }, [selectedId, profiles]);

  if (status !== 'authed') {
    return (
      <AdminLoginCard
        title="Admin Access"
        description="Sign in to manage Pawmarks profiles."
        error={error}
        busy={busy}
        onLogin={login}
      />
    );
  }

  const updateDraft = (next: Partial<PawmarkProfile>) => {
    setDraft((prev) => (prev ? { ...prev, ...next } : prev));
  };

  const updatePost = (index: number, next: Partial<PawmarkProfile['posts'][number]>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const posts = prev.posts.map((post, postIndex) => (
        postIndex === index ? { ...post, ...next } : post
      ));
      return { ...prev, posts };
    });
  };

  const removePost = (index: number) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const posts = prev.posts.filter((_, postIndex) => postIndex !== index);
      return { ...prev, posts };
    });
  };

  const addPost = () => {
    setDraft((prev) => {
      if (!prev) return prev;
      const nextPost: PawmarkProfile['posts'][number] = {
        id: makeId(),
        createdAt: Date.now(),
        title: '',
        body: '',
        images: [],
        youtubeUrl: ''
      };
      return { ...prev, posts: [nextPost, ...prev.posts] };
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;

    const normalized: PawmarkProfile = {
      ...draft,
      posts: (draft.posts || []).map((post) => ({
        ...post,
        title: post.title?.trim() || undefined,
        body: post.body?.trim() || undefined,
        youtubeUrl: post.youtubeUrl?.trim() || undefined,
        images: Array.isArray(post.images) ? post.images.filter(Boolean) : undefined
      }))
    };

    try {
      setSavingProfile(true);
      await saveProfile(normalized);
      setStatusNote(`Saved changes for ${normalized.petName}.`);
      await loadProfiles();
    } catch (saveError: any) {
      setStatusNote(saveError?.message || 'Unable to save Pawmark changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <SiteLayout footerLinks={[{ label: 'Pawmarks', to: '/pawmarks' }]}>
      <AdminMediaPickerModal
        isOpen={pickerOpen}
        initialHeroUrl={draft?.heroImage || ''}
        initialGalleryUrls={draft?.posts?.[0]?.images || []}
        onClose={() => setPickerOpen(false)}
        onApply={({ heroUrl, galleryUrls }) => {
          setDraft((prev) => {
            if (!prev) return prev;
            const nextPosts = [...(prev.posts || [])];
            if (galleryUrls.length) {
              if (!nextPosts.length) {
                nextPosts.push({
                  id: makeId(),
                  createdAt: Date.now(),
                  title: 'Memories',
                  body: '',
                  images: galleryUrls,
                  youtubeUrl: ''
                });
              } else {
                nextPosts[0] = {
                  ...nextPosts[0],
                  images: galleryUrls
                };
              }
            }
            return {
              ...prev,
              heroImage: heroUrl || prev.heroImage,
              posts: nextPosts
            };
          });
          setPickerOpen(false);
        }}
      />
      <section className="section">
        <div className="container">
          <div className="card pawmarks-admin-card">
            <div className="pawmarks-admin-header">
              <div>
                <div className="pill">Admin only</div>
                <h1 className="section-title">Edit Pawmarks</h1>
                <p className="section-lede">Modify existing memorial profiles and tribute posts.</p>
              </div>
              <div className="hero-actions">
                <Link className="cta secondary" to="/admin">
                  Back to Admin
                </Link>
                <Link className="cta secondary" to="/admin/media">
                  Media Library
                </Link>
                <Link className="cta secondary" to="/admin/pawmarks/new">
                  New Pawmark
                </Link>
              </div>
            </div>

            {loadingProfiles ? (
              <p className="section-lede">Loading Pawmarks...</p>
            ) : !sortedProfiles.length ? (
              <div>
                <p className="section-lede">No Pawmarks found yet.</p>
                <Link className="cta" to="/admin/pawmarks/new">
                  Create first Pawmark
                </Link>
              </div>
            ) : (
              <form className="pawmarks-admin-form" onSubmit={handleSave}>
                <div className="pawmarks-admin-row">
                  <label className="field">
                    <span className="label">Select Pawmark</span>
                    <select
                      value={selectedId}
                      onChange={(event) => {
                        setSelectedId(event.target.value);
                        setStatusNote('');
                      }}
                    >
                      {sortedProfiles.map((profile) => (
                        <option key={profile.id} value={profile.id}>
                          {profile.petName} ({profile.ownerName})
                        </option>
                      ))}
                    </select>
                  </label>
                  {draft ? (
                    <div className="field">
                      <span className="label">Public page</span>
                      <Link className="cta secondary" to={`/pawmarks/${draft.id}`}>
                        View profile
                      </Link>
                    </div>
                  ) : null}
                </div>

                {draft ? (
                  <>
                    <div className="pawmarks-admin-row">
                      <label className="field">
                        <span className="label">Pet name</span>
                        <input
                          value={draft.petName}
                          onChange={(event) => updateDraft({ petName: event.target.value })}
                          required
                        />
                      </label>
                      <label className="field">
                        <span className="label">Guardian name</span>
                        <input
                          value={draft.ownerName}
                          onChange={(event) => updateDraft({ ownerName: event.target.value })}
                          required
                        />
                      </label>
                    </div>

                    <div className="pawmarks-admin-row">
                      <label className="field">
                        <span className="label">Hero image URL</span>
                        <input
                          value={draft.heroImage}
                          onChange={(event) => updateDraft({ heroImage: event.target.value })}
                          required
                        />
                      </label>
                      <div className="field">
                        <span className="label">Media picker</span>
                        <button
                          type="button"
                          className="cta secondary"
                          onClick={() => setPickerOpen(true)}
                        >
                          Select Hero + Gallery
                        </button>
                      </div>
                      <label className="field">
                        <span className="label">Title style</span>
                        <select
                          value={draft.titleStyle}
                          onChange={(event) => updateDraft({ titleStyle: event.target.value as TitleStyle })}
                        >
                          <option value="serif">Serif</option>
                          <option value="script">Script</option>
                          <option value="caps">Caps</option>
                          <option value="soft">Soft</option>
                        </select>
                      </label>
                    </div>

                    <div className="pawmarks-admin-row">
                      <label className="field">
                        <span className="label">Tagline</span>
                        <input
                          value={draft.tagline || ''}
                          onChange={(event) => updateDraft({ tagline: event.target.value })}
                        />
                      </label>
                      <label className="field">
                        <span className="label">Dates</span>
                        <input
                          value={draft.dates || ''}
                          onChange={(event) => updateDraft({ dates: event.target.value })}
                        />
                      </label>
                    </div>

                    <div className="pawmarks-admin-row">
                      <label className="field">
                        <span className="label">Species</span>
                        <input
                          value={draft.species || ''}
                          onChange={(event) => updateDraft({ species: event.target.value })}
                        />
                      </label>
                    </div>

                    <label className="field">
                      <span className="label">Bio</span>
                      <textarea
                        rows={4}
                        value={draft.bio || ''}
                        onChange={(event) => updateDraft({ bio: event.target.value })}
                      ></textarea>
                    </label>

                    <div className="pawmarks-admin-divider"></div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="section-title pawmarks-admin-subtitle">Tribute posts</h2>
                      <button
                        type="button"
                        className="cta secondary"
                        onClick={addPost}
                      >
                        Add Post
                      </button>
                    </div>

                    {draft.posts.length ? (
                      <div className="space-y-4">
                        {draft.posts.map((post, index) => (
                          <div key={post.id} className="border border-[#9DB5A5]/25 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-display text-sm text-[#2D3561] font-semibold">
                                Post {index + 1}
                              </p>
                              <button
                                type="button"
                                className="text-sm font-display text-red-600 hover:text-red-700"
                                onClick={() => removePost(index)}
                              >
                                Remove
                              </button>
                            </div>
                            <div className="pawmarks-admin-row">
                              <label className="field">
                                <span className="label">Title</span>
                                <input
                                  value={post.title || ''}
                                  onChange={(event) => updatePost(index, { title: event.target.value })}
                                />
                              </label>
                              <label className="field">
                                <span className="label">Created At (timestamp)</span>
                                <input
                                  type="number"
                                  value={post.createdAt}
                                  onChange={(event) => updatePost(index, { createdAt: Number(event.target.value) || Date.now() })}
                                />
                              </label>
                            </div>
                            <label className="field">
                              <span className="label">Body</span>
                              <textarea
                                rows={3}
                                value={post.body || ''}
                                onChange={(event) => updatePost(index, { body: event.target.value })}
                              ></textarea>
                            </label>
                            <div className="pawmarks-admin-row">
                              <label className="field">
                                <span className="label">Images (comma separated URLs)</span>
                                <input
                                  value={(post.images || []).join(', ')}
                                  onChange={(event) => updatePost(index, { images: normalizeImages(event.target.value) })}
                                />
                              </label>
                              <label className="field">
                                <span className="label">YouTube URL</span>
                                <input
                                  value={post.youtubeUrl || ''}
                                  onChange={(event) => updatePost(index, { youtubeUrl: event.target.value })}
                                />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="section-lede">No posts yet. Add one if needed.</p>
                    )}

                    {statusNote ? (
                      <p className="font-body text-sm text-[#2D3561]">{statusNote}</p>
                    ) : null}

                    <button className="cta" type="submit" disabled={savingProfile}>
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : null}
              </form>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default AdminPawmarksManage;
