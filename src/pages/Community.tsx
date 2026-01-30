import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PawollieStarGame from '@/components/community/PawollieStarGame';
import SiteLayout from '@/components/site/SiteLayout';

type Media =
  | { kind: 'image'; url: string; alt?: string }
  | { kind: 'video'; url: string; poster?: string }
  | { kind: 'none' };

type Post = {
  id: string;
  authorName: string;
  authorHandle?: string;
  authorAvatarUrl?: string;
  createdAt: string;
  title?: string;
  body: string;
  tags: string[];
  media: Media;
  likeCount: number;
  commentCount: number;
};

type ViewMode = 'stack' | 'grid' | 'compact';
type SortMode = 'recent' | 'oldest';
type FilterMode = 'all' | 'memorial' | 'facts' | 'community';

const oliverCaption =
  "TO THE BEST FRIEND I HAVE EVER KNOWN. THE ONE WHO KNEW WHEN ANXIETY HIT OR THAT IT WAS JUST A HARD DAY BEFORE I DID. HE SENT HIS WELCOME'S TO THE BEDS, HIS OSTRICH BEAR BURYING HIS HEAD INTO YOU TILL YOU SMILE, AND THE BEST PARTIES THROWN BY THE ONE AND ONLY, BECAUSE IT WAS SNUGGLE TIME. I WISH I HAD SAVED YOU, I WANT TO TAKE THAT DAY BACK AND DO IT ALL OVER BUT WITH YOU IN THE END. I CRY ALMOST EVERYDAY WHEN YOUR PRESENCE IS MISSED. IT DOESN'T FEEL REAL WITHOUT YOU. YOU MADE ALL DAYS BETTER WHEN YOU WERE IN THEM. I'M SORRY I COULDN'T DO MORE FOR YOU, I'M SORRY THEY DIDN'T VALUE LIKE YOUR FAMIL DOES. WHAT I WOULD DO TO PLAY CAN'T GET ME AGAIN. I HOPE THERES FRESH FRIDGE WATER IN HEVAEN, WITH ALL THE FLUFFY STUFF YOU CAN IMAGINE TO KEEP YOU BUSY. OLI BEAR, YOU WILL OL-WAYS BE MOMMY'S BEARY BEST FRIEND, WAIT FOR ME, BECAUSE THIS MOM HERE, WELL YOU HAVE OLI-VER HEART. RIP DADDY DEAR, TILL I SEE YOU AGAIN. YOUR MOM-MEE'S OLLIEE'S FOREVER AND ANYTHING AFTER.";

const now = Date.now();

