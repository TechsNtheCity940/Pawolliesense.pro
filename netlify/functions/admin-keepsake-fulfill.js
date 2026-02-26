const {
  COOKIE_NAME,
  parseCookies,
  verifyToken,
  getCredentials
} = require('./_adminAuth');

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';
const STORAGE_BUCKET = process.env.SUPABASE_KEEPSAKE_BUCKET || 'pet-photos';

const KEEP_TYPES = {
  memorial_print: {
    label: 'Memorial print',
    variantEnv: 'SHOPIFY_VARIANT_ID_MEMORIAL_PRINT',
    price: 79
  },
  chart_certificate: {
    label: 'Star chart certificate',
    variantEnv: 'SHOPIFY_VARIANT_ID_CHART_CERTIFICATE',
    price: 39
  },
  apparel: {
    label: 'Pawollie constellation apparel',
    variantEnv: 'SHOPIFY_VARIANT_ID_APPAREL',
    price: 44
  },
  tag_ornament: {
    label: 'Keepsake tag / ornament',
    variantEnv: 'SHOPIFY_VARIANT_ID_TAG_ORNAMENT',
    price: 29
  }
};

const FINISHED_STATUSES = new Set(['shopify_draft_created', 'submitted', 'fulfilled', 'completed']);
const GENERATE_STATUSES = new Set(['queued', 'failed', 'processing', 'asset_ready', 'awaiting_approval']);
const APPROVE_STATUSES = new Set(['awaiting_approval', 'asset_ready', 'shopify_draft_created', 'submitted']);

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  },
  body: JSON.stringify(body)
});

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
};

const safeText = (value, fallback = '') => String(value || '').trim() || fallback;

const supabaseRequest = async ({
  path,
  method = 'GET',
  body,
  rawBody,
  headers = {},
  prefer = 'return=representation'
} = {}) => {
  const baseUrl = requiredEnv('SUPABASE_URL');
  const key = requiredEnv('SUPABASE_SERVICE_ROLE_KEY');
  const isRaw = rawBody !== undefined;
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(!isRaw ? { 'Content-Type': 'application/json' } : {}),
      Prefer: prefer,
      ...headers
    },
    body: isRaw ? rawBody : (body ? JSON.stringify(body) : undefined)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || 'Supabase request failed.';
    throw new Error(message);
  }
  return data;
};

