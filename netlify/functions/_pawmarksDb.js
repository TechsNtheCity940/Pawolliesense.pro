const PROFILE_FIELDS = [
  'id',
  'pet_name',
  'owner_name',
  'title_style',
  'hero_image',
  'tagline',
  'dates',
  'species',
  'bio',
  'created_at',
  'updated_at'
];

const PROFILE_SELECT = `${PROFILE_FIELDS.join(',')},pawmarks_posts(id,profile_id,created_at_ms,title,body,images,youtube_url,created_at,updated_at)`;

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
};

const parseError = (data, fallback) => {
  const message = data?.message || data?.error || data?.details || fallback;
  if (String(message).includes('relation "public.pawmarks_profiles" does not exist')) {
    return 'Pawmarks tables are missing in Supabase. Run the new migration for pawmarks_profiles and pawmarks_posts.';
  }
  return message;
};

const supabaseRequest = async ({ path, method = 'GET', body, prefer = 'return=representation' } = {}) => {
  const url = `${requiredEnv('SUPABASE_URL')}${path}`;
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(url, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: prefer
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseError(data, 'Supabase request failed.'));
  }
  return data;
};

const toTitleStyle = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return ['serif', 'script', 'caps', 'soft'].includes(normalized) ? normalized : 'serif';
};

const sanitizeProfileInput = (input = {}) => ({
  id: String(input.id || '').trim(),
  pet_name: String(input.petName || '').trim(),
  owner_name: String(input.ownerName || '').trim(),
  title_style: toTitleStyle(input.titleStyle),
  hero_image: String(input.heroImage || '').trim(),
  tagline: String(input.tagline || '').trim() || null,
  dates: String(input.dates || '').trim() || null,
  species: String(input.species || '').trim() || null,
  bio: String(input.bio || '').trim() || null
});

const sanitizePostsInput = (input = {}) => {
  const posts = Array.isArray(input.posts) ? input.posts : [];
  return posts.map((post) => ({
    id: String(post?.id || '').trim(),
    profile_id: String(input.id || '').trim(),
    created_at_ms: Number(post?.createdAt || Date.now()),
    title: String(post?.title || '').trim() || null,
    body: String(post?.body || '').trim() || null,
    images: Array.isArray(post?.images)
      ? post.images.map((item) => String(item || '').trim()).filter(Boolean)
      : [],
    youtube_url: String(post?.youtubeUrl || '').trim() || null
  })).filter((post) => post.id);
};

const mapPost = (row = {}) => ({
  id: row.id,
  createdAt: Number(row.created_at_ms || Date.now()),
  title: row.title || undefined,
  body: row.body || undefined,
  images: Array.isArray(row.images) ? row.images : [],
  youtubeUrl: row.youtube_url || undefined
});

const mapProfile = (row = {}) => {
  const posts = Array.isArray(row.pawmarks_posts) ? row.pawmarks_posts.map(mapPost) : [];
  posts.sort((a, b) => b.createdAt - a.createdAt);
  return {
    id: row.id,
    petName: row.pet_name || '',
    ownerName: row.owner_name || '',
    titleStyle: toTitleStyle(row.title_style),
    heroImage: row.hero_image || '',
    tagline: row.tagline || undefined,
    dates: row.dates || undefined,
    species: row.species || undefined,
    bio: row.bio || undefined,
    posts
  };
};

module.exports = {
  PROFILE_SELECT,
  supabaseRequest,
  sanitizeProfileInput,
  sanitizePostsInput,
  mapProfile
};