const wagBookPosts: Post[] = [
  {
    id: 'oliver-herbert-griiffin',
    authorName: 'Mommee',
    authorHandle: '@mommee',
    createdAt: new Date(now - 1000 * 60 * 35).toISOString(),
    title: 'Oliver Herbert Griiiffin',
    body: oliverCaption,
    tags: ['memorial', 'community'],
    media: { kind: 'image', url: '/assets/oli%20mum%20lays.png', alt: 'Oliver Herbert Griiiffin' },
    likeCount: 18,
    commentCount: 6
  },
  {
    id: 'olive',
    authorName: 'Cam',
    authorHandle: '@cam',
    createdAt: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
    title: 'Olive',
    body: 'Sun patches and soft blankets. Today was a good day.',
    tags: ['community'],
    media: { kind: 'image', url: '/assets/IMG_1649.jpeg', alt: 'Olive' },
    likeCount: 26,
    commentCount: 3
  },
  {
    id: 'bear',
    authorName: 'Jordan',
    authorHandle: '@jordan',
    createdAt: new Date(now - 1000 * 60 * 60 * 4).toISOString(),
    title: 'Bear',
    body: 'We finally found a trail that feels calm and safe. Proud of this brave pup.',
    tags: ['community'],
    media: { kind: 'image', url: '/assets/IMG_1682.jpeg', alt: 'Bear' },
    likeCount: 12,
    commentCount: 2
  },
  {
    id: 'thomas',
    authorName: 'Riley',
    authorHandle: '@riley',
    createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
    title: 'Thomas',
    body: 'Morning cuddle check-in. He insisted on being tucked in.',
    tags: ['community'],
    media: { kind: 'image', url: '/assets/IMG_2595.jpeg', alt: 'Thomas' },
    likeCount: 31,
    commentCount: 4
  },
  {
    id: 'luna',
    authorName: 'Aisha',
    authorHandle: '@aisha',
    createdAt: new Date(now - 1000 * 60 * 60 * 12).toISOString(),
    title: 'Luna',
    body: 'A quiet afternoon with the gentlest soul. We are practicing slow walks and deep breaths.',
    tags: ['community'],
    media: { kind: 'none' },
    likeCount: 14,
    commentCount: 1
  },
  {
    id: 'rio',
    authorName: 'Malik',
    authorHandle: '@malik',
    createdAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
    title: 'Rio',
    body: 'First day at the park after a long week. So proud of this brave heart.',
    tags: ['community'],
    media: { kind: 'none' },
    likeCount: 9,
    commentCount: 0
  },
  {
    id: 'sage',
    authorName: 'Ren',
    authorHandle: '@ren',
    createdAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
    title: 'Sage',
    body: 'Morning light, soft paws, and a reminder to be present.',
    tags: ['community'],
    media: { kind: 'none' },
    likeCount: 21,
    commentCount: 2
  },
  {
    id: 'nova',
    authorName: 'Jules',
    authorHandle: '@jules',
    createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
    title: 'Nova',
    body: 'Celebrating a good health check and lots of cuddles today.',
    tags: ['community'],
    media: { kind: 'none' },
    likeCount: 6,
    commentCount: 0
  }
];

const timeAgo = (iso: string) => {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
};