const parseAdditionalNotes = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const parseJsonValue = (raw, fallback) => {
  if (raw === null || raw === undefined || raw === '') return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const extractJsonObject = (text) => {
  const raw = String(text || '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

const normalizeVariantId = (raw) => {
  const value = safeText(raw);
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
};

const splitName = (fullName = '') => {
  const parts = safeText(fullName).split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || '',
    lastName: parts.join(' ')
  };
};

const shopifyRequest = async ({ path, method = 'GET', body } = {}) => {
  const domain = safeText(requiredEnv('SHOPIFY_SHOP_DOMAIN')).replace(/^https?:\/\//i, '');
  const token = requiredEnv('SHOPIFY_ADMIN_API_TOKEN');
  const version = safeText(process.env.SHOPIFY_API_VERSION, '2025-01');
  const response = await fetch(`https://${domain}/admin/api/${version}${path}`, {
    method,
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.errors
      ? JSON.stringify(data.errors)
      : data?.error || data?.message || 'Shopify request failed.';
    throw new Error(message);
  }
  return data;
};

const getOpenAiText = async ({ prompt }) => {
  const apiKey = safeText(process.env.OPENAI_API_KEY);
  if (!apiKey) return null;
  const model = safeText(process.env.OPENAI_READING_MODEL, 'gpt-4o-mini');

  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      input: prompt,
      max_output_tokens: 350
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || 'OpenAI copy generation failed.';
    throw new Error(message);
  }

  const outputText = safeText(data?.output_text);
  if (outputText) return outputText;

  const chunks = [];
  (data?.output || []).forEach((item) => {
    (item?.content || []).forEach((content) => {
      if (content?.type === 'output_text' && content?.text) {
        chunks.push(String(content.text));
      }
    });
  });
  return safeText(chunks.join('\n'));
};

const getOpenAiImage = async ({ prompt }) => {
  const apiKey = safeText(process.env.OPENAI_API_KEY);
  if (!apiKey) return null;
  const model = safeText(process.env.OPENAI_IMAGE_MODEL, 'gpt-image-1');
  const size = safeText(process.env.OPENAI_IMAGE_SIZE, '1024x1024');

  const response = await fetch(OPENAI_IMAGES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      size,
      prompt
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || 'OpenAI image generation failed.';
    throw new Error(message);
  }

  const first = Array.isArray(data?.data) ? data.data[0] : null;
  if (!first) return null;
  if (first.b64_json) {
    return { type: 'b64', mimeType: 'image/png', data: first.b64_json };
  }
  if (first.url) {
    return { type: 'url', url: first.url };
  }
  return null;
};

const uploadGeneratedAsset = async ({ reading, order, image }) => {
  if (!image || image.type !== 'b64') return { assetUrl: image?.url || '', storagePath: '' };
  const mimeType = safeText(image.mimeType, 'image/png');
  const ext = mimeType.includes('jpeg') ? 'jpg' : mimeType.includes('webp') ? 'webp' : 'png';
  const rawPath = [
    'keepsakes',
    safeText(reading?.id, 'reading'),
    `${safeText(order?.keepsake_type, 'asset')}_${Date.now()}.${ext}`
  ].join('/');
  const encodedPath = rawPath.split('/').map((part) => encodeURIComponent(part)).join('/');
  const buffer = Buffer.from(image.data, 'base64');

  await supabaseRequest({
    path: `/storage/v1/object/${STORAGE_BUCKET}/${encodedPath}`,
    method: 'POST',
    headers: {
      'Content-Type': mimeType,
      'x-upsert': 'true'
    },
    rawBody: buffer,
    prefer: 'return=minimal'
  });

  const assetUrl = `${requiredEnv('SUPABASE_URL')}/storage/v1/object/public/${STORAGE_BUCKET}/${encodedPath}`;
  await supabaseRequest({
    path: '/rest/v1/uploaded_files',
    method: 'POST',
    body: {
      customer_id: reading?.customer_id || null,
      pet_id: reading?.pet_id || null,
      reading_id: reading?.id || null,
      file_name: rawPath,
      original_name: rawPath.split('/').pop(),
      file_type: mimeType,
      file_size: buffer.length,
      storage_path: assetUrl,
      photo_type: `keepsake_asset_${safeText(order?.keepsake_type, 'asset')}`
    }
  });

  return { assetUrl, storagePath: rawPath };
};

const buildKeepsakePrompt = ({ order, reading, extraNotes, sourceImages }) => {
  const serviceList = Array.isArray(reading?.services) ? reading.services.join(', ') : 'unknown services';
  const petName = safeText(reading?.pets?.name, 'Pet');
  const guardianName = [reading?.customers?.first_name, reading?.customers?.last_name].filter(Boolean).join(' ').trim() || 'Guardian';
  const keepsakeLabel = KEEP_TYPES[order.keepsake_type]?.label || order.keepsake_type;
  const readingText = safeText(reading?.notes).slice(0, 2400);
  const requestNotes = safeText(extraNotes?.keepsake_notes || order?.customization?.keepsake_notes || '');
  const quote = safeText(extraNotes?.k_quote || order?.customization?.quote || '');
  const excerpt = safeText(extraNotes?.k_excerpt || order?.customization?.excerpt || '');

  return [
    'You create print-ready keepsake copy for Pawollie Sense.',
    'Return ONLY JSON with keys: title, subtitle, overlay_text, back_text.',
    'Keep overlay_text <= 140 characters.',
    `Keepsake type: ${keepsakeLabel}`,
    `Customer: ${guardianName}`,
    `Pet: ${petName}`,
    `Services purchased: ${serviceList}`,
    quote ? `Customer quote: ${quote}` : null,
    excerpt ? `Favorite excerpt: ${excerpt}` : null,
    requestNotes ? `Additional keepsake notes: ${requestNotes}` : null,
    sourceImages.length ? `Reference images: ${sourceImages.slice(0, 5).join(', ')}` : null,
    readingText ? `Reading text: ${readingText}` : 'Reading text unavailable.'
  ].filter(Boolean).join('\n');
};

const buildImagePrompt = ({ order, reading, copy, extraNotes, sourceImages }) => {
  const petName = safeText(reading?.pets?.name, 'Pet');
  const keepsakeType = safeText(order?.keepsake_type);
  const overlayText = safeText(copy?.overlay_text || copy?.subtitle || copy?.title);
  const style = safeText(extraNotes?.k_style || copy?.style_hint || 'celestial, clean, premium');
  const notes = safeText(extraNotes?.keepsake_notes);
  const sourceHint = sourceImages.length
    ? `Reference these image URLs for likeness and color cues: ${sourceImages.slice(0, 6).join(', ')}.`
    : '';

  return [
    `Design a print-ready ${keepsakeType.replace(/_/g, ' ')} artwork for Pawollie Sense.`,
    `Subject: beloved pet named ${petName}.`,
    overlayText ? `Include this exact short text: "${overlayText}".` : '',
    `Visual style: ${style}. Keep composition clean, high contrast, premium typography.`,
    notes ? `Customer notes: ${notes}.` : '',
    sourceHint,
    'No logos or watermarks. High-quality, production-ready, 1:1 composition.'
  ].filter(Boolean).join(' ');
};

const buildFallbackCopy = ({ order, reading, extraNotes }) => {
  const petName = safeText(reading?.pets?.name, 'Pet');
  const quote = safeText(extraNotes?.k_quote || extraNotes?.k_excerpt || '');
  const title = KEEP_TYPES[order.keepsake_type]?.label || 'Pawollie keepsake';
  return {
    title: `${title} for ${petName}`,
    subtitle: quote || `In loving honor of ${petName}`,
    overlay_text: quote || `Forever loved: ${petName}`,
    back_text: safeText(extraNotes?.keepsake_notes || 'Crafted with care by Pawollie Sense.')
  };
};

const getSourceImages = async (readingId) => {
  if (!readingId) return [];
  const rows = await supabaseRequest({
    path: `/rest/v1/uploaded_files?reading_id=eq.${encodeURIComponent(readingId)}&select=storage_path,photo_type&order=created_at.asc&limit=30`
  });
  return (Array.isArray(rows) ? rows : [])
    .map((row) => safeText(row?.storage_path))
    .filter(Boolean);
};

const getReading = async (readingId) => {
  const rows = await supabaseRequest({
    path: `/rest/v1/readings?id=eq.${encodeURIComponent(readingId)}&select=*,customers(*),pets(*)&limit=1`
  });
  return Array.isArray(rows) ? rows[0] : null;
};

const getKeepsakesFromReading = (reading) => {
  const rawKeepsakes = parseJsonValue(reading?.keepsakes, []);
  const extra = parseAdditionalNotes(reading?.pets?.additional_notes);
  const extraKeepsakes = Array.isArray(extra?.keepsakes) ? extra.keepsakes : [];
  const merged = [...rawKeepsakes, ...extraKeepsakes];
  return merged
    .map((item) => safeText(item).toLowerCase())
    .filter((item, index, list) => KEEP_TYPES[item] && list.indexOf(item) === index);
};

const ensureKeepsakeRowsForReading = async (reading) => {
  if (!reading?.id) return [];
  const selectedKeepsakes = getKeepsakesFromReading(reading);
  if (!selectedKeepsakes.length) return [];
  const extra = parseAdditionalNotes(reading?.pets?.additional_notes);
  const currentRows = await supabaseRequest({
    path: `/rest/v1/keepsake_orders?reading_id=eq.${encodeURIComponent(reading.id)}&select=id,keepsake_type`
  });
  const existingTypes = new Set(
    (Array.isArray(currentRows) ? currentRows : []).map((row) => safeText(row?.keepsake_type).toLowerCase())
  );
  const toInsert = selectedKeepsakes
    .filter((type) => !existingTypes.has(type))
    .map((type) => ({
      reading_id: reading.id,
      customer_id: reading.customer_id || null,
      pet_id: reading.pet_id || null,
      keepsake_type: type,
      status: 'queued',
      quantity: 1,
      price: KEEP_TYPES[type]?.price || null,
      service_context: Array.isArray(reading?.services) ? reading.services : [],
      customization: {
        keepsake_notes: safeText(extra?.keepsake_notes),
        quote: safeText(extra?.k_quote),
        excerpt: safeText(extra?.k_excerpt),
        design_style: safeText(extra?.k_style)
      }
    }));
  if (!toInsert.length) {
    return Array.isArray(currentRows) ? currentRows : [];
  }
  const inserted = await supabaseRequest({
    path: '/rest/v1/keepsake_orders',
    method: 'POST',
    body: toInsert
  });
  return Array.isArray(inserted) ? inserted : [inserted];
};

const getOrdersToProcess = async ({ readingId, keepsakeOrderId, limit, force, action }) => {
  const params = ['select=*', 'order=created_at.asc', `limit=${limit}`];
  if (readingId) params.push(`reading_id=eq.${encodeURIComponent(readingId)}`);
  if (keepsakeOrderId) params.push(`id=eq.${encodeURIComponent(keepsakeOrderId)}`);

  let rows = await supabaseRequest({
    path: `/rest/v1/keepsake_orders?${params.join('&')}`
  });
  let items = Array.isArray(rows) ? rows : [];

  if (readingId && !items.length) {
    const reading = await getReading(readingId);
    if (reading) {
      await ensureKeepsakeRowsForReading(reading);
      rows = await supabaseRequest({
        path: `/rest/v1/keepsake_orders?${params.join('&')}`
      });
      items = Array.isArray(rows) ? rows : [];
    }
  }

  if (force) {
    return items.filter((row) => KEEP_TYPES[safeText(row?.keepsake_type)]);
  }
  return items.filter((row) => {
    const type = safeText(row?.keepsake_type);
    if (!KEEP_TYPES[type]) return false;
    const status = safeText(row?.status).toLowerCase();
    if (action === 'approve') {
      return APPROVE_STATUSES.has(status);
    }
    return GENERATE_STATUSES.has(status);
  });
};

const patchKeepsakeOrder = async (id, patch) => {
  const rows = await supabaseRequest({
    path: `/rest/v1/keepsake_orders?id=eq.${encodeURIComponent(id)}`,
    method: 'PATCH',
    body: patch
  });
  return Array.isArray(rows) ? rows[0] : rows;
};

const updateReadingKeepsakeStatus = async (readingId) => {
  if (!readingId) return;
  const rows = await supabaseRequest({
    path: `/rest/v1/keepsake_orders?reading_id=eq.${encodeURIComponent(readingId)}&select=status,last_error`
  });
  const orders = Array.isArray(rows) ? rows : [];
  if (!orders.length) {
    await supabaseRequest({
      path: `/rest/v1/readings?id=eq.${encodeURIComponent(readingId)}`,
      method: 'PATCH',
      body: {
        keepsake_status: 'none',
        keepsake_last_error: null
      }
    });
    return;
  }

  const statuses = orders.map((row) => safeText(row?.status).toLowerCase());
  let keepsakeStatus = 'queued';
  let keepsakeError = null;

  if (statuses.some((status) => status === 'failed')) {
    keepsakeStatus = 'failed';
    keepsakeError = safeText(
      orders.find((row) => safeText(row?.status).toLowerCase() === 'failed')?.last_error,
      'Keepsake fulfillment failed.'
    );
  } else if (statuses.every((status) => FINISHED_STATUSES.has(status))) {
    keepsakeStatus = 'ready';
  } else if (statuses.some((status) => status === 'awaiting_approval')) {
    keepsakeStatus = 'awaiting_approval';
  } else if (statuses.some((status) => status === 'processing')) {
    keepsakeStatus = 'processing';
  }

  await supabaseRequest({
    path: `/rest/v1/readings?id=eq.${encodeURIComponent(readingId)}`,
    method: 'PATCH',
    body: {
      keepsake_status: keepsakeStatus,
      keepsake_last_error: keepsakeError
    }
  });
};

const createShopifyDraftOrder = async ({ order, reading, extraNotes, assetUrl, copy }) => {
  const type = safeText(order?.keepsake_type);
  const keepMeta = KEEP_TYPES[type];
  if (!keepMeta) {
    throw new Error(`Unsupported keepsake type: ${type}`);
  }

  const variantRaw = process.env[keepMeta.variantEnv];
  const variantId = normalizeVariantId(variantRaw);
  if (!variantId) {
    throw new Error(`Missing Shopify variant mapping (${keepMeta.variantEnv}).`);
  }

  const fullName = safeText(extraNotes?.k_ship_name) || `${safeText(reading?.customers?.first_name)} ${safeText(reading?.customers?.last_name)}`.trim();
  const { firstName, lastName } = splitName(fullName);
  const email = safeText(extraNotes?.k_ship_email) || safeText(reading?.customers?.email);
  const shippingAddress1 = safeText(extraNotes?.k_ship_address1);
  const shippingAddress = shippingAddress1
    ? {
        first_name: firstName,
        last_name: lastName,
        address1: shippingAddress1,
        address2: safeText(extraNotes?.k_ship_address2),
        city: safeText(extraNotes?.k_ship_city),
        province: safeText(extraNotes?.k_ship_state),
        zip: safeText(extraNotes?.k_ship_postal),
        country: safeText(extraNotes?.k_ship_country),
        phone: safeText(extraNotes?.k_ship_phone)
      }
    : undefined;

  const lineItem = {
    variant_id: variantId,
    quantity: Number(order?.quantity || 1) || 1,
    properties: [
      { name: 'Pawollie Reading ID', value: safeText(reading?.id) },
      { name: 'Keepsake Type', value: type },
      { name: 'Pet Name', value: safeText(reading?.pets?.name) },
      { name: 'Overlay Text', value: safeText(copy?.overlay_text) },
      { name: 'Generated Asset URL', value: safeText(assetUrl) },
      { name: 'Customer Notes', value: safeText(extraNotes?.keepsake_notes) },
      { name: 'Memorial Format', value: safeText(extraNotes?.k_memorial_format) },
      { name: 'Memorial Orientation', value: safeText(extraNotes?.k_memorial_orientation) },
      { name: 'Chart Format', value: safeText(extraNotes?.k_chart_format) },
      { name: 'Chart Style', value: safeText(extraNotes?.k_chart_style) },
      { name: 'Apparel Item', value: safeText(extraNotes?.k_apparel_item) },
      { name: 'Apparel Size', value: safeText(extraNotes?.k_apparel_size) },
      { name: 'Apparel Color', value: safeText(extraNotes?.k_apparel_color) },
      { name: 'Apparel Art Source', value: safeText(extraNotes?.k_apparel_art_source) },
      { name: 'Apparel Text', value: safeText(extraNotes?.k_apparel_text) },
      { name: 'Tag Name', value: safeText(extraNotes?.k_tag_name) },
      { name: 'Tag Dates', value: safeText(extraNotes?.k_tag_dates) },
      { name: 'Tag Material', value: safeText(extraNotes?.k_tag_material) },
      { name: 'Tag Shape', value: safeText(extraNotes?.k_tag_shape) }
    ].filter((item) => item.value)
  };

  const payload = {
    draft_order: {
      email: email || undefined,
      line_items: [lineItem],
      note: `Pawollie keepsake fulfillment (${type}) for reading ${safeText(reading?.id)}`,
      tags: `pawollie-keepsake,${type},reading:${safeText(reading?.id)}`,
      note_attributes: [
        { name: 'reading_id', value: safeText(reading?.id) },
        { name: 'keepsake_order_id', value: safeText(order?.id) },
        { name: 'asset_url', value: safeText(assetUrl) }
      ],
      shipping_address: shippingAddress
    }
  };

  const data = await shopifyRequest({
    path: '/draft_orders.json',
    method: 'POST',
    body: payload
  });
  const draft = data?.draft_order;
  if (!draft?.id) {
    throw new Error('Shopify draft order was not created.');
  }

  if (safeText(process.env.SHOPIFY_SEND_INVOICE).toLowerCase() === 'true' && email) {
    try {
      await shopifyRequest({
        path: `/draft_orders/${draft.id}/send_invoice.json`,
        method: 'POST',
        body: {
          draft_order_invoice: {
            to: email
          }
        }
      });
    } catch (error) {
      console.warn('Shopify send invoice failed', error.message || error);
    }
  }

  return {
    id: String(draft.id),
    name: safeText(draft.name),
    invoice_url: safeText(draft.invoice_url),
    order_id: draft.order_id ? String(draft.order_id) : ''
  };
};

const getOrderContext = ({ order, reading }) => {
  const readingNotes = parseAdditionalNotes(reading?.pets?.additional_notes);
  const customization = parseJsonValue(order?.customization, {});
  const merged = {
    ...readingNotes,
    ...customization
  };
  return {
    extraNotes: merged,
    customization
  };
};

const parseGeneratedCopy = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const generateKeepsakeOrder = async ({ order, reading, forceRemake = false }) => {
  const { extraNotes } = getOrderContext({ order, reading });
  const sourceImages = await getSourceImages(reading?.id);

  let copy = parseGeneratedCopy(order?.generated_copy) || buildFallbackCopy({ order, reading, extraNotes });
  if (forceRemake || !safeText(copy?.overlay_text)) {
    const prompt = buildKeepsakePrompt({ order, reading, extraNotes, sourceImages });
    try {
      const aiText = await getOpenAiText({ prompt });
      const parsed = extractJsonObject(aiText);
      if (parsed) {
        copy = {
          ...copy,
          title: safeText(parsed?.title, copy.title),
          subtitle: safeText(parsed?.subtitle, copy.subtitle),
          overlay_text: safeText(parsed?.overlay_text, copy.overlay_text),
          back_text: safeText(parsed?.back_text, copy.back_text)
        };
      } else if (safeText(aiText)) {
        copy.overlay_text = safeText(aiText.slice(0, 140), copy.overlay_text);
      }
    } catch (error) {
      console.warn('Keepsake copy generation failed', error.message || error);
    }
  }

  let generatedAssetUrl = forceRemake ? '' : safeText(order?.generated_asset_url);
  let generatedStoragePath = forceRemake ? '' : safeText(order?.generated_asset_storage_path);

  if (!generatedAssetUrl || forceRemake) {
    const imagePrompt = buildImagePrompt({ order, reading, copy, extraNotes, sourceImages });
    try {
      const image = await getOpenAiImage({ prompt: imagePrompt });
      if (image) {
        if (image.type === 'url') {
          generatedAssetUrl = safeText(image.url);
        } else {
          const uploaded = await uploadGeneratedAsset({ reading, order, image });
          generatedAssetUrl = uploaded.assetUrl;
          generatedStoragePath = uploaded.storagePath;
        }
      }
    } catch (error) {
      console.warn('Keepsake image generation failed', error.message || error);
    }
  }

  if (!generatedAssetUrl && sourceImages.length) {
    generatedAssetUrl = sourceImages[0];
  }
  if (!generatedAssetUrl) {
    throw new Error('No keepsake asset available. Upload pet photos and retry.');
  }

  await patchKeepsakeOrder(order.id, {
    status: 'awaiting_approval',
    generated_copy: JSON.stringify(copy),
    source_images: sourceImages,
    generated_asset_url: generatedAssetUrl,
    generated_asset_storage_path: generatedStoragePath || null,
    last_error: null
  });

  return { copy, generatedAssetUrl };
};

const approveKeepsakeOrder = async ({ order, reading }) => {
  const { extraNotes } = getOrderContext({ order, reading });
  const copy = parseGeneratedCopy(order?.generated_copy) || buildFallbackCopy({ order, reading, extraNotes });
  const assetUrl = safeText(order?.generated_asset_url);
  if (!assetUrl) {
    throw new Error('Cannot approve without generated asset URL. Generate or upload asset first.');
  }

  if (safeText(order?.shopify_draft_order_id)) {
    await patchKeepsakeOrder(order.id, {
      status: 'shopify_draft_created',
      last_error: null,
      completed_at: order?.completed_at || new Date().toISOString()
    });
    return;
  }

  const draft = await createShopifyDraftOrder({
    order,
    reading,
    extraNotes,
    assetUrl,
    copy
  });

  await patchKeepsakeOrder(order.id, {
    status: 'shopify_draft_created',
    generated_copy: JSON.stringify(copy),
    generated_asset_url: assetUrl,
    shopify_draft_order_id: draft.id,
    shopify_draft_order_name: draft.name || null,
    shopify_invoice_url: draft.invoice_url || null,
    shopify_order_id: draft.order_id || null,
    shopify_payload: draft,
    last_error: null,
    completed_at: new Date().toISOString()
  });
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'Method not allowed.' });
  }

  try {
    const { secret } = getCredentials();
    if (!secret) {
      return jsonResponse(500, { ok: false, error: 'Admin auth is not configured.' });
    }
    const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || '');
    const token = cookies[COOKIE_NAME];
    const payload = verifyToken(token, secret);
    if (!payload) {
      return jsonResponse(401, { ok: false, error: 'Unauthorized.' });
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const readingId = safeText(body?.readingId);
    const keepsakeOrderId = safeText(body?.keepsakeOrderId);
    const action = safeText(body?.action, 'generate').toLowerCase();
    const allowedActions = new Set(['generate', 'approve', 'remake']);
    if (!allowedActions.has(action)) {
      return jsonResponse(400, { ok: false, error: 'Invalid action. Use generate, remake, or approve.' });
    }
    const force = Boolean(body?.force);
    const limitRaw = Number(body?.limit || 6);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 30)) : 6;

    const orders = await getOrdersToProcess({ readingId, keepsakeOrderId, limit, force, action });
    if (!orders.length) {
      return jsonResponse(200, { ok: true, processed: 0, succeeded: 0, failed: 0, results: [] });
    }

    const readingCache = new Map();
    const results = [];
    let succeeded = 0;
    let failed = 0;

    for (const order of orders) {
      const type = safeText(order?.keepsake_type);
      if (!KEEP_TYPES[type]) {
        continue;
      }
      const orderId = safeText(order?.id);
      const currentReadingId = safeText(order?.reading_id);
      if (!orderId || !currentReadingId) continue;

      try {
        const currentStatus = safeText(order?.status).toLowerCase();
        const shouldMarkProcessing = action !== 'approve' && currentStatus !== 'processing';
        if (shouldMarkProcessing) {
          await patchKeepsakeOrder(orderId, {
            status: 'processing',
            last_error: null
          });
        }

        let reading = readingCache.get(currentReadingId);
        if (!reading) {
          reading = await getReading(currentReadingId);
          if (!reading) throw new Error('Reading not found for keepsake order.');
          readingCache.set(currentReadingId, reading);
        }

        if (action === 'approve') {
          await approveKeepsakeOrder({ order, reading });
        } else {
          await generateKeepsakeOrder({
            order,
            reading,
            forceRemake: action === 'remake' || force
          });
        }
        await updateReadingKeepsakeStatus(currentReadingId);

        results.push({
          keepsake_order_id: orderId,
          reading_id: currentReadingId,
          keepsake_type: type,
          status: action === 'approve' ? 'shopify_draft_created' : 'awaiting_approval'
        });
        succeeded += 1;
      } catch (error) {
        failed += 1;
        await patchKeepsakeOrder(orderId, {
          status: 'failed',
          last_error: error.message || 'Keepsake pipeline failed.'
        });
        await updateReadingKeepsakeStatus(currentReadingId);
        results.push({
          keepsake_order_id: orderId,
          reading_id: currentReadingId,
          keepsake_type: type,
          status: 'failed',
          error: error.message || 'Keepsake pipeline failed.'
        });
      }
    }

    return jsonResponse(200, {
      ok: true,
      action,
      processed: results.length,
      succeeded,
      failed,
      results
    });
  } catch (error) {
    return jsonResponse(500, { ok: false, error: error.message || 'Unable to run keepsake fulfillment.' });
  }
};
