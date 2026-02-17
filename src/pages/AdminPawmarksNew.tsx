import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';
import { addProfile, type PawmarkProfile, type TitleStyle } from '@/lib/pawmarksApi';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import AdminMediaPickerModal from '@/components/admin/AdminMediaPickerModal';
import { useAdminSession } from '@/hooks/useAdminSession';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

const makeId = (petName: string) => {
  const base = slugify(petName) || 'pawmark';
  return `${base}-${Date.now().toString(36).slice(-4)}`;
};

const makePostId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const AdminPawmarksNew: React.FC = () => {
  const { status, error, busy, login } = useAdminSession();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = React.useState(false);
  const [statusNote, setStatusNote] = React.useState('');
  const [heroImageInput, setHeroImageInput] = React.useState('');
  const [postImagesInput, setPostImagesInput] = React.useState('');
  const [pickerOpen, setPickerOpen] = React.useState(false);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const petName = String(data.get('pet_name') || '').trim();
    const ownerName = String(data.get('owner_name') || '').trim();
    const heroImage = heroImageInput || String(data.get('hero_image') || '').trim();

    if (!petName || !ownerName || !heroImage) return;

    const titleStyle = (data.get('title_style') as TitleStyle) || 'serif';
    const idInput = String(data.get('profile_id') || '').trim();
    const tagline = String(data.get('tagline') || '').trim();
    const dates = String(data.get('dates') || '').trim();
    const species = String(data.get('species') || '').trim();
    const bio = String(data.get('bio') || '').trim();

    const postTitle = String(data.get('post_title') || '').trim();
    const postBody = String(data.get('post_body') || '').trim();
    const postImages = (postImagesInput || String(data.get('post_images') || ''))
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const youtubeUrl = String(data.get('post_youtube') || '').trim();

    const posts: PawmarkProfile['posts'] = [];
    if (postTitle || postBody || postImages.length || youtubeUrl) {
      posts.push({
        id: makePostId(),
        createdAt: Date.now(),
        title: postTitle || undefined,
        body: postBody || undefined,
        images: postImages.length ? postImages : undefined,
        youtubeUrl: youtubeUrl || undefined
      });
    }

    try {
      setIsSaving(true);
      setStatusNote('');
      const profile = await addProfile({
        id: idInput || makeId(petName),
        petName,
        ownerName,
        titleStyle,
        heroImage,
        tagline: tagline || undefined,
        dates: dates || undefined,
        species: species || undefined,
        bio: bio || undefined,
        posts
      });
      if (!profile?.id) {
        throw new Error('Profile was not saved.');
      }
      form.reset();
      setHeroImageInput('');
      setPostImagesInput('');
      navigate(`/pawmarks/${profile.id}`);
    } catch (submitError: any) {
      setStatusNote(submitError?.message || 'Unable to save Pawmark.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SiteLayout footerLinks={[{ label: 'Pawmarks', to: '/pawmarks' }]}>
      <AdminMediaPickerModal
        isOpen={pickerOpen}
        initialHeroUrl={heroImageInput}
        initialGalleryUrls={postImagesInput.split(',').map((item) => item.trim()).filter(Boolean)}
        onClose={() => setPickerOpen(false)}
        onApply={({ heroUrl, galleryUrls }) => {
          if (heroUrl) setHeroImageInput(heroUrl);
          setPostImagesInput(galleryUrls.join(', '));
          setPickerOpen(false);
        }}
      />
      <section className="section">
        <div className="container">
          <div className="card pawmarks-admin-card">
            <div className="pawmarks-admin-header">
              <div>
                <div className="pill">Admin only</div>
                <h1 className="section-title">Create a Pawmark</h1>
                <p className="section-lede">Add a memorial profile and optionally a first tribute post.</p>
                <p className="font-body text-sm text-[#3A3A3A]/70">Need image URLs? Open the Media Library in Admin to copy uploaded photo links.</p>
              </div>
              <div className="hero-actions">
                <Link className="cta secondary" to="/admin/media">
                  Media Library
                </Link>
                <Link className="cta secondary" to="/pawmarks">
                  Back to Pawmarks
                </Link>
              </div>
            </div>

            <form className="pawmarks-admin-form" onSubmit={handleSubmit}>
              <div className="pawmarks-admin-row">
                <label className="field">
                  <span className="label">Pet name</span>
                  <input name="pet_name" required placeholder="Oliver" />
                </label>
                <label className="field">
                  <span className="label">Guardian name</span>
                  <input name="owner_name" required placeholder="Tee" />
                </label>
              </div>

              <div className="pawmarks-admin-row">
                <label className="field">
                  <span className="label">Hero image URL</span>
                  <input
                    name="hero_image"
                    required
                    placeholder="/assets/oli.png or https://..."
                    value={heroImageInput}
                    onChange={(event) => setHeroImageInput(event.target.value)}
                  />
                </label>
                <label className="field">
                  <span className="label">Title style</span>
                  <select name="title_style" defaultValue="serif">
                    <option value="serif">Serif</option>
                    <option value="script">Script</option>
                    <option value="caps">Caps</option>
                    <option value="soft">Soft</option>
                  </select>
                </label>
              </div>
              <div className="pawmarks-admin-row">
                <button
                  type="button"
                  className="cta secondary"
                  onClick={() => setPickerOpen(true)}
                >
                  Select Hero + Gallery Images
                </button>
              </div>

              <div className="pawmarks-admin-row">
                <label className="field">
                  <span className="label">Tagline</span>
                  <input name="tagline" placeholder="A light is kept here." />
                </label>
                <label className="field">
                  <span className="label">Dates</span>
                  <input name="dates" placeholder="2012-2025 or Forever loved" />
                </label>
              </div>

              <div className="pawmarks-admin-row">
                <label className="field">
                  <span className="label">Species</span>
                  <input name="species" placeholder="Dog, cat, rabbit" />
                </label>
                <label className="field">
                  <span className="label">Profile ID (optional)</span>
                  <input name="profile_id" placeholder="Custom slug if needed" />
                </label>
              </div>

              <label className="field">
                <span className="label">Bio</span>
                <textarea name="bio" rows={4} placeholder="Short tribute or summary of their spirit."></textarea>
              </label>

              <div className="pawmarks-admin-divider"></div>

              <h2 className="section-title pawmarks-admin-subtitle">First tribute post (optional)</h2>
              <div className="pawmarks-admin-row">
                <label className="field">
                  <span className="label">Post title</span>
                  <input name="post_title" placeholder="My forever good boy" />
                </label>
                <label className="field">
                  <span className="label">YouTube URL</span>
                  <input name="post_youtube" placeholder="https://youtube.com/..." />
                </label>
              </div>

              <label className="field">
                <span className="label">Post body</span>
                <textarea name="post_body" rows={4} placeholder="Share a memory or message."></textarea>
              </label>

              <label className="field">
                <span className="label">Post images (comma separated URLs)</span>
                <input
                  name="post_images"
                  placeholder="/assets/photo1.png, /assets/photo2.png"
                  value={postImagesInput}
                  onChange={(event) => setPostImagesInput(event.target.value)}
                />
              </label>

              {statusNote ? <p className="font-body text-sm text-[#9b3333]">{statusNote}</p> : null}

              <button className="cta" type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Pawmark'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default AdminPawmarksNew;