const WagBookFeed: React.FC = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('recent');
  const [view, setView] = useState<ViewMode>('stack');
  const [likes, setLikes] = useState<Record<string, number>>(() =>
    Object.fromEntries(wagBookPosts.map((post) => [post.id, post.likeCount]))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = wagBookPosts.filter((post) => {
      const matchesQuery =
        !q ||
        post.body.toLowerCase().includes(q) ||
        (post.title?.toLowerCase().includes(q) ?? false) ||
        post.authorName.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesFilter =
        filter === 'all' ? true : post.tags.map((tag) => tag.toLowerCase()).includes(filter);

      return matchesQuery && matchesFilter;
    });

    list = list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === 'recent' ? tb - ta : ta - tb;
    });

    return list;
  }, [query, filter, sort]);

  const handleLike = (postId: string) => {
    setLikes((prev) => ({ ...prev, [postId]: (prev[postId] ?? 0) + 1 }));
  };

  const shareHref = '/community/new';

  const initialsFor = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
    return initials.join('') || 'PS';
  };

  return (
    <section className="wagbook-shell" aria-label="Wag Book Feed">
      <header className="wagbook-header">
        <div className="wagbook-titleRow">
          <div>
            <h2 className="wagbook-title">Wag Book</h2>
            <div className="wagbook-sub">{filtered.length} posts</div>
          </div>

          <div className="wagbook-actions">
            <Link className="btn btn-primary" to={shareHref} aria-label="Share Your Companion">
              Share Your Companion
            </Link>
          </div>
        </div>

        <div className="wagbook-controls">
          <div className="wagbook-search">
            <label className="wagbook-label" htmlFor="wagbook-search">
              Search
            </label>
            <input
              id="wagbook-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, tag, or story"
            />
          </div>
          <select
            className="wagbook-select"
            value={filter}
            onChange={(event) => setFilter(event.target.value as FilterMode)}
            aria-label="Filter posts"
          >
            <option value="all">All tags</option>
            <option value="community">Community</option>
            <option value="memorial">Memorial</option>
            <option value="facts">Facts</option>
          </select>
          <select
            className="wagbook-select"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            aria-label="Sort posts"
          >
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest first</option>
          </select>
          <div className="wagbook-view" role="group" aria-label="View mode">
            <button type="button" aria-pressed={view === 'stack'} onClick={() => setView('stack')}>
              Stack
            </button>
            <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')}>
              Grid
            </button>
            <button type="button" aria-pressed={view === 'compact'} onClick={() => setView('compact')}>
              Compact
            </button>
          </div>
        </div>
      </header>

      <div className={`wagbook-feed wagbook-view-${view}`}>
        {filtered.length === 0 ? (
          <div className="wagbook-empty">No posts match your search right now.</div>
        ) : (
          <div className="wagbook-feedList">
            {filtered.map((post) => (
              <article key={post.id} className="wagbook-card">
                <div className="wagbook-card-head">
                  <div className="wagbook-author">
                    <div className="wagbook-avatar" aria-hidden="true">
                      {post.authorAvatarUrl ? (
                        <img src={post.authorAvatarUrl} alt="" />
                      ) : (
                        <span>{initialsFor(post.authorName)}</span>
                      )}
                    </div>
                    <div>
                      <div className="wagbook-author-name">{post.authorName}</div>
                      {post.authorHandle ? (
                        <div className="wagbook-author-handle">{post.authorHandle}</div>
                      ) : null}
                    </div>
                  </div>
                  <div className="wagbook-time">{timeAgo(post.createdAt)}</div>
                </div>

                {post.title ? <h3 className="wagbook-card-title">{post.title}</h3> : null}

                {post.media.kind === 'image' ? (
                  <div className="wagbook-media">
                    <img src={post.media.url} alt={post.media.alt ?? 'Wag Book post'} />
                  </div>
                ) : null}

                {post.media.kind === 'video' ? (
                  <div className="wagbook-media">
                    <video src={post.media.url} poster={post.media.poster} muted loop playsInline />
                  </div>
                ) : null}

                <p className="wagbook-body">{post.body}</p>

                <div className="wagbook-card-footer">
                  <div className="wagbook-tags">
                    {post.tags.map((tag) => (
                      <span key={`${post.id}-${tag}`} className="wagbook-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="wagbook-stats">
                    <button type="button" className="wagbook-like" onClick={() => handleLike(post.id)}>
                      Like
                    </button>
                    <span>{likes[post.id] ?? 0} likes</span>
                    <span>{post.commentCount} comments</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const Community: React.FC = () => {
  return (
    <SiteLayout
      footerLinks={[
        { label: 'Home', to: '/#home' },
        { label: 'Services', to: '/services' },
        { label: 'Memorial', to: '/memorial' },
        { label: 'Intake', to: '/intake' }
      ]}
    >
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-card">
            <div className="pill">Wag Book gallery | Gentle sharing | Comments and likes</div>
            <h1 className="hero-title">Wag Book</h1>
            <p className="section-lede">
              A space to celebrate pets in the everyday. Share photos, leave encouragement, and connect with fellow guardians.
            </p>
            <p className="mini">If you upload a post, please include a username and your pet name(s).</p>
            <div className="hero-actions">
              <Link className="cta secondary cta-small" to="/services#community-care">Paw It Forward</Link>
              <Link className="cta cta-small" to="/community/new">Share Your Companion</Link>
            </div>
          </div>
          <div className="stack community-hero-aside">
            <img className="hero-logo" src="/assets/branding/oli_globe_5.png" alt="Illustrated Pawollie Sense logo featuring Oliver" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid">
            <div className="col-6">
              <WagBookFeed />
            </div>

            <div className="col-6">
              <PawollieStarGame />
            </div>

          </div>
        </div>
      </section>

    </SiteLayout>
  );
};

export default Community;
