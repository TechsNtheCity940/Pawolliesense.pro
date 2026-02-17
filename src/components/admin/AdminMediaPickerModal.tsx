import React, { useEffect, useMemo, useState } from 'react';

type MediaRow = {
  id: string;
  storage_path?: string;
  original_name?: string;
  photo_type?: string;
  pets?: { name?: string };
  customers?: { first_name?: string; last_name?: string; email?: string };
};

type ApplyPayload = {
  heroUrl: string;
  galleryUrls: string[];
};

type Props = {
  isOpen: boolean;
  initialHeroUrl?: string;
  initialGalleryUrls?: string[];
  onClose: () => void;
  onApply: (payload: ApplyPayload) => void;
};

const AdminMediaPickerModal: React.FC<Props> = ({
  isOpen,
  initialHeroUrl = '',
  initialGalleryUrls = [],
  onClose,
  onApply
}) => {
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [heroUrl, setHeroUrl] = useState(initialHeroUrl);
  const [selectedGallery, setSelectedGallery] = useState<Set<string>>(new Set(initialGalleryUrls));

  useEffect(() => {
    if (!isOpen) return;
    setHeroUrl(initialHeroUrl || '');
    setSelectedGallery(new Set(initialGalleryUrls || []));
  }, [isOpen, initialHeroUrl, initialGalleryUrls]);

  const loadMedia = async (query = '') => {
    setLoading(true);
    setError('');
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
      setError(loadError?.message || 'Unable to load media files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadMedia().catch(() => {});
  }, [isOpen]);

  const selectedCount = useMemo(() => selectedGallery.size, [selectedGallery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl max-h-[92vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#9DB5A5]/20 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold text-[#2D3561]">Select Hero + Gallery Images</h3>
            <p className="font-body text-sm text-[#3A3A3A]/70">
              Pick one hero image and multiple gallery images in one step.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-[#2D3561]/30 text-[#2D3561] text-sm font-display font-semibold hover:bg-[#2D3561]/10"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-3 border-b border-[#9DB5A5]/20 flex flex-wrap items-center gap-2">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by pet, customer, or filename..."
            className="flex-1 min-w-[260px] px-3 py-2 rounded-lg border border-[#9DB5A5]/30 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
          />
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-[#2D3561]/30 text-[#2D3561] text-sm font-display font-semibold hover:bg-[#2D3561]/10"
            onClick={() => loadMedia(search)}
          >
            Search
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-[#2D3561]/30 text-[#2D3561] text-sm font-display font-semibold hover:bg-[#2D3561]/10"
            onClick={() => {
              const next = new Set<string>();
              rows.forEach((row) => {
                if (row.storage_path) next.add(row.storage_path);
              });
              setSelectedGallery(next);
            }}
          >
            Select All Shown
          </button>
          <button
            type="button"
            className="px-3 py-2 rounded-lg border border-[#2D3561]/30 text-[#2D3561] text-sm font-display font-semibold hover:bg-[#2D3561]/10"
            onClick={() => setSelectedGallery(new Set())}
          >
            Clear Gallery
          </button>
        </div>

        <div className="px-5 py-3 border-b border-[#9DB5A5]/20 font-body text-sm text-[#3A3A3A]/80">
          Hero: {heroUrl ? 'selected' : 'not selected'} | Gallery selected: {selectedCount}
        </div>

        <div className="p-5 overflow-y-auto">
          {error ? <p className="font-body text-sm text-[#9b3333] mb-3">{error}</p> : null}
          {loading ? (
            <p className="font-body text-sm text-[#3A3A3A]/70">Loading media...</p>
          ) : rows.length === 0 ? (
            <p className="font-body text-sm text-[#3A3A3A]/70">No files found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {rows.map((row) => {
                const url = row.storage_path || '';
                const checked = url ? selectedGallery.has(url) : false;
                const heroChecked = Boolean(url && heroUrl === url);
                const customerName = [row.customers?.first_name, row.customers?.last_name].filter(Boolean).join(' ').trim();
                return (
                  <div key={row.id} className="border border-[#9DB5A5]/20 rounded-xl p-3">
                    {url ? (
                      <img
                        src={url}
                        alt={row.original_name || 'Uploaded media'}
                        className="w-full h-40 object-cover rounded-lg mb-2"
                      />
                    ) : null}
                    <p className="font-display text-xs font-semibold text-[#2D3561] break-all">
                      {row.original_name || 'Unnamed file'}
                    </p>
                    <p className="font-body text-xs text-[#3A3A3A]/70">
                      {row.pets?.name || 'n/a'} • {customerName || row.customers?.email || 'n/a'}
                    </p>
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center gap-2 font-body text-xs text-[#3A3A3A]">
                        <input
                          type="radio"
                          name="hero-selection"
                          checked={heroChecked}
                          onChange={() => setHeroUrl(url)}
                        />
                        Use as hero image
                      </label>
                      <label className="flex items-center gap-2 font-body text-xs text-[#3A3A3A]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            if (!url) return;
                            setSelectedGallery((prev) => {
                              const next = new Set(prev);
                              if (next.has(url)) next.delete(url);
                              else next.add(url);
                              return next;
                            });
                          }}
                        />
                        Include in gallery
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#9DB5A5]/20 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold hover:bg-[#2D3561]/10"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onApply({ heroUrl, galleryUrls: Array.from(selectedGallery) })}
            className="px-4 py-2 rounded-lg bg-[#2D3561] text-white font-display text-sm font-semibold hover:bg-[#3D4A7A]"
          >
            Apply Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminMediaPickerModal;
