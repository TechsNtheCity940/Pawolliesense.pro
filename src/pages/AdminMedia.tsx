import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import SiteLayout from '@/components/site/SiteLayout';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminSession } from '@/hooks/useAdminSession';

type MediaRow = {
  id: string;
  original_name?: string;
  photo_type?: string;
  storage_path?: string;
  created_at?: string;
  file_size?: number;
  pets?: { name?: string };
  customers?: { first_name?: string; last_name?: string; email?: string };
};

const formatBytes = (bytes?: number) => {
  const value = Number(bytes || 0);
  if (!value) return 'n/a';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminMedia: React.FC = () => {
  const { status, error, busy, login } = useAdminSession();
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const load = async (query = '') => {
    setLoading(true);
    setStatusNote('');
    try {
      const response = await fetch(`/api/admin/media-files?limit=250&q=${encodeURIComponent(query)}`, {
        method: 'GET',
        credentials: 'include'
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to load media files.');
      }
      setRows(Array.isArray(result?.data) ? result.data : []);
    } catch (loadError: any) {
      setStatusNote(loadError?.message || 'Unable to load media files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authed') {
      load().catch(() => {});
    }
  }, [status]);

  const totalCount = useMemo(() => rows.length, [rows]);

  if (status !== 'authed') {
    return (
      <AdminLoginCard
        title="Admin Access"
        description="Sign in to browse uploaded media."
        error={error}
        busy={busy}
        onLogin={login}
      />
    );
  }

  return (
    <SiteLayout>
      <section className="section">
        <div className="container">
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="pill">Admin only</div>
                <h1 className="section-title">Media Library</h1>
                <p className="section-lede">Find and reuse customer pet photos uploaded through intake.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link className="cta secondary" to="/admin">
                  Back to Admin
                </Link>
                <button
                  type="button"
                  className="cta secondary"
                  onClick={() => load(search)}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by pet, customer, email, filename..."
                className="flex-1 min-w-[260px] px-3 py-2 rounded-lg border border-[#9DB5A5]/30 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
              />
              <button
                type="button"
                className="cta secondary"
                onClick={() => load(search)}
              >
                Search
              </button>
            </div>

            <p className="font-body text-sm text-[#3A3A3A]/70 mb-3">
              Showing {totalCount} file(s)
            </p>

            {statusNote ? (
              <p className="font-body text-sm text-[#9b3333] mb-3">{statusNote}</p>
            ) : null}

            {loading ? (
              <p className="font-body text-sm text-[#3A3A3A]/70">Loading media files...</p>
            ) : rows.length === 0 ? (
              <p className="font-body text-sm text-[#3A3A3A]/70">No uploaded files found.</p>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {rows.map((row) => {
                  const customerName = [row.customers?.first_name, row.customers?.last_name].filter(Boolean).join(' ').trim();
                  const created = row.created_at
                    ? new Date(row.created_at).toLocaleString()
                    : 'n/a';

                  return (
                    <div key={row.id} className="border border-[#9DB5A5]/20 rounded-xl p-3">
                      {row.storage_path ? (
                        <img
                          src={row.storage_path}
                          alt={row.original_name || 'Uploaded pet photo'}
                          className="w-full h-44 object-cover rounded-lg mb-3"
                        />
                      ) : null}
                      <p className="font-display text-sm font-semibold text-[#2D3561] break-all">
                        {row.original_name || 'Unnamed file'}
                      </p>
                      <p className="font-body text-xs text-[#3A3A3A]/70">
                        Pet: {row.pets?.name || 'n/a'}
                      </p>
                      <p className="font-body text-xs text-[#3A3A3A]/70">
                        Customer: {customerName || row.customers?.email || 'n/a'}
                      </p>
                      <p className="font-body text-xs text-[#3A3A3A]/70">
                        Type: {row.photo_type || 'n/a'} | Size: {formatBytes(row.file_size)}
                      </p>
                      <p className="font-body text-xs text-[#3A3A3A]/70">
                        Uploaded: {created}
                      </p>
                      {row.storage_path ? (
                        <div className="mt-2">
                          <button
                            type="button"
                            className="px-3 py-2 rounded-lg border border-[#2D3561]/30 text-[#2D3561] font-display text-xs font-semibold hover:bg-[#2D3561]/10 transition-colors"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(row.storage_path || '');
                                setStatusNote('Copied image URL to clipboard.');
                              } catch {
                                setStatusNote('Unable to copy URL. Please copy manually.');
                              }
                            }}
                          >
                            Copy URL
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};

export default AdminMedia;
