export type TitleStyle = 'serif' | 'script' | 'caps' | 'soft';

export type PawmarkPost = {
  id: string;
  createdAt: number;
  title?: string;
  body?: string;
  images?: string[];
  youtubeUrl?: string;
};

export type PawmarkProfile = {
  id: string;
  petName: string;
  ownerName: string;
  titleStyle: TitleStyle;
  heroImage: string;
  tagline?: string;
  dates?: string;
  species?: string;
  bio?: string;
  posts: PawmarkPost[];
};

const asProfile = (raw: any): PawmarkProfile => ({
  id: String(raw?.id || ''),
  petName: String(raw?.petName || ''),
  ownerName: String(raw?.ownerName || ''),
  titleStyle: (['serif', 'script', 'caps', 'soft'].includes(String(raw?.titleStyle || '').toLowerCase())
    ? String(raw?.titleStyle).toLowerCase()
    : 'serif') as TitleStyle,
  heroImage: String(raw?.heroImage || ''),
  tagline: raw?.tagline ? String(raw.tagline) : undefined,
  dates: raw?.dates ? String(raw.dates) : undefined,
  species: raw?.species ? String(raw.species) : undefined,
  bio: raw?.bio ? String(raw.bio) : undefined,
  posts: Array.isArray(raw?.posts)
    ? raw.posts.map((post: any) => ({
      id: String(post?.id || ''),
      createdAt: Number(post?.createdAt || Date.now()),
      title: post?.title ? String(post.title) : undefined,
      body: post?.body ? String(post.body) : undefined,
      images: Array.isArray(post?.images) ? post.images.map((img: any) => String(img || '')).filter(Boolean) : [],
      youtubeUrl: post?.youtubeUrl ? String(post.youtubeUrl) : undefined
    }))
    : []
});

const requestJson = async (url: string, init?: RequestInit) => {
  const response = await fetch(url, init);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result?.error || 'Request failed.');
  }
  return result;
};

export async function listProfiles(): Promise<PawmarkProfile[]> {
  const result = await requestJson('/api/pawmarks');
  const data = Array.isArray(result?.data) ? result.data : [];
  return data.map(asProfile);
}

export async function getProfile(id: string): Promise<PawmarkProfile | null> {
  const safeId = String(id || '').trim();
  if (!safeId) return null;
  try {
    const result = await requestJson(`/api/pawmarks?id=${encodeURIComponent(safeId)}`);
    return result?.data ? asProfile(result.data) : null;
  } catch (error: any) {
    if (String(error?.message || '').toLowerCase().includes('not found')) {
      return null;
    }
    throw error;
  }
}

export async function saveProfile(profile: PawmarkProfile): Promise<PawmarkProfile | null> {
  const result = await requestJson('/api/admin/pawmarks/save', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile })
  });
  return result?.data ? asProfile(result.data) : null;
}

export const addProfile = saveProfile;

export function seedIfEmpty() {
  // Supabase-backed storage; no local seeding needed.
}

export function toYouTubeEmbed(url: string) {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace('www.', '');
    let videoId = '';

    if (host === 'youtu.be') videoId = u.pathname.replace('/', '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname === '/watch') videoId = u.searchParams.get('v') || '';
      if (u.pathname.startsWith('/shorts/'))
        videoId = u.pathname.split('/shorts/')[1]?.split('/')[0] || '';
      if (u.pathname.startsWith('/embed/'))
        videoId = u.pathname.split('/embed/')[1]?.split('/')[0] || '';
    }
    if (!videoId) return null;

    const params = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' });
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  } catch {
    return null;
  }
}
