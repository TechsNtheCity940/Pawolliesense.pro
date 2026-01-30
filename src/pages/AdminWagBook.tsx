import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { pawollieLogoUrl } from '@/lib/brand-assets';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminSession } from '@/hooks/useAdminSession';
import { getFilesByPet, getReadingById } from '@/lib/database';

type StoryPage = {
  id: string;
  pageNumber: number;
  text: string;
};

type ImagePage = {
  id: string;
  pageNumber: number;
  prompt: string;
  imageUrl: string;
};

const makeId = () => Math.random().toString(36).slice(2);

const buildEmptyStory = () =>
  Array.from({ length: 11 }, (_, index) => ({
    id: `story-${index + 1}-${makeId()}`,
    pageNumber: index + 1,
    text: ''
  }));

const buildEmptyImages = () =>
  Array.from({ length: 11 }, (_, index) => ({
    id: `image-${index + 1}-${makeId()}`,
    pageNumber: index + 1,
    prompt: '',
    imageUrl: ''
  }));

const AdminWagBook: React.FC = () => {
  const { status, error, busy, login, logout } = useAdminSession();
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId') ?? '';

  const [orderId, setOrderId] = useState(initialOrderId);
  const [petName, setPetName] = useState('Oli');
  const [guardianName, setGuardianName] = useState('Tee');
  const [shipCountry, setShipCountry] = useState('United States');
  const [tone, setTone] = useState('Warm + reverent');
  const [adminPrompt, setAdminPrompt] = useState('');
  const [characterNames, setCharacterNames] = useState('');
  const [storyline, setStoryline] = useState('');
  const [adminUploads, setAdminUploads] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [storyTitle, setStoryTitle] = useState('');
  const [coverSubtitle, setCoverSubtitle] = useState('');
  const [dedication, setDedication] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [storyPages, setStoryPages] = useState<StoryPage[]>(buildEmptyStory());
  const [imagePages, setImagePages] = useState<ImagePage[]>(buildEmptyImages());
  const [customerUploads, setCustomerUploads] = useState<string[]>([]);
  const [useStrictReferences, setUseStrictReferences] = useState(true);
  const [selectedStoryPages, setSelectedStoryPages] = useState<Set<number>>(new Set());
  const [selectedImagePages, setSelectedImagePages] = useState<Set<number>>(new Set());
  const [storyEditInstruction, setStoryEditInstruction] = useState('');
  const [imageEditInstruction, setImageEditInstruction] = useState('');
  const [isBuildingPdf, setIsBuildingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [isBuildingCover, setIsBuildingCover] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [coverWidthIn, setCoverWidthIn] = useState('');
  const [coverHeightIn, setCoverHeightIn] = useState('');
  const [spineWidthIn, setSpineWidthIn] = useState('');
  const [coverBleedIn, setCoverBleedIn] = useState('0.125');
  const [coverSafeIn, setCoverSafeIn] = useState('0.75');
  const [interiorPdfBase64, setInteriorPdfBase64] = useState('');
  const [coverPdfBase64, setCoverPdfBase64] = useState('');
  const [interiorPdfUrl, setInteriorPdfUrl] = useState('');
  const [coverPdfUrl, setCoverPdfUrl] = useState('');
  const [spellcheckIssues, setSpellcheckIssues] = useState<Array<{ word: string; suggestion: string; context: string }>>([]);
  const [spellcheckApproved, setSpellcheckApproved] = useState(false);
  const [spellcheckOverride, setSpellcheckOverride] = useState(false);
  const [isSpellchecking, setIsSpellchecking] = useState(false);
  const [pdfsApproved, setPdfsApproved] = useState(false);
  const [isSubmittingToLulu, setIsSubmittingToLulu] = useState(false);

  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [isEditingImages, setIsEditingImages] = useState(false);
  const [statusNote, setStatusNote] = useState('');
  const [storyApproved, setStoryApproved] = useState(false);
  const [imagesApproved, setImagesApproved] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [bookStep, setBookStep] = useState(0);

  const referenceList = useMemo(() => {
    const combined = [...customerUploads, ...adminUploads].filter(Boolean);
    return combined;
  }, [customerUploads, adminUploads]);

  const storyReady = storyPages.every((page) => page.text.trim().length > 0);
  const promptsReady = imagePages.every((page) => page.prompt.trim().length > 0);
  const imagesReady = imagePages.every((page) => page.imageUrl.trim().length > 0);
  const isSpreadStep = bookStep >= 2 && bookStep <= storyPages.length + 1;
  const spreadIndex = Math.max(0, bookStep - 2);

  useEffect(() => {
    if (!orderId) return;
    let active = true;

    const loadReading = async () => {
      const { data, error } = await getReadingById(orderId);
      if (!active) return;
      if (error || !data) {
        setStatusNote('Unable to load reading details. You can still enter them manually.');
        return;
      }

      setPetName(data?.pets?.name || petName);
      const guardian = [data?.customers?.first_name, data?.customers?.last_name].filter(Boolean).join(' ').trim();
      if (guardian) setGuardianName(guardian);
      setCharacterNames(data?.wagbook_character_names || '');
      setStoryline(data?.wagbook_storyline || '');
      if (data?.wagbook_cover_image) setCoverImage(data.wagbook_cover_image);

      if (data?.pet_id) {
        const { data: files } = await getFilesByPet(data.pet_id);
        if (active && files?.length) {
          setCustomerUploads(files.map((file) => file.storage_path));
        }
      }
    };

    loadReading();
    return () => {
      active = false;
    };
  }, [orderId, petName]);

  useEffect(() => {
    const defaults = {
      width: import.meta.env.VITE_LULU_COVER_WIDTH_IN,
      height: import.meta.env.VITE_LULU_COVER_HEIGHT_IN,
      spine: import.meta.env.VITE_LULU_SPINE_WIDTH_IN
    };
    if (!coverWidthIn && defaults.width) setCoverWidthIn(String(defaults.width));
    if (!coverHeightIn && defaults.height) setCoverHeightIn(String(defaults.height));
    if (!spineWidthIn && defaults.spine) setSpineWidthIn(String(defaults.spine));
  }, [coverWidthIn, coverHeightIn, spineWidthIn]);

  const bookSummary = useMemo(() => {
    const totalPages = 24;
    return {
      totalPages,
      storyPages: storyPages.length,
      imagePages: imagePages.length
    };
  }, [storyPages.length, imagePages.length]);

  const orderedPages = useMemo(() => (
    [
      { label: 'Title page', detail: storyTitle || '(untitled)' },
      ...storyPages.flatMap((page, index) => ([
        { label: `Story page ${index + 1}`, detail: page.text.slice(0, 80) || '(empty)' },
        { label: `Image page ${index + 1}`, detail: imagePages[index]?.imageUrl || '(no image)' }
      ])),
      {
        label: 'Dedication page',
        detail: dedication || '(empty)'
      }
    ]
  ), [storyTitle, dedication, personalMessage, storyPages, imagePages]);

  const handleGenerateStory = async () => {
    if (isGeneratingStory) return;
    setIsGeneratingStory(true);
    setStatusNote('Generating 11-page story with OpenAI...');
    try {
      const response = await fetch('/api/wagbook/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          petName,
          guardianName,
          characterNames,
          storyline,
          tone,
          adminPrompt,
          notes,
          coverImage: coverImage || referenceList[0] || ''
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || 'Story generation failed.');

      setStoryTitle(result.coverTitle || result.title || `${petName}'s Wag Book`);
      setCoverSubtitle(result.coverSubtitle || result.cover_subtitle || `A keepsake journey for ${guardianName}`);
      setDedication(result.dedication || `Dedicated to ${petName}.`);
      const nextPages = (result.pages || []).map((page: any, index: number) => ({
        id: `story-${index + 1}-${makeId()}`,
        pageNumber: index + 1,
        text: page.text || ''
      }));
      setStoryPages(nextPages.length === 11 ? nextPages : buildEmptyStory());
      setCoverImage(result.coverImage || coverImage || referenceList[0] || '');
      setStoryApproved(false);
      setImagesApproved(false);
      setStatusNote('Story generated. Review and approve to continue.');
    } catch (error) {
      setStatusNote(error instanceof Error ? error.message : 'Story generation failed.');
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const handleApproveStory = async () => {
    if (!storyReady) return;
    setStoryApproved(true);
    setIsGeneratingPrompts(true);
    setStatusNote('Generating image prompts with OpenAI...');
    try {
      const response = await fetch('/api/wagbook/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName,
          guardianName,
          characterNames,
          storyline,
          tone,
          adminPrompt,
          notes,
          storyTitle,
          storyPages: storyPages.map((page) => ({ page: page.pageNumber, text: page.text })),
          hasReferences: referenceList.length > 0
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || 'Prompt generation failed.');

      const prompts = Array.isArray(result.prompts) ? result.prompts : [];
      const nextImages = imagePages.map((page, index) => ({
        ...page,
        prompt: prompts[index]?.text || prompts[index] || page.prompt
      }));
      setImagePages(nextImages);
      setStatusNote('Image prompts ready. Generating images with Nano Banana...');
      await handleGenerateImages(nextImages);
    } catch (error) {
      setStatusNote(error instanceof Error ? error.message : 'Prompt generation failed.');
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleGenerateImages = async (pagesOverride?: ImagePage[], instructionOverride?: string) => {
    const targetPages = pagesOverride || imagePages;
    const hasPrompts = targetPages.every((page) => page.prompt.trim().length > 0);
    if (isGeneratingImages || !hasPrompts) return;
    setIsGeneratingImages(true);
    try {
      const references = referenceList.length ? referenceList : customerUploads;
      const instruction = instructionOverride?.trim() || '';
      for (const page of targetPages) {
        setStatusNote(`Generating image ${page.pageNumber} of ${targetPages.length}...`);
        const response = await fetch('/api/wagbook/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompts: [{ page: page.pageNumber, text: page.prompt }],
            referenceImages: references,
            strictReferences: useStrictReferences,
            instruction,
            petName,
            guardianName,
            characterNames,
            storyline,
            adminPrompt,
            notes
          })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result?.error || 'Image generation failed.');

        const images = Array.isArray(result.images) ? result.images : [];
        const imageUrl = images[0]?.image || result.imageUrls?.[0] || images[0] || '';
        setImagePages((prev) =>
          prev.map((item) =>
            item.pageNumber === page.pageNumber ? { ...item, imageUrl } : item
          )
        );
        if (!coverImage && imageUrl) {
          setCoverImage(imageUrl);
        }
      }
      setImagesApproved(false);
      setStatusNote('Images generated. Review and approve the final book.');
    } catch (error) {
      setStatusNote(error instanceof Error ? error.message : 'Image generation failed.');
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const regenerateSelectedStoryPages = async () => {
    const pages = storyPages.filter((page) => selectedStoryPages.has(page.pageNumber));
    if (!pages.length) return;
    setIsEditingStory(true);
    setStatusNote('Regenerating selected story pages...');
    try {
      const response = await fetch('/api/wagbook/story-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petName,
          guardianName,
          tone,
          instruction: storyEditInstruction,
          pages: pages.map((page) => ({ page: page.pageNumber, text: page.text }))
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || 'Story edit failed.');
      const updatedPages = Array.isArray(result.pages) ? result.pages : [];
      setStoryPages((prev) =>
        prev.map((page) => {
          const updated = updatedPages.find((item) => item.page === page.pageNumber);
          return updated ? { ...page, text: updated.text } : page;
        })
      );
      setStatusNote('Selected story pages updated.');
    } catch (error) {
      setStatusNote(error instanceof Error ? error.message : 'Story edit failed.');
    } finally {
      setIsEditingStory(false);
    }
  };

  const regenerateSelectedImages = async () => {
    const pages = imagePages.filter((page) => selectedImagePages.has(page.pageNumber));
    if (!pages.length) return;
    setIsEditingImages(true);
    setStatusNote('Regenerating selected images...');
    try {
      await handleGenerateImages(pages, imageEditInstruction);
    } finally {
      setIsEditingImages(false);
    }
  };

  const toggleStorySelection = (pageNumber: number) => {
    setSelectedStoryPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) next.delete(pageNumber);
      else next.add(pageNumber);
      return next;
    });
  };

  const toggleImageSelection = (pageNumber: number) => {
    setSelectedImagePages((prev) => {
      const next = new Set(prev);
      if (next.has(pageNumber)) next.delete(pageNumber);
      else next.add(pageNumber);
      return next;
    });
  };

  const handleApproveFinal = async () => {
    if (!storyReady || !imagesReady) return;
    if (!spellcheckApproved && !spellcheckOverride) {
      const issues = await runSpellcheck();
      if (issues.length) return;
    }
    setImagesApproved(true);
    setIsFinalizing(true);
    setBookStep(0);
    setStatusNote('Generating PDFs for review...');
    await handleBuildPdf();
    await handleBuildCoverPdf();
  };

  const handleBuildPdf = async () => {
    if (!imagesApproved || isBuildingPdf) return;
    if (!spellcheckApproved && !spellcheckOverride) {
      const issues = await runSpellcheck();
      if (issues.length) return;
    }
    setIsBuildingPdf(true);
    setStatusNote('Generating PDF layout...');
    try {
      const response = await fetch('/api/wagbook/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: storyTitle,
          subtitle: coverSubtitle || `A keepsake journey for ${guardianName}`,
          dedication,
          personalMessage,
          storyPages,
          imagePages
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'PDF generation failed.');
      }
      if (result.pdfBase64) {
        const blob = await (await fetch(`data:application/pdf;base64,${result.pdfBase64}`)).blob();
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
        setInteriorPdfBase64(result.pdfBase64);
      }
      if (result.pdfUrl) {
        setInteriorPdfUrl(result.pdfUrl);
      }
      setStatusNote(`PDF generated (${result.pageCount || 24} pages).`);
    } catch (error) {
      setStatusNote(error instanceof Error ? error.message : 'PDF generation failed.');
    } finally {
      setIsBuildingPdf(false);
    }
  };

  const handleBuildCoverPdf = async () => {
    if (isBuildingCover) return;
    if (!spellcheckApproved && !spellcheckOverride) {
      const issues = await runSpellcheck();
      if (issues.length) return;
    }
    setIsBuildingCover(true);
    setStatusNote('Generating hardcover cover PDF...');
    try {
      const response = await fetch('/api/wagbook/cover-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: storyTitle,
          personalMessage,
          coverImage: '',
          coverWidthIn,
          coverHeightIn,
          spineWidthIn,
          bleedIn: coverBleedIn,
          safeIn: coverSafeIn
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Cover PDF generation failed.');
      }
      if (result.pdfBase64) {
        const blob = await (await fetch(`data:application/pdf;base64,${result.pdfBase64}`)).blob();
        const url = URL.createObjectURL(blob);
        setCoverPreviewUrl(url);
        setCoverPdfBase64(result.pdfBase64);
      }
      if (result.pdfUrl) {
        setCoverPdfUrl(result.pdfUrl);
      }
      setStatusNote('Cover PDF generated.');
    } catch (error) {
      setStatusNote(error instanceof Error ? error.message : 'Cover PDF generation failed.');
    } finally {
      setIsBuildingCover(false);
    }
  };

  const runSpellcheck = async (): Promise<Array<{ word: string; suggestion: string; context: string }>> => {
    if (isSpellchecking) return [];
    setIsSpellchecking(true);
    setStatusNote('Running spellcheck...');
    try {
      const combinedText = [
        storyTitle,
        dedication,
        personalMessage,
        ...storyPages.map((page) => page.text)
      ]
        .filter(Boolean)
        .join('\n\n');
      const response = await fetch('/api/wagbook/spellcheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: combinedText })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Spellcheck failed.');
      }
      const issues = Array.isArray(result.issues) ? result.issues : [];
      setSpellcheckIssues(issues);
      setSpellcheckApproved(issues.length === 0);
      if (issues.length) {
        setStatusNote('Spellcheck found potential issues. Review before continuing.');
      } else {
        setStatusNote('Spellcheck passed.');
      }
      return issues;
    } catch (error) {
      setStatusNote(error instanceof Error ? error.message : 'Spellcheck failed.');
      return [];
    } finally {
      setIsSpellchecking(false);
    }
  };

  const handleApprovePdfs = () => {
    if (!interiorPdfBase64 || !coverPdfBase64) return;
    setPdfsApproved(true);
    setStatusNote('PDFs approved. Ready to submit to Lulu Direct.');
  };

  const handleSubmitToLulu = async () => {
    if (!pdfsApproved || isSubmittingToLulu) return;
    setIsSubmittingToLulu(true);
    setStatusNote('Submitting to Lulu Direct...');
    try {
      const response = await fetch('/api/wagbook/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          interiorPdfUrl,
          coverPdfUrl,
          interiorPdfBase64,
          coverPdfBase64,
          shipCountry,
          quantity: 1,
          shipping: 'Mail | trackable'
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Print order failed.');
      }
      setStatusNote(`Print order queued with Lulu Direct. Order ID: ${result?.order?.id ?? 'pending'}.`);
    } catch (error) {
      setStatusNote(error instanceof Error ? error.message : 'Print order failed.');
    } finally {
      setIsSubmittingToLulu(false);
    }
  };

  const updateStoryPage = (pageNumber: number, value: string) => {
    setStoryPages((prev) =>
      prev.map((page) => (page.pageNumber === pageNumber ? { ...page, text: value } : page))
    );
  };

  const updatePrompt = (pageNumber: number, value: string) => {
    setImagePages((prev) =>
      prev.map((page) => (page.pageNumber === pageNumber ? { ...page, prompt: value } : page))
    );
  };

  const updateImageUrl = (pageNumber: number, value: string) => {
    setImagePages((prev) =>
      prev.map((page) => (page.pageNumber === pageNumber ? { ...page, imageUrl: value } : page))
    );
  };

  if (status !== 'authed') {
    return (
      <AdminLoginCard
        title="Admin Access"
        description="Sign in to generate Wag Books."
        error={error}
        busy={busy}
        onLogin={login}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <header className="bg-[#2D3561] text-white py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <img
                src={pawollieLogoUrl}
                alt="Pawollie Sense"
                className="h-12 w-12 rounded-full"
              />
              <div>
                <h1 className="font-display text-2xl font-bold">Wag Book Pipeline</h1>
                <p className="font-body text-white/70 text-sm">Story → prompts → images → Canva → Lulu Direct.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 border border-white/30 text-white font-display font-semibold rounded-full hover:bg-white/10 transition-colors"
              >
                Sign out
              </button>
              <Link
                to="/admin"
                className="px-4 py-2 bg-[#D4AF37] text-[#2D3561] font-display font-semibold rounded-full hover:bg-[#E5C158] transition-colors"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-[#2D3561]">Pipeline Status</h2>
              <p className="font-body text-sm text-[#3A3A3A]/70">
                OpenAI drafts the story + prompts. Nano Banana generates images. Canva exports PDF. Lulu prints.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#2D3561]/10 text-[#2D3561]">
                {bookSummary.totalPages} pages total
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#D4AF37]/20 text-[#2D3561]">
                Lulu Direct locked spec
              </span>
            </div>
          </div>
          {statusNote ? (
            <div className="mt-4 bg-[#F5F1E8] border border-[#9DB5A5]/30 rounded-xl p-4 text-sm text-[#3A3A3A]">
              {statusNote}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#2D3561]">1) Order + Customer Snapshot</h3>
              <p className="font-body text-sm text-[#3A3A3A]/70">
                Pull in customer details and Wag Book inputs from the original intake.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="field">
                <span className="label">Order ID</span>
                <input
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  placeholder="ex: reading_3a4f8"
                />
              </label>
              <label className="field">
                <span className="label">Ship-to country</span>
                <input
                  value={shipCountry}
                  onChange={(event) => setShipCountry(event.target.value)}
                />
              </label>
              <label className="field">
                <span className="label">Pet name</span>
                <input
                  value={petName}
                  onChange={(event) => setPetName(event.target.value)}
                />
              </label>
              <label className="field">
                <span className="label">Guardian name</span>
                <input
                  value={guardianName}
                  onChange={(event) => setGuardianName(event.target.value)}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="field">
                <span className="label">Narrative tone</span>
                <select value={tone} onChange={(event) => setTone(event.target.value)}>
                  <option>Warm + reverent</option>
                  <option>Celebratory + bright</option>
                  <option>Quiet + reflective</option>
                  <option>Playful + storybook</option>
                </select>
              </label>
              <label className="field">
                <span className="label">Special notes</span>
                <input
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Names, dates, phrases, or design requests"
                />
              </label>
            </div>

            <div className="bg-[#F5F1E8] rounded-xl p-4 border border-[#9DB5A5]/20">
              <h4 className="font-display font-semibold text-[#2D3561] mb-2">Customer Assets</h4>
              <p className="font-body text-sm text-[#3A3A3A]/70 mb-3">
                These are customer-uploaded photos that can guide image generation.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {customerUploads.map((asset) => (
                  <div key={asset} className="rounded-xl border border-[#9DB5A5]/30 bg-white p-2">
                    <img src={asset} alt="Customer upload" className="w-full h-24 object-cover rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-5">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#2D3561]">2) Story Inputs</h3>
              <p className="font-body text-sm text-[#3A3A3A]/70">
                OpenAI uses these inputs to generate an 11-page story.
              </p>
            </div>
            <label className="field">
              <span className="label">Character names (from customer)</span>
              <input
                value={characterNames}
                onChange={(event) => setCharacterNames(event.target.value)}
                placeholder="Example: Oli, Tee, Grandma Joy"
              />
            </label>
            <label className="field">
              <span className="label">General story idea (from customer)</span>
              <textarea
                rows={3}
                value={storyline}
                onChange={(event) => setStoryline(event.target.value)}
                placeholder="Example: A bedtime story about finding courage after moving to a new home."
                className="w-full rounded-xl border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </label>
            <div className="bg-[#F5F1E8] rounded-xl p-4 border border-[#9DB5A5]/20 space-y-3">
              <div>
                <h4 className="font-display font-semibold text-[#2D3561] mb-1">Reference images (auto)</h4>
                <p className="font-body text-xs text-[#3A3A3A]/70">
                  Customer uploads are automatically included. You can add local images below if needed.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {referenceList.length ? referenceList.map((asset) => (
                  <div key={asset} className="rounded-xl border border-[#9DB5A5]/30 bg-white p-2">
                    <img src={asset} alt="Reference" className="w-full h-20 object-cover rounded-lg" />
                  </div>
                )) : (
                  <div className="text-xs text-[#3A3A3A]/60">No reference images loaded yet.</div>
                )}
              </div>
              <label className="field">
                <span className="label">Upload local images (admin)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (event) => {
                    const files = Array.from(event.target.files || []);
                    if (!files.length) return;
                    const readFile = (file: File) => new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(String(reader.result || ''));
                      reader.onerror = () => reject(reader.error);
                      reader.readAsDataURL(file);
                    });
                    const uploads = await Promise.all(files.map(readFile));
                    setAdminUploads((prev) => [...prev, ...uploads]);
                  }}
                />
              </label>
              <label className="field">
                <span className="label">Reference fidelity</span>
                <div className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={useStrictReferences}
                    onChange={(event) => setUseStrictReferences(event.target.checked)}
                  />
                  <span>Use uploaded photos as strict character reference (recommended)</span>
                </div>
              </label>
            </div>
            <textarea
              rows={6}
              value={adminPrompt}
              onChange={(event) => setAdminPrompt(event.target.value)}
              placeholder="Add any constraints for the story tone, length, or themes."
              className="w-full rounded-xl border border-[#9DB5A5]/30 px-3 py-3 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              type="button"
              onClick={handleGenerateStory}
              disabled={isGeneratingStory || !petName.trim()}
              className="w-full px-4 py-3 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
            >
              {isGeneratingStory ? 'Generating story...' : 'Generate 11-Page Story'}
            </button>
          </div>
        </div>

        {!isFinalizing ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#2D3561]">3) Story Review (11 pages)</h3>
              <p className="font-body text-sm text-[#3A3A3A]/70">
                Title page comes first, then alternating story + image pages, then the dedication page.
              </p>
            </div>
            <div className="text-xs text-[#3A3A3A]/70">
              Story pages: {storyPages.length} • Image pages: {imagePages.length}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="field">
              <span className="label">Title page title</span>
              <input value={storyTitle} onChange={(event) => setStoryTitle(event.target.value)} />
            </label>
            <label className="field">
              <span className="label">Title page subtitle</span>
              <input
                value={coverSubtitle}
                onChange={(event) => setCoverSubtitle(event.target.value)}
                placeholder={`A keepsake journey for ${guardianName}`}
              />
            </label>
          </div>
          <label className="field">
            <span className="label">Dedication page text</span>
            <input value={dedication} onChange={(event) => setDedication(event.target.value)} />
          </label>
          <label className="field">
            <span className="label">Personal message (back of book)</span>
            <textarea
              rows={3}
              value={personalMessage}
              onChange={(event) => setPersonalMessage(event.target.value)}
              className="w-full rounded-xl border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm"
              placeholder="Add a custom note for the customer..."
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {storyPages.map((page) => (
              <label key={page.id} className="field">
                <span className="label">Story page {page.pageNumber}</span>
                <div className="flex items-center gap-2 text-xs text-[#3A3A3A]/70 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedStoryPages.has(page.pageNumber)}
                    onChange={() => toggleStorySelection(page.pageNumber)}
                  />
                  <span>Select for OpenAI edit</span>
                </div>
                <textarea
                  rows={4}
                  value={page.text}
                  onChange={(event) => updateStoryPage(page.pageNumber, event.target.value)}
                  className="w-full rounded-xl border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm"
                />
              </label>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleApproveStory}
              disabled={!storyReady || isGeneratingPrompts}
              className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
            >
              {isGeneratingPrompts ? 'Generating prompts...' : 'Approve Story & Generate Prompts'}
            </button>
            <button
              type="button"
              onClick={handleGenerateStory}
              disabled={isGeneratingStory}
              className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
            >
              {isGeneratingStory ? 'Regenerating story...' : 'Regenerate Full Story'}
            </button>
            <button
              type="button"
              onClick={regenerateSelectedStoryPages}
              disabled={!selectedStoryPages.size || isEditingStory}
              className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
            >
              {isEditingStory ? 'Editing selected...' : 'Edit Selected Story Pages'}
            </button>
          </div>
          <label className="field">
            <span className="label">OpenAI edit instruction (for selected pages)</span>
            <input
              value={storyEditInstruction}
              onChange={(event) => setStoryEditInstruction(event.target.value)}
              placeholder="Example: Make this page more playful and shorten to 2 sentences."
            />
          </label>
        </div>
        ) : null}

        {!isFinalizing ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#2D3561]">4) Image Prompts + Images (11)</h3>
              <p className="font-body text-sm text-[#3A3A3A]/70">
                OpenAI creates prompts, Nano Banana generates the images.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleGenerateImages}
                disabled={!promptsReady || isGeneratingImages}
                className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
              >
                {isGeneratingImages ? 'Generating images...' : 'Generate Images'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {imagePages.map((page) => (
              <div key={page.id} className="border border-[#9DB5A5]/20 rounded-2xl p-4 bg-[#FDFCF8] space-y-3">
                <label className="field">
                  <span className="label">Prompt for image {page.pageNumber}</span>
                  <div className="flex items-center gap-2 text-xs text-[#3A3A3A]/70 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedImagePages.has(page.pageNumber)}
                      onChange={() => toggleImageSelection(page.pageNumber)}
                    />
                    <span>Select for Nano Banana rerender</span>
                  </div>
                  <textarea
                    rows={3}
                    value={page.prompt}
                    onChange={(event) => updatePrompt(page.pageNumber, event.target.value)}
                    className="w-full rounded-xl border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm"
                  />
                </label>
                <label className="field">
                  <span className="label">Image URL {page.pageNumber}</span>
                  <input
                    value={page.imageUrl}
                    onChange={(event) => updateImageUrl(page.pageNumber, event.target.value)}
                    placeholder="https://..."
                  />
                </label>
                {page.imageUrl ? (
                  <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} className="w-full h-40 object-cover rounded-xl" />
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleApproveFinal}
              disabled={!storyReady || !imagesReady}
              className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
            >
              Approve Final Story + Images
            </button>
            <button
              type="button"
              onClick={regenerateSelectedImages}
              disabled={!selectedImagePages.size || isEditingImages}
              className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
            >
              {isEditingImages ? 'Regenerating...' : 'Regenerate Selected Images'}
            </button>
            <button
              type="button"
              onClick={() => handleGenerateImages()}
              disabled={!promptsReady || isGeneratingImages}
              className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
            >
              {isGeneratingImages ? 'Regenerating all...' : 'Regenerate All Images'}
            </button>
          </div>
          <label className="field">
            <span className="label">Image edit instruction (for selected images)</span>
            <input
              value={imageEditInstruction}
              onChange={(event) => setImageEditInstruction(event.target.value)}
              placeholder="Example: Keep the guardian male, same dog breed/size, same coat colors."
            />
          </label>
        </div>
        ) : null}

        {isFinalizing ? (
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-[#2D3561]">Book Preview</h3>
              <p className="font-body text-sm text-[#3A3A3A]/70">
                Flip through the cover, title page, and story spreads as a printed book.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsFinalizing(false);
                  setImagesApproved(false);
                }}
                className="px-3 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-xs font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors"
              >
                Back to editing
              </button>
              <button
                type="button"
                onClick={() => setBookStep((prev) => Math.max(0, prev - 1))}
                disabled={bookStep === 0}
                className="px-3 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-xs font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => {
                  const maxStep = storyPages.length + 2;
                  setBookStep((prev) => Math.min(maxStep, prev + 1));
                }}
                disabled={bookStep >= storyPages.length + 2}
                className="px-3 py-2 bg-[#2D3561] text-white font-display text-xs font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
              >
                Next
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#9DB5A5]/30 bg-[#FDFCF8] p-6">
            {bookStep === 0 ? (
              <div className="space-y-4 text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-[#3A3A3A]/60">Cover</div>
                <div className="text-2xl font-display font-semibold text-[#2D3561]">{storyTitle || `${petName}'s Wag Book`}</div>
              </div>
            ) : bookStep === 1 ? (
              <div className="space-y-3 text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-[#3A3A3A]/60">Title Page</div>
                <div className="text-2xl font-display font-semibold text-[#2D3561]">{storyTitle || `${petName}'s Wag Book`}</div>
                <div className="text-sm font-body text-[#3A3A3A]/70">{coverSubtitle || `A keepsake journey for ${guardianName}`}</div>
              </div>
            ) : bookStep === storyPages.length + 2 ? (
              <div className="space-y-4 text-center">
                <div className="text-xs uppercase tracking-[0.2em] text-[#3A3A3A]/60">Dedication</div>
                <div className="text-lg font-display font-semibold text-[#2D3561]">{dedication || `Dedicated to ${petName}.`}</div>
                {personalMessage ? (
                  <div className="text-sm font-body text-[#3A3A3A]/70">{personalMessage}</div>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#3A3A3A]/60 mb-2">
                    Story Page {bookStep - 1}
                  </div>
                  <div className="text-base font-body text-[#2D3561] whitespace-pre-line leading-relaxed">
                    {storyPages[bookStep - 2]?.text || ''}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[#3A3A3A]/60 mb-2">
                    Image Page {bookStep - 1}
                  </div>
                  {imagePages[bookStep - 2]?.imageUrl ? (
                    <img
                      src={imagePages[bookStep - 2]?.imageUrl}
                      alt={`Story ${bookStep - 1}`}
                      className="w-full h-72 object-cover rounded-2xl border border-[#9DB5A5]/30"
                    />
                  ) : (
                    <div className="h-72 rounded-2xl border border-dashed border-[#9DB5A5]/40 flex items-center justify-center text-xs text-[#3A3A3A]/60">
                      Image pending
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {isSpreadStep ? (
            <div className="rounded-2xl border border-[#9DB5A5]/30 bg-white p-4 space-y-3">
              <div className="text-xs uppercase tracking-[0.2em] text-[#3A3A3A]/60">
                Edit Spread {bookStep - 1}
              </div>
              <label className="field">
                <span className="label">Story text</span>
                <textarea
                  rows={4}
                  value={storyPages[spreadIndex]?.text || ''}
                  onChange={(event) => updateStoryPage(spreadIndex + 1, event.target.value)}
                  className="w-full rounded-xl border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm"
                />
              </label>
              <label className="field">
                <span className="label">Image prompt</span>
                <textarea
                  rows={3}
                  value={imagePages[spreadIndex]?.prompt || ''}
                  onChange={(event) => updatePrompt(spreadIndex + 1, event.target.value)}
                  className="w-full rounded-xl border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm"
                />
              </label>
              <label className="field">
                <span className="label">Image URL</span>
                <input
                  value={imagePages[spreadIndex]?.imageUrl || ''}
                  onChange={(event) => updateImageUrl(spreadIndex + 1, event.target.value)}
                  placeholder="https://..."
                />
              </label>
              <button
                type="button"
                onClick={() => handleGenerateImages([imagePages[spreadIndex]], imageEditInstruction)}
                disabled={isGeneratingImages || !imagePages[spreadIndex]?.prompt?.trim()}
                className="px-3 py-2 bg-[#2D3561] text-white font-display text-xs font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
              >
                Regenerate this image
              </button>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 text-sm">
            {pdfPreviewUrl ? (
              <a href={pdfPreviewUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-[#2D3561] text-white font-display text-xs font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors">
                Open interior PDF
              </a>
            ) : null}
            {coverPreviewUrl ? (
              <a href={coverPreviewUrl} target="_blank" rel="noreferrer" className="px-3 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-xs font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors">
                Open cover PDF
              </a>
            ) : null}
          </div>
        </div>
        ) : null}

          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-[#2D3561]">5) Next Step (Pending)</h3>
                <p className="font-body text-sm text-[#3A3A3A]/70">
                  Next step will be defined after the story + images are approved.
                </p>
              </div>
              <div className="text-xs text-[#3A3A3A]/70">
                Title-only cover • 24 pages • US Letter • Hardcover case wrap
              </div>
            </div>

          <div className="rounded-xl border border-[#9DB5A5]/30 bg-[#FDFCF8] p-4">
            <h4 className="font-display text-sm font-semibold text-[#2D3561] mb-3">Final Page Order (Locked)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-[#3A3A3A]">
              {orderedPages.map((page, index) => (
                <div key={`${page.label}-${index}`} className="flex items-start gap-2">
                  <span className="font-display text-[#2D3561]">{index + 1}.</span>
                  <div>
                    <div className="font-display font-semibold">{page.label}</div>
                    <div className="text-xs text-[#3A3A3A]/70">{page.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleBuildPdf}
              disabled={!imagesApproved || isBuildingPdf}
              className="px-4 py-2 bg-[#D4AF37] text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#E5C158] transition-colors disabled:opacity-70"
            >
              {isBuildingPdf ? 'Generating PDF...' : 'Generate PDF Layout'}
            </button>
            <button
              type="button"
              onClick={handleBuildCoverPdf}
              disabled={isBuildingCover}
              className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
            >
              {isBuildingCover ? 'Generating cover...' : 'Generate Cover PDF'}
            </button>
            <Link
              to="/admin"
              className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
          {spellcheckIssues.length ? (
            <div className="rounded-xl border border-[#D4AF37]/50 bg-[#FFF6D6] p-4 text-sm text-[#3A3A3A] space-y-2">
              <div className="font-display font-semibold text-[#2D3561]">Spellcheck issues found</div>
              <ul className="list-disc pl-5 text-xs">
                {spellcheckIssues.map((issue, index) => (
                  <li key={`${issue.word}-${index}`}>
                    <strong>{issue.word}</strong> → {issue.suggestion} <em>({issue.context})</em>
                  </li>
                ))}
              </ul>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={spellcheckOverride}
                  onChange={(event) => setSpellcheckOverride(event.target.checked)}
                />
                Proceed without fixing (admin override)
              </label>
            </div>
          ) : null}
          {pdfPreviewUrl && coverPreviewUrl ? (
            <div className="rounded-xl border border-[#9DB5A5]/30 bg-[#F5F1E8] p-4 text-sm text-[#3A3A3A] space-y-2">
              <div className="font-display font-semibold text-[#2D3561]">PDF Review & Approval</div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleApprovePdfs}
                  disabled={pdfsApproved}
                  className="px-3 py-2 bg-[#2D3561] text-white font-display text-xs font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
                >
                  {pdfsApproved ? 'PDFs Approved' : 'Approve PDFs'}
                </button>
                <button
                  type="button"
                  onClick={handleSubmitToLulu}
                  disabled={!pdfsApproved || isSubmittingToLulu}
                  className="px-3 py-2 bg-[#D4AF37] text-[#2D3561] font-display text-xs font-semibold rounded-lg hover:bg-[#E5C158] transition-colors disabled:opacity-70"
                >
                  {isSubmittingToLulu ? 'Submitting...' : 'Submit to Lulu Direct'}
                </button>
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="field">
              <span className="label">Cover width (in)</span>
              <input value={coverWidthIn} onChange={(e) => setCoverWidthIn(e.target.value)} placeholder="e.g. 18.52" />
            </label>
            <label className="field">
              <span className="label">Cover height (in)</span>
              <input value={coverHeightIn} onChange={(e) => setCoverHeightIn(e.target.value)} placeholder="e.g. 12.25" />
            </label>
            <label className="field">
              <span className="label">Spine width (in)</span>
              <input value={spineWidthIn} onChange={(e) => setSpineWidthIn(e.target.value)} placeholder="e.g. 0.29" />
            </label>
            <label className="field">
              <span className="label">Bleed (in)</span>
              <input value={coverBleedIn} onChange={(e) => setCoverBleedIn(e.target.value)} />
            </label>
            <label className="field">
              <span className="label">Safe margin (in)</span>
              <input value={coverSafeIn} onChange={(e) => setCoverSafeIn(e.target.value)} />
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  const spine = Number(spineWidthIn) || 0;
                  const bleed = Number(coverBleedIn) || 0.5;
                  const width = 17 + spine + bleed * 2;
                  const height = 11 + bleed * 2;
                  setCoverWidthIn(width.toFixed(2));
                  setCoverHeightIn(height.toFixed(2));
                }}
                className="px-3 py-2 bg-[#2D3561] text-white font-display text-xs font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors"
              >
                Autofill US Letter
              </button>
            </div>
          </div>
          {pdfPreviewUrl ? (
            <div className="rounded-xl border border-[#9DB5A5]/30 bg-[#F5F1E8] p-4 text-sm text-[#3A3A3A]">
              PDF ready: <a href={pdfPreviewUrl} target="_blank" rel="noreferrer">Open PDF preview</a>
            </div>
          ) : null}
          {coverPreviewUrl ? (
            <div className="rounded-xl border border-[#9DB5A5]/30 bg-[#F5F1E8] p-4 text-sm text-[#3A3A3A]">
              Cover PDF ready: <a href={coverPreviewUrl} target="_blank" rel="noreferrer">Open cover preview</a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdminWagBook;
