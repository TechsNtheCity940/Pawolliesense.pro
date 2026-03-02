import React, { useState, useEffect, useMemo } from 'react';
import { 
  getReadings, 
  getContactMessages, 
  getResendEmailEvents,
  getKeepsakeOrders,
  updateReadingStatus,
  updateContactMessageStatus,
  updateReadingNotes,
  sendReadingResponseEmail,
  sendAllReadingResponseEmails,
  runKeepsakeFulfillment,
  updateKeepsakeOrder
} from '@/lib/database';
import { pawollieLogoUrl } from '@/lib/brand-assets';
import AdminLoginCard from '@/components/admin/AdminLoginCard';
import { useAdminSession } from '@/hooks/useAdminSession';

type TabType = 'orders' | 'quick_quests' | 'messages' | 'creative' | 'email_events';

const Admin: React.FC = () => {
  const { status, error, busy, login, logout } = useAdminSession();
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [readings, setReadings] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [emailEvents, setEmailEvents] = useState<any[]>([]);
  const [emailEventsError, setEmailEventsError] = useState<string>('');
  const [keepsakeOrders, setKeepsakeOrders] = useState<any[]>([]);
  const [keepsakeError, setKeepsakeError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
  const [savingResponses, setSavingResponses] = useState<Record<string, boolean>>({});
  const [generatingReadings, setGeneratingReadings] = useState<Record<string, boolean>>({});
  const [generatingResponses, setGeneratingResponses] = useState<Record<string, boolean>>({});
  const [repromptDrafts, setRepromptDrafts] = useState<Record<string, string>>({});
  const [sendingEmails, setSendingEmails] = useState<Record<string, boolean>>({});
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const [processingKeepsakes, setProcessingKeepsakes] = useState<Record<string, boolean>>({});
  const [processingAllKeepsakes, setProcessingAllKeepsakes] = useState(false);
  const [savingKeepsakeDrafts, setSavingKeepsakeDrafts] = useState<Record<string, boolean>>({});
  const [approvingKeepsakes, setApprovingKeepsakes] = useState<Record<string, boolean>>({});
  const [keepsakeDrafts, setKeepsakeDrafts] = useState<Record<string, {
    title: string;
    subtitle: string;
    overlay_text: string;
    back_text: string;
    generated_asset_url: string;
    keepsake_notes: string;
  }>>({});
  const [keepsakeResult, setKeepsakeResult] = useState('');
  const [sendingAllEmails, setSendingAllEmails] = useState(false);
  const [bulkEmailResult, setBulkEmailResult] = useState<string>('');

  useEffect(() => {
    if (status === 'authed') {
      loadData();
    }
    if (status !== 'authed') {
      setReadings([]);
      setMessages([]);
      setEmailEvents([]);
      setEmailEventsError('');
      setKeepsakeOrders([]);
      setKeepsakeError('');
      setExpandedOrderId(null);
      setResponseDrafts({});
      setSavingResponses({});
      setSendingEmails({});
      setEmailErrors({});
      setProcessingKeepsakes({});
      setProcessingAllKeepsakes(false);
      setSavingKeepsakeDrafts({});
      setApprovingKeepsakes({});
      setKeepsakeDrafts({});
      setKeepsakeResult('');
      setBulkEmailResult('');
      setLoading(false);
    }
  }, [status]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [readingsRes, messagesRes, eventsRes, keepsakesRes] = await Promise.all([
        getReadings(),
        getContactMessages(),
        getResendEmailEvents(250),
        getKeepsakeOrders(250),
      ]);

      if (readingsRes.data) setReadings(readingsRes.data);
      if (messagesRes.data) setMessages(messagesRes.data);
      if (eventsRes.data) setEmailEvents(eventsRes.data);
      if (eventsRes.error) {
        setEmailEventsError(eventsRes.error.message || 'Unable to load email events.');
      } else if (eventsRes.warning) {
        setEmailEventsError(eventsRes.warning);
      } else {
        setEmailEventsError('');
      }

      if (keepsakesRes.data) setKeepsakeOrders(keepsakesRes.data);
      if (keepsakesRes.error) {
        setKeepsakeError(keepsakesRes.error.message || 'Unable to load keepsake orders.');
      } else {
        setKeepsakeError('');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (readingId: string, status: string) => {
    try {
      await updateReadingStatus(readingId, status as any);
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleMessageStatusChange = async (messageId: string, status: string) => {
    try {
      await updateContactMessageStatus(messageId, status as any);
      loadData();
    } catch (error) {
      console.error('Error updating message status:', error);
    }
  };

  const handleResponseChange = (readingId: string, value: string) => {
    setResponseDrafts((prev) => ({ ...prev, [readingId]: value }));
  };

  const handleRepromptChange = (readingId: string, value: string) => {
    setRepromptDrafts((prev) => ({ ...prev, [readingId]: value }));
  };

  const handleGenerateResponse = async (readingId: string, serviceKey: string) => {
    if (!readingId) return;
    setGeneratingResponses((prev) => ({ ...prev, [readingId]: true }));
    try {
      const response = await fetch('/api/admin/generate-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingId,
          service: serviceKey,
          instruction: repromptDrafts[readingId] || ''
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Generation failed.');
      }
      if (result?.response) {
        setResponseDrafts((prev) => ({ ...prev, [readingId]: String(result.response) }));
      }
      await loadData();
    } catch (error) {
      console.error('Error generating response:', error);
    } finally {
      setGeneratingResponses((prev) => ({ ...prev, [readingId]: false }));
    }
  };

  const handleSaveResponse = async (readingId: string) => {
    if (!readingId) return;
    setSavingResponses((prev) => ({ ...prev, [readingId]: true }));
    try {
      const notes = responseDrafts[readingId] ?? '';
      const saved = await updateReadingNotes(readingId, notes);
      if (saved.error) {
        throw saved.error;
      }

      setSendingEmails((prev) => ({ ...prev, [readingId]: true }));
      const emailResult = await sendReadingResponseEmail(readingId, true);
      if (emailResult.error) {
        setEmailErrors((prev) => ({
          ...prev,
          [readingId]: emailResult.error?.message || 'Response was saved, but email delivery failed.'
        }));
      } else {
        setEmailErrors((prev) => {
          const next = { ...prev };
          delete next[readingId];
          return next;
        });
      }

      setProcessingKeepsakes((prev) => ({ ...prev, [readingId]: true }));
      const keepResult = await runKeepsakeFulfillment({ readingId, limit: 8, action: 'generate' });
      if (keepResult.error) {
        setKeepsakeResult(`Keepsake pipeline error: ${keepResult.error.message}`);
      } else if (keepResult.data && Number(keepResult.data?.processed || 0) > 0) {
        const ok = Number(keepResult.data?.succeeded || 0);
        const failed = Number(keepResult.data?.failed || 0);
        setKeepsakeResult(`Keepsakes processed: ${ok} succeeded, ${failed} failed.`);
      }

      await loadData();
    } catch (error) {
      console.error('Error saving response:', error);
      setEmailErrors((prev) => ({
        ...prev,
        [readingId]: error instanceof Error ? error.message : 'Unable to save response.'
      }));
    } finally {
      setSavingResponses((prev) => ({ ...prev, [readingId]: false }));
      setSendingEmails((prev) => ({ ...prev, [readingId]: false }));
      setProcessingKeepsakes((prev) => ({ ...prev, [readingId]: false }));
    }
  };

  const handleSendResponseEmail = async (readingId: string, force = false) => {
    if (!readingId) return;
    setSendingEmails((prev) => ({ ...prev, [readingId]: true }));
    try {
      const result = await sendReadingResponseEmail(readingId, force);
      if (result.error) {
        throw result.error;
      }
      setEmailErrors((prev) => {
        const next = { ...prev };
        delete next[readingId];
        return next;
      });
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send response email.';
      setEmailErrors((prev) => ({ ...prev, [readingId]: message }));
      console.error('Error sending response email:', error);
    } finally {
      setSendingEmails((prev) => ({ ...prev, [readingId]: false }));
    }
  };

  const handleSendAllResponses = async () => {
    setSendingAllEmails(true);
    setBulkEmailResult('');
    try {
      const result = await sendAllReadingResponseEmails(250);
      if (result.error) {
        throw result.error;
      }
      const sentCount = Number(result.data?.sent_count || 0);
      const failedCount = Number(result.data?.failed_count || 0);
      const skippedCount = Number(result.data?.skipped_count || 0);
      setBulkEmailResult(`Sent ${sentCount}. Failed ${failedCount}. Skipped ${skippedCount}.`);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send all responses.';
      setBulkEmailResult(message);
      console.error('Error sending all responses:', error);
    } finally {
      setSendingAllEmails(false);
    }
  };

  const handleRunKeepsakePipeline = async (params: {
    readingId?: string;
    keepsakeOrderId?: string;
    force?: boolean;
    action?: 'generate' | 'remake' | 'approve';
  } = {}) => {
    const key = params.keepsakeOrderId || params.readingId || 'bulk';
    setProcessingKeepsakes((prev) => ({ ...prev, [key]: true }));
    setKeepsakeResult('');
    try {
      const result = await runKeepsakeFulfillment({
        readingId: params.readingId,
        keepsakeOrderId: params.keepsakeOrderId,
        force: params.force ?? false,
        action: params.action || 'generate',
        limit: 12
      });
      if (result.error) {
        throw result.error;
      }
      const ok = Number(result.data?.succeeded || 0);
      const failed = Number(result.data?.failed || 0);
      const processed = Number(result.data?.processed || 0);
      setKeepsakeResult(`Keepsake pipeline: processed ${processed}, succeeded ${ok}, failed ${failed}.`);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to run keepsake pipeline.';
      setKeepsakeResult(message);
      console.error('Keepsake pipeline error:', error);
    } finally {
      setProcessingKeepsakes((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleRunAllKeepsakes = async () => {
    setProcessingAllKeepsakes(true);
    setKeepsakeResult('');
    try {
      const result = await runKeepsakeFulfillment({ limit: 20, action: 'generate' });
      if (result.error) {
        throw result.error;
      }
      const ok = Number(result.data?.succeeded || 0);
      const failed = Number(result.data?.failed || 0);
      const processed = Number(result.data?.processed || 0);
      setKeepsakeResult(`Keepsake pipeline: processed ${processed}, succeeded ${ok}, failed ${failed}.`);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to run keepsake pipeline.';
      setKeepsakeResult(message);
      console.error('Run all keepsakes error:', error);
    } finally {
      setProcessingAllKeepsakes(false);
    }
  };

  const handleKeepsakeDraftChange = (
    keepsakeOrderId: string,
    field: 'title' | 'subtitle' | 'overlay_text' | 'back_text' | 'generated_asset_url' | 'keepsake_notes',
    value: string
  ) => {
    setKeepsakeDrafts((prev) => ({
      ...prev,
      [keepsakeOrderId]: {
        title: prev[keepsakeOrderId]?.title || '',
        subtitle: prev[keepsakeOrderId]?.subtitle || '',
        overlay_text: prev[keepsakeOrderId]?.overlay_text || '',
        back_text: prev[keepsakeOrderId]?.back_text || '',
        generated_asset_url: prev[keepsakeOrderId]?.generated_asset_url || '',
        keepsake_notes: prev[keepsakeOrderId]?.keepsake_notes || '',
        [field]: value
      }
    }));
  };

  const handleSaveKeepsakeDraft = async (keepsakeOrderId: string) => {
    const draft = keepsakeDrafts[keepsakeOrderId];
    if (!draft) return;
    setSavingKeepsakeDrafts((prev) => ({ ...prev, [keepsakeOrderId]: true }));
    try {
      const generatedCopy = {
        title: draft.title,
        subtitle: draft.subtitle,
        overlay_text: draft.overlay_text,
        back_text: draft.back_text
      };
      const result = await updateKeepsakeOrder({
        keepsakeOrderId,
        generatedCopy,
        generatedAssetUrl: draft.generated_asset_url,
        keepsakeNotes: draft.keepsake_notes,
        status: 'awaiting_approval'
      });
      if (result.error) {
        throw result.error;
      }
      setKeepsakeResult('Keepsake adjustments saved.');
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save keepsake adjustments.';
      setKeepsakeResult(message);
      console.error('Save keepsake draft error:', error);
    } finally {
      setSavingKeepsakeDrafts((prev) => ({ ...prev, [keepsakeOrderId]: false }));
    }
  };

  const handleApproveKeepsake = async (keepsakeOrderId: string) => {
    setApprovingKeepsakes((prev) => ({ ...prev, [keepsakeOrderId]: true }));
    try {
      const result = await runKeepsakeFulfillment({
        keepsakeOrderId,
        action: 'approve',
        force: true,
        limit: 1
      });
      if (result.error) {
        throw result.error;
      }
      setKeepsakeResult('Keepsake approved and sent to Shopify draft order.');
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to approve keepsake.';
      setKeepsakeResult(message);
      console.error('Approve keepsake error:', error);
    } finally {
      setApprovingKeepsakes((prev) => ({ ...prev, [keepsakeOrderId]: false }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'unread': return 'bg-yellow-100 text-yellow-800';
      case 'read': return 'bg-blue-100 text-blue-800';
      case 'replied': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKeepsakeStatusColor = (status: string) => {
    switch (String(status || '').toLowerCase()) {
      case 'queued': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'awaiting_approval': return 'bg-indigo-100 text-indigo-800';
      case 'shopify_draft_created': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-green-100 text-green-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => (
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  );

  const parseAdditionalNotes = (raw: any) => {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  };

  const parseJsonObject = (raw: any) => {
    if (!raw) return {};
    if (typeof raw === 'object') return raw;
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  };

  const getPetField = (reading: any, field: 'species' | 'breed' | 'age' | 'gender') => {
    const pet = reading?.pets || {};
    const extra = parseAdditionalNotes(pet.additional_notes);
    const value = {
      species: pet.species || extra.species || extra.pet_species || '',
      breed: pet.breed || extra.breed || extra.pet_breed || '',
      age: pet.age || extra.age || extra.pet_age || '',
      gender: pet.gender || extra.sex || extra.gender || extra.pet_gender || ''
    }[field];
    return String(value || '').trim() || 'N/A';
  };

  const getEmailDeliveryText = (reading: any) => {
    if (reading?.response_email_sent_at) {
      return `Email sent: ${formatDate(reading.response_email_sent_at)}`;
    }
    if (reading?.response_email_last_error) {
      return `Email failed: ${reading.response_email_last_error}`;
    }
    return 'Email not sent yet';
  };

  const formatEmailEventType = (eventType?: string) => {
    const value = String(eventType || '').trim();
    if (!value) return 'Unknown';
    const normalized = value.replace(/^email\./, '').replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const getEmailEventBadgeClass = (eventType?: string) => {
    const value = String(eventType || '').toLowerCase();
    if (value.includes('delivered') || value.includes('sent') || value.includes('opened') || value.includes('clicked')) {
      return 'bg-green-100 text-green-800';
    }
    if (value.includes('failed') || value.includes('bounced') || value.includes('complained') || value.includes('suppressed')) {
      return 'bg-red-100 text-red-800';
    }
    if (value.includes('delayed')) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const normalizeServiceKey = (service: string) => service.trim().toLowerCase();

  const SERVICE_LABELS: Record<string, string> = {
    'paw-reading': 'Paw Reading - Emotional and Energetic Insight',
    'behavior-insight': 'Behavior and Aura Paw-file',
    'spirit-profile': 'Soul Discovery - Soul Role and Bond Meaning',
    'birth-chart': 'Pet Birth Chart - Symbolic Personality Mapping',
    'past-life': 'Past Life / Continuity Session',
    'memorial': 'Memorial Reading',
    'digital-memorial': 'Digital Memorial Page',
    'pawmarks-pack': 'Pawmarks Pack - Legacy and Transition Insight',
    'combone-pack': 'Combone Pack - Full Pawollie Experience',
    'furmily-pack': 'Furmily Pack (Household Soul Discovery + Aura Paw-file)',
    'pupdate-solo': 'Pawsitive Pupdate (Solo)',
    'pupdate-add': 'Pawsitive Pupdate (Add-on)',
    'pawollie-vision-photo': 'Pawollie Vision Photo',
    'full_spirit_pawfile': 'Full Spirit Pawfile',
    'behavior_bond_guidance': 'Behavior Bond Guidance',
    'pawmarks_pack': 'Pawmarks Pack (Memorial and Keepsake Experience)',
    'pawmark_post': 'Pawmark Post (Memorial Feed Post Only)',
    'star_chart': 'Star Chart (Pet Astrology Insight)',
    'paw_reading': 'Paw Reading (Pawprint Insight)',
    'pawollie_vision': 'Pawollie Vision (Spirit Portrait)',
    'express_pawdate': 'Express Pawdate',
    'quick_quest': 'Quick Quest (One Question Insight)',
    'bond_spark': 'Bond Spark (Mini Insight)',
    'all_paws_pack': 'All-Paws Pack (Every Service Included)',
    'furmily_pack': 'Furmily Pack (Multi-Pet Household Pack)',
    'full_soul_profile': 'Full Soul Discovery Profile',
    'behavior_spirit_scan': 'Personality and Behavior Spirit Scan',
    'canine_birth_chart': 'Canine Birth Chart',
    'past_life_pawprint': 'Past-Life Pawprint Reading',
    'pawollie_vision_photo': 'Pawollie Vision Photo',
    'pawsitive_pupdate': 'Pawsitive Pupdate (Daily)',
    'pawollie_vision_daily': 'Pawollie Vision (Daily)'
  };

  const QUICK_QUEST_KEYS = new Set([
    'quick_quest',
    'express_pawdate',
    'bond_spark',
    'quick-quest',
    'express-pawdate',
    'bond-spark'
  ]);

  const MEMORIAL_KEYS = new Set([
    'pawmarks-pack',
    'pawmarks_pack',
    'pawmark_post',
    'memorial',
    'digital-memorial',
    'digital_memorial'
  ]);

  const PORTRAIT_KEYS = new Set([
    'pawollie_vision',
    'pawollie-vision',
    'pawollie_vision_photo',
    'pawollie-vision-photo',
    'pawollie-vision-daily'
  ]);

  const PAW_READING_KEYS = new Set([
    'paw_reading',
    'paw-reading',
    'pawprint',
    'pawprint-reading'
  ]);

  const STAR_CHART_KEYS = new Set([
    'star_chart',
    'star-chart',
    'birth-chart',
    'birth_chart',
    'canine_birth_chart'
  ]);

  const WAGBOOK_KEYWORDS = [
    'printed_book',
    'printed book',
    'storybook',
    'storybook pdf',
    'wag book',
    'wagbook',
    'keepsake book'
  ];

  const hasService = (reading: any, keys: Set<string>) => {
    const services = Array.isArray(reading?.services) ? reading.services : [];
    return services.some((service: string) => keys.has(normalizeServiceKey(service)));
  };

  const hasAnyService = (reading: any, keys: Set<string>) => hasService(reading, keys);

  const hasWagBook = (reading: any) => {
    const keepsakes = Array.isArray(reading?.keepsakes) ? reading.keepsakes : [];
    const text = [
      reading?.notes,
      reading?.pets?.additional_notes,
      reading?.keepsake_notes,
      reading?.wagbook_storyline,
      reading?.wagbook_character_names
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return (
      Boolean(reading?.wagbook_requested) ||
      keepsakes.some((item: string) => WAGBOOK_KEYWORDS.includes(String(item).toLowerCase())) ||
      WAGBOOK_KEYWORDS.some((keyword) => text.includes(keyword)) ||
      (hasService(reading, MEMORIAL_KEYS) && text.includes('book'))
    );
  };

  const handleGenerateReading = async (readingId: string, type: 'paw_reading' | 'star_chart') => {
    if (!readingId) return;
    setGeneratingReadings((prev) => ({ ...prev, [`${readingId}_${type}`]: true }));
    try {
      const response = await fetch('/api/admin/generate-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingId, type })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Generation failed.');
      }
      await loadData();
    } catch (error) {
      console.error('Error generating reading:', error);
    } finally {
      setGeneratingReadings((prev) => ({ ...prev, [`${readingId}_${type}`]: false }));
    }
  };

  const getServiceNames = (services: string[]) => {
    return services
      .map((service) => SERVICE_LABELS[normalizeServiceKey(service)] || service)
      .join(', ');
  };

  const totalSales = useMemo(() => (
    readings.reduce((sum, reading) => sum + (Number(reading.total_price) || 0), 0)
  ), [readings]);

  const completedSales = useMemo(() => (
    readings
      .filter((reading) => reading.status === 'completed')
      .reduce((sum, reading) => sum + (Number(reading.total_price) || 0), 0)
  ), [readings]);

  const pendingOrders = useMemo(
    () => readings.filter((reading) => reading.status === 'pending'),
    [readings]
  );

  const completedOrders = useMemo(
    () => readings.filter((reading) => reading.status === 'completed'),
    [readings]
  );

  const unsentResponseCount = useMemo(
    () => readings.filter((reading) => String(reading?.notes || '').trim() && !reading?.response_email_sent_at).length,
    [readings]
  );

  const quickQuestOrders = useMemo(
    () => readings.filter((reading) => hasService(reading, QUICK_QUEST_KEYS)),
    [readings]
  );

  const memorialOrders = useMemo(
    () => readings.filter((reading) => hasService(reading, MEMORIAL_KEYS) || reading?.pets?.is_memorial),
    [readings]
  );

  const portraitOrders = useMemo(
    () => readings.filter((reading) => hasService(reading, PORTRAIT_KEYS)),
    [readings]
  );

  const keepsakePipelineOrders = useMemo(
    () => keepsakeOrders.filter((order) => {
      const type = String(order?.keepsake_type || '').toLowerCase();
      return ['memorial_print', 'chart_certificate', 'apparel', 'tag_ornament'].includes(type);
    }),
    [keepsakeOrders]
  );

  const readingLookup = useMemo(() => (
    new Map(readings.map((reading) => [String(reading?.id || ''), reading]))
  ), [readings]);

  const deliveredEmailEvents = useMemo(
    () => emailEvents.filter((event) => String(event?.event_type || '').toLowerCase() === 'email.delivered').length,
    [emailEvents]
  );

  const failedEmailEvents = useMemo(
    () => emailEvents.filter((event) => {
      const type = String(event?.event_type || '').toLowerCase();
      return ['email.failed', 'email.bounced', 'email.complained', 'email.suppressed'].includes(type);
    }).length,
    [emailEvents]
  );

  useEffect(() => {
    setResponseDrafts((prev) => {
      const next = { ...prev };
      let changed = false;
      readings.forEach((reading) => {
        const id = String(reading?.id ?? '');
        if (!id || next[id] !== undefined) return;
        if (reading?.notes) {
          next[id] = String(reading.notes);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [readings]);

  useEffect(() => {
    setKeepsakeDrafts((prev) => {
      const next = { ...prev };
      let changed = false;
      keepsakeOrders.forEach((order) => {
        const id = String(order?.id || '');
        if (!id || next[id]) return;
        const copy = parseJsonObject(order?.generated_copy);
        const customization = parseJsonObject(order?.customization);
        next[id] = {
          title: String(copy?.title || ''),
          subtitle: String(copy?.subtitle || ''),
          overlay_text: String(copy?.overlay_text || ''),
          back_text: String(copy?.back_text || ''),
          generated_asset_url: String(order?.generated_asset_url || ''),
          keepsake_notes: String(customization?.keepsake_notes || '')
        };
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [keepsakeOrders]);

  const tabLabels: Record<TabType, string> = {
    orders: 'Orders',
    quick_quests: 'Quick Quests',
    messages: 'Messages',
    creative: 'Creatives',
    email_events: 'Email Events'
  };
  if (status !== 'authed') {
    return (
      <AdminLoginCard
        title="Admin Access"
        description="This area is reserved for authorized administrators."
        error={error}
        busy={busy}
        onLogin={login}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      {/* Header */}
      <header className="bg-[#2D3561] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={pawollieLogoUrl}
                alt="Pawollie Sense"
                className="h-12 w-12 rounded-full"
              />
              <div>
                <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>
                <p className="font-body text-white/70 text-sm">Pawollie Sense Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 border border-white/30 text-white font-display font-semibold rounded-full hover:bg-white/10 transition-colors"
              >
                Sign out
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-[#D4AF37] text-[#2D3561] font-display font-semibold rounded-full hover:bg-[#E5C158] transition-colors"
              >
                Back to Site
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[#3A3A3A]/70 text-sm">Total Sales</p>
                <p className="font-display text-3xl font-bold text-[#2D3561]">{formatCurrency(totalSales)}</p>
                <p className="font-body text-xs text-[#3A3A3A]/60 mt-1">
                  Completed {formatCurrency(completedSales)}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8zm0 0V6m0 9v2m6-5a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[#3A3A3A]/70 text-sm">Pending Orders</p>
                <p className="font-display text-3xl font-bold text-yellow-600">
                  {pendingOrders.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[#3A3A3A]/70 text-sm">Completed Orders</p>
                <p className="font-display text-3xl font-bold text-green-600">{completedOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[#3A3A3A]/70 text-sm">Quick Quests</p>
                <p className="font-display text-3xl font-bold text-[#2D3561]">{quickQuestOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#2D3561]/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#2D3561]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m-7 4h8a3 3 0 003-3V7a3 3 0 00-3-3H8a3 3 0 00-3 3v10a3 3 0 003 3z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[#3A3A3A]/70 text-sm">Messages</p>
                <p className="font-display text-3xl font-bold text-[#2D3561]">{messages.length}</p>
              </div>
              <div className="w-12 h-12 bg-[#9DB5A5]/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#9DB5A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[#3A3A3A]/70 text-sm">Email Events</p>
                <p className="font-display text-3xl font-bold text-[#2D3561]">{emailEvents.length}</p>
                <p className="font-body text-xs text-red-600 mt-1">
                  Failed {failedEmailEvents}
                </p>
              </div>
              <div className="w-12 h-12 bg-[#2D3561]/10 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-[#2D3561]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M8 12h8m-8 7h8M5 5l1.5 16h11L19 5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className="bg-white rounded-2xl p-5 shadow-lg text-left hover:shadow-xl transition-shadow"
          >
            <p className="font-body text-[#3A3A3A]/70 text-sm">Queue</p>
            <p className="font-display text-lg font-semibold text-[#2D3561]">Review Orders</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quick_quests')}
            className="bg-white rounded-2xl p-5 shadow-lg text-left hover:shadow-xl transition-shadow"
          >
            <p className="font-body text-[#3A3A3A]/70 text-sm">Quick Quests</p>
            <p className="font-display text-lg font-semibold text-[#2D3561]">Deliver Fast Responses</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className="bg-white rounded-2xl p-5 shadow-lg text-left hover:shadow-xl transition-shadow"
          >
            <p className="font-body text-[#3A3A3A]/70 text-sm">Inbox</p>
            <p className="font-display text-lg font-semibold text-[#2D3561]">Respond to Messages</p>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('email_events')}
            className="bg-white rounded-2xl p-5 shadow-lg text-left hover:shadow-xl transition-shadow"
          >
            <p className="font-body text-[#3A3A3A]/70 text-sm">Delivery</p>
            <p className="font-display text-lg font-semibold text-[#2D3561]">View Email Events</p>
          </button>
          <a
            href="/admin/pawmarks/new"
            className="bg-white rounded-2xl p-5 shadow-lg text-left hover:shadow-xl transition-shadow"
          >
            <p className="font-body text-[#3A3A3A]/70 text-sm">Pawmarks</p>
            <p className="font-display text-lg font-semibold text-[#2D3561]">Create Pawmark Profile</p>
          </a>
          <a
            href="/admin/pawmarks/manage"
            className="bg-white rounded-2xl p-5 shadow-lg text-left hover:shadow-xl transition-shadow"
          >
            <p className="font-body text-[#3A3A3A]/70 text-sm">Pawmarks</p>
            <p className="font-display text-lg font-semibold text-[#2D3561]">Edit Existing Pawmarks</p>
          </a>
          <a
            href="/admin/media"
            className="bg-white rounded-2xl p-5 shadow-lg text-left hover:shadow-xl transition-shadow"
          >
            <p className="font-body text-[#3A3A3A]/70 text-sm">Media</p>
            <p className="font-display text-lg font-semibold text-[#2D3561]">Browse Uploaded Pet Photos</p>
          </a>
          <a
            href="/admin/wagbook"
            className="bg-white rounded-2xl p-5 shadow-lg text-left hover:shadow-xl transition-shadow"
          >
            <p className="font-body text-[#3A3A3A]/70 text-sm">Wag Book</p>
            <p className="font-display text-lg font-semibold text-[#2D3561]">Generate Keepsake Book</p>
          </a>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-[#9DB5A5]/20">
            <nav className="flex">
              {(['orders', 'quick_quests', 'messages', 'email_events', 'creative'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-display font-semibold transition-colors ${
                    activeTab === tab
                      ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                      : 'text-[#3A3A3A]/70 hover:text-[#2D3561]'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </nav>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <svg className="animate-spin h-8 w-8 mx-auto text-[#D4AF37]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="mt-4 font-body text-[#3A3A3A]/70">Loading...</p>
            </div>
          ) : (
            <div className="p-6">
              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#9DB5A5]/20 bg-[#F5F1E8] p-4">
                    <p className="font-body text-sm text-[#3A3A3A]">
                      <strong>Unsent responses:</strong> {unsentResponseCount}
                    </p>
                    <button
                      type="button"
                      onClick={handleSendAllResponses}
                      disabled={sendingAllEmails || unsentResponseCount === 0}
                      className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-60"
                    >
                      {sendingAllEmails ? 'Sending...' : 'Send All Responses'}
                    </button>
                  </div>
                  {bulkEmailResult ? (
                    <p className="font-body text-xs text-[#3A3A3A]/80">{bulkEmailResult}</p>
                  ) : null}
                  {readings.length === 0 ? (
                    <p className="text-center font-body text-[#3A3A3A]/70 py-8">No orders yet.</p>
                  ) : (
                    readings.map((reading) => {
                      const orderId = String(reading?.id ?? '');
                      const status = reading?.status || 'pending';
                      const isExpanded = expandedOrderId === orderId;
                      const total = formatCurrency(Number(reading?.total_price) || 0);
                      const completedLabel = reading?.completed_at
                        ? formatDate(reading.completed_at)
                        : 'Not completed';
                      const wagBookEligible = hasWagBook(reading);
                      const isSendingEmail = Boolean(sendingEmails[orderId]);
                      const emailError = emailErrors[orderId] || '';

                      return (
                        <div
                          key={orderId || reading.created_at}
                          className="border border-[#9DB5A5]/20 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-display text-lg font-bold text-[#2D3561]">
                                  {reading.pets?.name || 'Unknown Pet'}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                                  {status}
                                </span>
                              </div>
                              <p className="font-body text-sm text-[#3A3A3A]">
                                <strong>Customer:</strong> {reading.customers?.first_name} {reading.customers?.last_name}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]">
                                <strong>Email:</strong> {reading.customers?.email}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]">
                                <strong>Services:</strong> {getServiceNames(reading.services || [])}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]/70 mt-1">
                                Ordered: {formatDate(reading.created_at)}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]/70">
                                Completed: {completedLabel}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]/70">
                                {getEmailDeliveryText(reading)}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]/70">
                                Keepsakes: {reading?.keepsake_status || 'none'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="font-display text-xl font-bold text-[#D4AF37]">
                                {total}
                              </p>
                              <select
                                value={status}
                                onChange={(e) => handleStatusChange(reading.id, e.target.value)}
                                className="px-3 py-2 rounded-lg border border-[#9DB5A5]/30 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <button
                                onClick={() => setExpandedOrderId(isExpanded ? null : orderId)}
                                className="text-sm font-display text-[#2D3561] hover:text-[#D4AF37] transition-colors"
                              >
                                {isExpanded ? 'Hide Details' : 'View Details'}
                              </button>
                              {wagBookEligible ? (
                                <a
                                  href={`/admin/wagbook?orderId=${orderId}`}
                                  className="text-sm font-display text-[#2D3561] hover:text-[#D4AF37] transition-colors"
                                >
                                  Create Wag Book
                                </a>
                              ) : null}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-[#9DB5A5]/20 grid md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-display font-semibold text-[#2D3561] mb-2">Order Info</h4>
                                <div className="font-body text-sm text-[#3A3A3A] space-y-1">
                                  <p><strong>Order ID:</strong> {orderId || 'N/A'}</p>
                                  <p><strong>Total:</strong> {total}</p>
                                  <p><strong>Ordered:</strong> {formatDate(reading.created_at)}</p>
                                  <p><strong>Completed:</strong> {completedLabel}</p>
                                  <p><strong>Services:</strong> {getServiceNames(reading.services || [])}</p>
                                  <p><strong>Email delivery:</strong> {getEmailDeliveryText(reading)}</p>
                                  <p><strong>Keepsake pipeline:</strong> {reading?.keepsake_status || 'none'}</p>
                                  {reading?.keepsake_last_error ? (
                                    <p><strong>Keepsake error:</strong> {reading.keepsake_last_error}</p>
                                  ) : null}
                                  {reading?.response_email_provider ? (
                                    <p><strong>Email provider:</strong> {reading.response_email_provider}</p>
                                  ) : null}
                                  {reading?.response_email_sent_to ? (
                                    <p><strong>Delivered to:</strong> {reading.response_email_sent_to}</p>
                                  ) : null}
                                </div>
                                {wagBookEligible ? (
                                  <a
                                    href={`/admin/wagbook?orderId=${orderId}`}
                                    className="inline-flex mt-3 px-3 py-2 bg-[#2D3561] text-white font-display text-xs font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors"
                                  >
                                    Open Wag Book Pipeline
                                  </a>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => handleRunKeepsakePipeline({ readingId: orderId })}
                                  disabled={Boolean(processingKeepsakes[orderId])}
                                  className="inline-flex mt-3 ml-2 px-3 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-xs font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
                                >
                                  {processingKeepsakes[orderId] ? 'Processing Keepsakes...' : 'Run Keepsake Pipeline'}
                                </button>
                              </div>
                              <div>
                                <h4 className="font-display font-semibold text-[#2D3561] mb-2">AI Reading Tools</h4>
                                <div className="flex flex-wrap gap-2">
                                  {hasAnyService(reading, PAW_READING_KEYS) ? (
                                    <button
                                      type="button"
                                      onClick={() => handleGenerateReading(orderId, 'paw_reading')}
                                      disabled={Boolean(generatingReadings[`${orderId}_paw_reading`])}
                                      className="px-3 py-2 bg-[#2D3561] text-white font-display text-xs font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
                                    >
                                      {generatingReadings[`${orderId}_paw_reading`] ? 'Generating Paw Reading...' : 'Generate Paw Reading'}
                                    </button>
                                  ) : null}
                                  {hasAnyService(reading, STAR_CHART_KEYS) ? (
                                    <button
                                      type="button"
                                      onClick={() => handleGenerateReading(orderId, 'star_chart')}
                                      disabled={Boolean(generatingReadings[`${orderId}_star_chart`])}
                                      className="px-3 py-2 bg-[#D4AF37] text-[#2D3561] font-display text-xs font-semibold rounded-lg hover:bg-[#E5C158] transition-colors disabled:opacity-70"
                                    >
                                      {generatingReadings[`${orderId}_star_chart`] ? 'Generating Star Chart...' : 'Generate Star Chart'}
                                    </button>
                                  ) : null}
                                  {!hasAnyService(reading, PAW_READING_KEYS) && !hasAnyService(reading, STAR_CHART_KEYS) ? (
                                    <span className="text-xs text-[#3A3A3A]/70">No AI-generated services selected.</span>
                                  ) : null}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-display font-semibold text-[#2D3561] mb-2">Customer</h4>
                                <div className="font-body text-sm text-[#3A3A3A] space-y-1">
                                  <p><strong>Name:</strong> {reading.customers?.first_name} {reading.customers?.last_name}</p>
                                  <p><strong>Email:</strong> {reading.customers?.email}</p>
                                  {reading.customers?.phone ? (
                                    <p><strong>Phone:</strong> {reading.customers.phone}</p>
                                  ) : null}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-display font-semibold text-[#2D3561] mb-2">Pet Details</h4>
                                <div className="font-body text-sm text-[#3A3A3A] space-y-1">
                                  <p><strong>Species:</strong> {getPetField(reading, 'species')}</p>
                                  <p><strong>Breed:</strong> {getPetField(reading, 'breed')}</p>
                                  <p><strong>Age:</strong> {getPetField(reading, 'age')}</p>
                                  <p><strong>Gender:</strong> {getPetField(reading, 'gender')}</p>
                                  {reading.pets?.is_memorial && (
                                    <p className="text-red-600"><strong>Memorial Request</strong></p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-display font-semibold text-[#2D3561] mb-2">Personality</h4>
                                <p className="font-body text-sm text-[#3A3A3A]">
                                  {reading.pets?.personality_description || 'No description provided'}
                                </p>
                              </div>
                              {reading.pets?.behavior_concerns && (
                                <div className="md:col-span-2">
                                  <h4 className="font-display font-semibold text-[#2D3561] mb-2">Behavior Concerns</h4>
                                  <p className="font-body text-sm text-[#3A3A3A]">{reading.pets.behavior_concerns}</p>
                                </div>
                              )}
                              {reading.pets?.bond_description && (
                                <div className="md:col-span-2">
                                  <h4 className="font-display font-semibold text-[#2D3561] mb-2">Bond Description</h4>
                                  <p className="font-body text-sm text-[#3A3A3A]">{reading.pets.bond_description}</p>
                                </div>
                              )}
                              {reading.pets?.additional_notes && (
                                <div className="md:col-span-2">
                                  <h4 className="font-display font-semibold text-[#2D3561] mb-2">Additional Notes</h4>
                                  <p className="font-body text-sm text-[#3A3A3A]">{reading.pets.additional_notes}</p>
                                </div>
                              )}
                              <div className="md:col-span-2">
                                <h4 className="font-display font-semibold text-[#2D3561] mb-2">Admin Response</h4>
                                <textarea
                                  rows={4}
                                  value={responseDrafts[String(reading?.id ?? '')] ?? reading?.notes ?? ''}
                                  onChange={(event) => handleResponseChange(String(reading?.id ?? ''), event.target.value)}
                                  className="w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                                  placeholder="Generate or edit the response here..."
                                />
                                <label className="font-body text-xs text-[#3A3A3A]/70 mt-3 block">
                                  Reprompt instructions (optional)
                                </label>
                                <textarea
                                  rows={2}
                                  value={repromptDrafts[String(reading?.id ?? '')] ?? ''}
                                  onChange={(event) => handleRepromptChange(String(reading?.id ?? ''), event.target.value)}
                                  className="w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-xs focus:outline-none focus:border-[#D4AF37]"
                                  placeholder="Example: Shorter, more grounded, focus on bond and routines."
                                />
                                <div className="flex items-center justify-end mt-3 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleGenerateResponse(String(reading?.id ?? ''), (reading?.services?.[0] || 'paw_reading'))}
                                    disabled={Boolean(generatingResponses[String(reading?.id ?? '')])}
                                    className="px-4 py-2 border border-[#2D3561]/40 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
                                  >
                                    {generatingResponses[String(reading?.id ?? '')] ? 'Generating...' : 'Generate AI'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSaveResponse(String(reading?.id ?? ''))}
                                    disabled={Boolean(savingResponses[String(reading?.id ?? '')]) || isSendingEmail}
                                    className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
                                  >
                                    {savingResponses[String(reading?.id ?? '')] ? 'Saving...' : 'Save + Send'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSendResponseEmail(orderId, true)}
                                    disabled={isSendingEmail}
                                    className="px-4 py-2 border border-[#2D3561]/40 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
                                  >
                                    {isSendingEmail
                                      ? 'Sending...'
                                      : (reading?.response_email_sent_at ? 'Resend Email' : 'Send Email')}
                                  </button>
                                </div>
                                {emailError ? (
                                  <p className="mt-2 font-body text-xs text-red-600">{emailError}</p>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Quick Quests Tab */}
              {activeTab === 'quick_quests' && (
                <div className="space-y-4">
                  {quickQuestOrders.length === 0 ? (
                    <p className="text-center font-body text-[#3A3A3A]/70 py-8">No quick quests yet.</p>
                  ) : (
                    quickQuestOrders.map((reading) => {
                      const orderId = String(reading?.id ?? '');
                      const status = reading?.status || 'pending';
                      const services = Array.isArray(reading?.services) ? reading.services : [];
                      const quickServices = services.filter((service: string) => (
                        QUICK_QUEST_KEYS.has(normalizeServiceKey(service))
                      ));
                      const serviceLabel = quickServices.length ? getServiceNames(quickServices) : getServiceNames(services);
                      const responseValue = responseDrafts[orderId] ?? reading?.notes ?? '';
                      const isSaving = savingResponses[orderId];
                      const isGenerating = generatingResponses[orderId];
                      const isSendingEmail = Boolean(sendingEmails[orderId]);
                      const emailError = emailErrors[orderId] || '';
                      const repromptValue = repromptDrafts[orderId] ?? '';

                      return (
                        <div
                          key={orderId || reading.created_at}
                          className="border border-[#9DB5A5]/20 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-display text-lg font-bold text-[#2D3561]">
                                  {reading.pets?.name || 'Unknown Pet'}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
                                  {status}
                                </span>
                              </div>
                              <p className="font-body text-sm text-[#3A3A3A]">
                                <strong>Customer:</strong> {reading.customers?.first_name} {reading.customers?.last_name}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]">
                                <strong>Email:</strong> {reading.customers?.email}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]">
                                <strong>Service:</strong> {serviceLabel}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]/70 mt-1">
                                Ordered: {formatDate(reading.created_at)}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]/70">
                                Completed: {reading?.completed_at ? formatDate(reading.completed_at) : 'Not completed'}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A]/70">
                                {getEmailDeliveryText(reading)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="font-display text-xl font-bold text-[#D4AF37]">
                                {formatCurrency(Number(reading?.total_price) || 0)}
                              </p>
                              <select
                                value={status}
                                onChange={(e) => handleStatusChange(reading.id, e.target.value)}
                                className="px-3 py-2 rounded-lg border border-[#9DB5A5]/30 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-[#9DB5A5]/20">
                            <h4 className="font-display font-semibold text-[#2D3561] mb-2">Request / Question</h4>
                            <p className="font-body text-sm text-[#3A3A3A]">
                              {reading.pets?.additional_notes || 'No request details captured yet.'}
                            </p>

                            <h4 className="font-display font-semibold text-[#2D3561] mt-4 mb-2">Response Given</h4>
                            <textarea
                              rows={4}
                              value={responseValue}
                              onChange={(event) => handleResponseChange(orderId, event.target.value)}
                              className="w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                              placeholder="Write the quick quest response here..."
                            />
                            <label className="font-body text-xs text-[#3A3A3A]/70 mt-3 block">
                              Reprompt instructions (optional)
                            </label>
                            <textarea
                              rows={2}
                              value={repromptValue}
                              onChange={(event) => handleRepromptChange(orderId, event.target.value)}
                              className="w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-xs focus:outline-none focus:border-[#D4AF37]"
                              placeholder="Example: Make it shorter and more grounded, add 3 actionable steps."
                            />
                            <div className="flex items-center justify-end mt-3 gap-2">
                              <button
                                type="button"
                                onClick={() => handleGenerateResponse(orderId, services[0] || 'quick_quest')}
                                disabled={Boolean(isGenerating)}
                                className="px-4 py-2 border border-[#2D3561]/40 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
                              >
                                {isGenerating ? 'Generating...' : 'Generate AI'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveResponse(orderId)}
                                disabled={Boolean(isSaving) || isSendingEmail}
                                className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
                              >
                                {isSaving ? 'Saving...' : 'Save + Send'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSendResponseEmail(orderId, true)}
                                disabled={isSendingEmail}
                                className="px-4 py-2 border border-[#2D3561]/40 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
                              >
                                {isSendingEmail
                                  ? 'Sending...'
                                  : (reading?.response_email_sent_at ? 'Resend Email' : 'Send Email')}
                              </button>
                            </div>
                            {emailError ? (
                              <p className="mt-2 font-body text-xs text-red-600">{emailError}</p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Messages Tab */}
              {activeTab === 'messages' && (
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center font-body text-[#3A3A3A]/70 py-8">No messages received yet.</p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className="border border-[#9DB5A5]/20 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-display text-lg font-bold text-[#2D3561]">
                                {message.subject}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(message.status)}`}>
                                {message.status}
                              </span>
                            </div>
                            <p className="font-body text-sm text-[#3A3A3A]">
                              <strong>From:</strong> {message.name} ({message.email})
                            </p>
                            <p className="font-body text-sm text-[#3A3A3A] mt-2">
                              {message.message}
                            </p>
                            <p className="font-body text-sm text-[#3A3A3A]/70 mt-2">
                              Received: {formatDate(message.created_at)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <select
                              value={message.status}
                              onChange={(e) => handleMessageStatusChange(message.id, e.target.value)}
                              className="px-3 py-2 rounded-lg border border-[#9DB5A5]/30 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                            >
                              <option value="unread">Unread</option>
                              <option value="read">Read</option>
                              <option value="replied">Replied</option>
                              <option value="archived">Archived</option>
                            </select>
                            <a
                              href={`mailto:${message.email}?subject=Re: ${message.subject}`}
                              className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors text-center"
                            >
                              Reply
                            </a>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Email Events Tab */}
              {activeTab === 'email_events' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-[#9DB5A5]/20 p-4 bg-[#F5F1E8]">
                      <p className="font-body text-xs text-[#3A3A3A]/70">Tracked events</p>
                      <p className="font-display text-2xl font-bold text-[#2D3561]">{emailEvents.length}</p>
                    </div>
                    <div className="rounded-xl border border-[#9DB5A5]/20 p-4 bg-[#F5F1E8]">
                      <p className="font-body text-xs text-[#3A3A3A]/70">Delivered</p>
                      <p className="font-display text-2xl font-bold text-green-700">{deliveredEmailEvents}</p>
                    </div>
                    <div className="rounded-xl border border-[#9DB5A5]/20 p-4 bg-[#F5F1E8]">
                      <p className="font-body text-xs text-[#3A3A3A]/70">Failures / suppressions</p>
                      <p className="font-display text-2xl font-bold text-red-700">{failedEmailEvents}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="font-body text-sm text-[#3A3A3A]/80">
                      Webhook log from Resend. Refresh to pull latest events.
                    </p>
                    <button
                      type="button"
                      onClick={loadData}
                      className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors"
                    >
                      Refresh Events
                    </button>
                  </div>

                  {emailEventsError ? (
                    <p className="font-body text-sm text-red-600">{emailEventsError}</p>
                  ) : null}

                  {emailEvents.length === 0 ? (
                    <p className="text-center font-body text-[#3A3A3A]/70 py-8">No email events logged yet.</p>
                  ) : (
                    emailEvents.map((eventRow) => {
                      const readingId = String(eventRow?.reading_id || '').trim();
                      const reading = readingLookup.get(readingId);
                      const petName = reading?.pets?.name || 'Unknown Pet';
                      const customerName = [reading?.customers?.first_name, reading?.customers?.last_name]
                        .filter(Boolean)
                        .join(' ')
                        .trim() || 'Unknown Customer';
                      return (
                        <div
                          key={eventRow.id || `${eventRow.svix_id}-${eventRow.created_at}`}
                          className="border border-[#9DB5A5]/20 rounded-xl p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-display text-base font-bold text-[#2D3561]">
                                  {formatEmailEventType(eventRow.event_type)}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEmailEventBadgeClass(eventRow.event_type)}`}>
                                  {String(eventRow.event_type || 'unknown')}
                                </span>
                              </div>
                              <p className="font-body text-sm text-[#3A3A3A] break-all">
                                <strong>Recipient:</strong> {eventRow.recipient_email || 'N/A'}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A] break-all">
                                <strong>Email ID:</strong> {eventRow.email_id || 'N/A'}
                              </p>
                              <p className="font-body text-sm text-[#3A3A3A] break-all">
                                <strong>Reading ID:</strong> {readingId || 'N/A'}
                              </p>
                              {readingId ? (
                                <p className="font-body text-sm text-[#3A3A3A]">
                                  <strong>Order:</strong> {petName} ({customerName})
                                </p>
                              ) : null}
                            </div>
                            <div className="text-sm text-[#3A3A3A]/80">
                              <p><strong>Event time:</strong> {formatDate(eventRow.event_created_at || eventRow.created_at)}</p>
                              <p><strong>Logged:</strong> {formatDate(eventRow.created_at)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Creative Tab */}
              {activeTab === 'creative' && (
                <div className="space-y-8">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-display text-xl font-semibold text-[#2D3561]">Memorial + Pawmarks</h3>
                        <p className="font-body text-sm text-[#3A3A3A]/70">
                          Orders tied to memorial readings, pawmark posts, or pawmarks packs.
                        </p>
                      </div>
                      <a
                        href="/admin/pawmarks/new"
                        className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors"
                      >
                        Create Pawmark
                      </a>
                      <a
                        href="/admin/pawmarks/manage"
                        className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors"
                      >
                        Edit Pawmarks
                      </a>
                    </div>
                    {memorialOrders.length === 0 ? (
                      <p className="text-center font-body text-[#3A3A3A]/70 py-6">No memorial requests yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {memorialOrders.map((reading) => (
                          <div
                            key={reading.id || reading.created_at}
                            className="border border-[#9DB5A5]/20 rounded-xl p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="font-display text-lg font-semibold text-[#2D3561]">
                                  {reading.pets?.name || 'Unknown Pet'}
                                </p>
                                <p className="font-body text-sm text-[#3A3A3A]">
                                  <strong>Customer:</strong> {reading.customers?.first_name} {reading.customers?.last_name}
                                </p>
                                <p className="font-body text-sm text-[#3A3A3A]">
                                  <strong>Services:</strong> {getServiceNames(reading.services || [])}
                                </p>
                              </div>
                              <div className="text-sm text-[#3A3A3A]/80">
                                <p><strong>Ordered:</strong> {formatDate(reading.created_at)}</p>
                                <p><strong>Status:</strong> {reading.status || 'pending'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-display text-xl font-semibold text-[#2D3561]">Portraits + Visuals</h3>
                        <p className="font-body text-sm text-[#3A3A3A]/70">
                          Pawollie Vision and visual add-on requests that need creative delivery.
                        </p>
                      </div>
                    </div>
                    {portraitOrders.length === 0 ? (
                      <p className="text-center font-body text-[#3A3A3A]/70 py-6">No portrait requests yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {portraitOrders.map((reading) => (
                          <div
                            key={reading.id || reading.created_at}
                            className="border border-[#9DB5A5]/20 rounded-xl p-4"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div>
                                <p className="font-display text-lg font-semibold text-[#2D3561]">
                                  {reading.pets?.name || 'Unknown Pet'}
                                </p>
                                <p className="font-body text-sm text-[#3A3A3A]">
                                  <strong>Customer:</strong> {reading.customers?.first_name} {reading.customers?.last_name}
                                </p>
                                <p className="font-body text-sm text-[#3A3A3A]">
                                  <strong>Services:</strong> {getServiceNames(reading.services || [])}
                                </p>
                              </div>
                              <div className="text-sm text-[#3A3A3A]/80">
                                <p><strong>Ordered:</strong> {formatDate(reading.created_at)}</p>
                                <p><strong>Status:</strong> {reading.status || 'pending'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-display text-xl font-semibold text-[#2D3561]">Shopify Keepsake Pipeline</h3>
                        <p className="font-body text-sm text-[#3A3A3A]/70">
                          Generates keepsake assets, then either emails digital-only orders or creates Shopify print/ship drafts.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRunAllKeepsakes}
                        disabled={processingAllKeepsakes}
                        className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
                      >
                        {processingAllKeepsakes ? 'Processing...' : 'Run All Pending Keepsakes'}
                      </button>
                    </div>
                    {keepsakeResult ? (
                      <p className="font-body text-sm text-[#2D3561] mb-3">{keepsakeResult}</p>
                    ) : null}
                    {keepsakeError ? (
                      <p className="font-body text-sm text-red-600 mb-3">{keepsakeError}</p>
                    ) : null}
                    {keepsakePipelineOrders.length === 0 ? (
                      <p className="text-center font-body text-[#3A3A3A]/70 py-6">No keepsake orders queued yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {keepsakePipelineOrders.map((order) => {
                          const orderId = String(order?.id || '');
                          const reading = order?.readings || {};
                          const customerName = [reading?.customers?.first_name, reading?.customers?.last_name]
                            .filter(Boolean)
                            .join(' ')
                            .trim() || 'Unknown Customer';
                          const petName = reading?.pets?.name || 'Unknown Pet';
                          const processingKey = orderId || String(order?.reading_id || '');
                          const draft = keepsakeDrafts[orderId] || {
                            title: '',
                            subtitle: '',
                            overlay_text: '',
                            back_text: '',
                            generated_asset_url: String(order?.generated_asset_url || ''),
                            keepsake_notes: ''
                          };
                          return (
                            <div
                              key={orderId || `${order?.reading_id}-${order?.keepsake_type}`}
                              className="border border-[#9DB5A5]/20 rounded-xl p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-display text-lg font-semibold text-[#2D3561]">
                                      {String(order?.keepsake_type || '').replace(/_/g, ' ')}
                                    </p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getKeepsakeStatusColor(order?.status || '')}`}>
                                      {order?.status || 'queued'}
                                    </span>
                                  </div>
                                  <p className="font-body text-sm text-[#3A3A3A]">
                                    <strong>Customer:</strong> {customerName}
                                  </p>
                                  <p className="font-body text-sm text-[#3A3A3A]">
                                    <strong>Pet:</strong> {petName}
                                  </p>
                                  <p className="font-body text-sm text-[#3A3A3A] break-all">
                                    <strong>Reading ID:</strong> {order?.reading_id || 'N/A'}
                                  </p>
                                  {order?.shopify_draft_order_name ? (
                                    <p className="font-body text-sm text-[#3A3A3A]">
                                      <strong>Shopify Draft:</strong> {order.shopify_draft_order_name}
                                    </p>
                                  ) : null}
                                  {order?.last_error ? (
                                    <p className="font-body text-sm text-red-600">
                                      <strong>Error:</strong> {order.last_error}
                                    </p>
                                  ) : null}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <p className="font-body text-xs text-[#3A3A3A]/70">
                                    Updated: {formatDate(order?.updated_at)}
                                  </p>
                                  {order?.shopify_invoice_url ? (
                                    <a
                                      href={order.shopify_invoice_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-xs font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors"
                                    >
                                      Open Shopify Invoice
                                    </a>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={() => handleRunKeepsakePipeline({ keepsakeOrderId: orderId, action: 'remake', force: true })}
                                    disabled={Boolean(processingKeepsakes[processingKey])}
                                    className="px-3 py-2 bg-[#2D3561] text-white font-display text-xs font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors disabled:opacity-70"
                                  >
                                    {processingKeepsakes[processingKey] ? 'Remaking...' : 'Remake'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveKeepsake(orderId)}
                                    disabled={Boolean(approvingKeepsakes[orderId])}
                                    className="px-3 py-2 bg-[#D4AF37] text-[#2D3561] font-display text-xs font-semibold rounded-lg hover:bg-[#E5C158] transition-colors disabled:opacity-70"
                                  >
                                    {approvingKeepsakes[orderId] ? 'Approving...' : 'Approve for Shopify'}
                                  </button>
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-3 mt-4">
                                <div>
                                  <label className="font-body text-xs text-[#3A3A3A]/70">Title</label>
                                  <input
                                    value={draft.title}
                                    onChange={(event) => handleKeepsakeDraftChange(orderId, 'title', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                                <div>
                                  <label className="font-body text-xs text-[#3A3A3A]/70">Subtitle</label>
                                  <input
                                    value={draft.subtitle}
                                    onChange={(event) => handleKeepsakeDraftChange(orderId, 'subtitle', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                                <div>
                                  <label className="font-body text-xs text-[#3A3A3A]/70">Overlay text</label>
                                  <textarea
                                    rows={2}
                                    value={draft.overlay_text}
                                    onChange={(event) => handleKeepsakeDraftChange(orderId, 'overlay_text', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                                <div>
                                  <label className="font-body text-xs text-[#3A3A3A]/70">Back text</label>
                                  <textarea
                                    rows={2}
                                    value={draft.back_text}
                                    onChange={(event) => handleKeepsakeDraftChange(orderId, 'back_text', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="font-body text-xs text-[#3A3A3A]/70">Generated asset URL</label>
                                  <input
                                    value={draft.generated_asset_url}
                                    onChange={(event) => handleKeepsakeDraftChange(orderId, 'generated_asset_url', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="font-body text-xs text-[#3A3A3A]/70">Admin keepsake notes</label>
                                  <textarea
                                    rows={2}
                                    value={draft.keepsake_notes}
                                    onChange={(event) => handleKeepsakeDraftChange(orderId, 'keepsake_notes', event.target.value)}
                                    className="mt-1 w-full rounded-lg border border-[#9DB5A5]/30 px-3 py-2 font-body text-sm focus:outline-none focus:border-[#D4AF37]"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end mt-3">
                                <button
                                  type="button"
                                  onClick={() => handleSaveKeepsakeDraft(orderId)}
                                  disabled={Boolean(savingKeepsakeDrafts[orderId])}
                                  className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors disabled:opacity-70"
                                >
                                  {savingKeepsakeDrafts[orderId] ? 'Saving...' : 'Save Adjustments'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-[#F5F1E8] rounded-2xl p-5 border border-[#9DB5A5]/20">
                    <h3 className="font-display text-lg font-semibold text-[#2D3561] mb-2">Creative Shortcuts</h3>
                    <p className="font-body text-sm text-[#3A3A3A]/70 mb-4">
                      Use these quick links to create, post, and approve creative work.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="/admin/pawmarks/new"
                        className="px-4 py-2 bg-[#2D3561] text-white font-display text-sm font-semibold rounded-lg hover:bg-[#3D4A7A] transition-colors"
                      >
                        New Pawmark
                      </a>
                      <a
                        href="/admin/pawmarks/manage"
                        className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors"
                      >
                        Edit Pawmarks
                      </a>
                      <a
                        href="/admin/wagbook"
                        className="px-4 py-2 bg-[#D4AF37] text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#E5C158] transition-colors"
                      >
                        Wag Book Pipeline
                      </a>
                      <a
                        href="/pawmarks"
                        className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors"
                      >
                        View Pawmarks
                      </a>
                      <a
                        href="/community"
                        className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors"
                      >
                        Review Community Posts
                      </a>
                      <a
                        href="/admin/media"
                        className="px-4 py-2 border border-[#2D3561]/30 text-[#2D3561] font-display text-sm font-semibold rounded-lg hover:bg-[#2D3561]/10 transition-colors"
                      >
                        Media Library
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;

