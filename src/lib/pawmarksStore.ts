export type TitleStyle = 'serif' | 'script' | 'caps' | 'soft';

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
  posts: Array<{
    id: string;
    createdAt: number;
    title?: string;
    body?: string;
    images?: string[];
    youtubeUrl?: string;
  }>;
};

const KEY = 'pawollie_pawmarks_profiles_v1';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function seedIfEmpty() {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(KEY);
  if (raw) return;

  const now = Date.now();

  const seed: PawmarkProfile[] = [
    {
      id: 'oliver',
      petName: 'Oliver',
      ownerName: 'Tee',
      titleStyle: 'serif',
      heroImage: '/assets/oli.png',
      tagline: 'A light is kept here.',
      dates: 'Forever loved',
      bio: 'A gentle soul who taught patience, presence, and loyalty.',
      posts: [
        {
          id: uid(),
          createdAt: now - 1000 * 60 * 30,
          title: 'My forever good boy',
          body:
            'I still catch myself listening for your paws on the floor. Thank you for choosing me.',
          youtubeUrl: ''
        }
      ]
    },
    {
      id: 'nova',
      petName: 'Nova',
      ownerName: 'Morgan',
      titleStyle: 'caps',
      heroImage: '/assets/collage-1.png',
      tagline: 'Gone from our lives, never from our hearts.',
      dates: 'Always missed',
      posts: [
        {
          id: uid(),
          createdAt: now - 1000 * 60 * 60 * 7,
          title: 'Quote',
          body: 'Forever loved, forever cherished, and always missed.'
        }
      ]
    }
  ];

  localStorage.setItem(KEY, JSON.stringify(seed));
}

export function listProfiles(): PawmarkProfile[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getProfile(id: string): PawmarkProfile | null {
  const all = listProfiles();
  return all.find((profile) => profile.id === id) || null;
}

export function saveProfile(profile: PawmarkProfile) {
  const all = listProfiles();
  const idx = all.findIndex((item) => item.id === profile.id);
  if (idx >= 0) {
    all[idx] = profile;
  } else {
    all.unshift(profile);
  }
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function addProfile(input: Omit<PawmarkProfile, 'posts'> & { posts?: PawmarkProfile['posts'] }) {
  const profile: PawmarkProfile = {
    ...input,
    posts: input.posts ?? []
  };
  saveProfile(profile);
  return profile;
}

export function addPost(profileId: string, post: PawmarkProfile['posts'][number]) {
  const profile = getProfile(profileId);
  if (!profile) return;
  profile.posts = [{ ...post }, ...profile.posts];
  saveProfile(profile);
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
