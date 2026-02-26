const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const { upsertResendContact } = require('./_resendContacts');

const WAGBOOK_PRICE = 40;

const SERVICE_PRICES = {
  full_spirit_pawfile: 35,
  behavior_bond_guidance: 40,
  pawmarks_pack: 45,
  pawmark_post: 15,
  star_chart: 19,
  paw_reading: 19,
  pawollie_vision: 19,
  express_pawdate: 9,
  quick_quest: 9,
  bond_spark: 9,
  all_paws_pack: 119,
  furmily_pack: 79
};

const NON_WAGBOOK_KEEPSAKE_KEYS = new Set([
  'memorial_print',
  'chart_certificate',
  'apparel',
  'tag_ornament'
]);

const KEEPSAKE_PRICES = {
  memorial_print: 79,
  chart_certificate: 39,
  apparel: 44,
  tag_ornament: 29
};

const APPAREL_PRICES = {
  tee: 44,
  hoodie: 69
};

function calculateTotalPrice(services, fallback = 0) {
  if (!Array.isArray(services) || !services.length) {
    return Number(fallback) || 0;
  }
  return services.reduce((sum, service) => sum + (SERVICE_PRICES[service] || 0), 0);
}

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function splitName(fullName = '') {
  const cleaned = String(fullName || '').trim();
  if (!cleaned) return { first: '', last: '' };
  const parts = cleaned.split(/\s+/);
  const first = parts.shift() || '';
  const last = parts.join(' ');
  return { first, last };
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  return ['true', 'on', '1', 'yes'].includes(String(value || '').toLowerCase());
}

function pickFieldsByPrefix(payload, prefix) {
  return Object.entries(payload || {}).reduce((acc, [key, value]) => {
    if (!String(key).startsWith(prefix)) return acc;
    acc[key] = Array.isArray(value)
      ? value.map((item) => String(item || '').trim()).filter(Boolean)
      : String(value || '').trim();
    return acc;
  }, {});
}

function normalizeServices(payload) {
  if (Array.isArray(payload.services) && payload.services.length) {
    return payload.services.map((service) => String(service).trim()).filter(Boolean);
  }
  if (payload.services) {
    return normalizeArray(payload.services);
  }
  if (Array.isArray(payload.selected_services) && payload.selected_services.length) {
    return payload.selected_services.map((service) => String(service).trim()).filter(Boolean);
  }
  if (payload.selected_services) {
    return normalizeArray(payload.selected_services);
  }
  if (payload.selected_service) {
    return [String(payload.selected_service).trim()];
  }
  if (payload.service) {
    return [String(payload.service).trim()];
  }
  if (payload.service_choice) {
    return [String(payload.service_choice).trim()];
  }
  return [];
}

function normalizeKeepsakes(payload) {
  return normalizeArray(payload?.keepsakes)
    .map((item) => String(item || '').trim().toLowerCase())
    .filter((item) => NON_WAGBOOK_KEEPSAKE_KEYS.has(item));
}

function getKeepsakePrice(type, extraNotes = {}) {
  if (type !== 'apparel') {
    return KEEPSAKE_PRICES[type] || null;
  }
  const apparelItem = String(extraNotes.k_apparel_item || '').trim().toLowerCase();
  if (apparelItem === 'hoodie') {
    return APPAREL_PRICES.hoodie;
  }
  return APPAREL_PRICES.tee;
}

function parseJsonObject(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function mergeAdditionalNotes(existingRaw, nextRaw) {
  const existing = parseJsonObject(existingRaw);
  const next = parseJsonObject(nextRaw);
  const merged = { ...existing, ...next };
  return Object.keys(merged).length ? JSON.stringify(merged) : null;
}

async function supabaseFetch(path, { method = 'GET', body } = {}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials are missing.');
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || 'Supabase request failed.';
    throw new Error(message);
  }
  return data;
}

async function findOrCreateCustomer({ firstName, lastName, email }) {
  const query = `/rest/v1/customers?email=eq.${encodeURIComponent(email)}&select=*`;
  const existing = await supabaseFetch(query);
  if (existing && existing.length) return existing[0];

  const customer = await supabaseFetch('/rest/v1/customers', {
    method: 'POST',
    body: {
      first_name: firstName,
      last_name: lastName,
      email
    }
  });

  return Array.isArray(customer) ? customer[0] : customer;
}

function parseMissingColumn(errorMessage, tableName) {
  if (!errorMessage || !tableName) return null;
  const match = String(errorMessage).match(new RegExp(`'([^']+)'\\s+column\\s+of\\s+'${tableName}'`, 'i'));
  return match ? match[1] : null;
}

async function insertPet(payload) {
  const pet = await supabaseFetch('/rest/v1/pets', {
    method: 'POST',
    body: payload
  });
  return Array.isArray(pet) ? pet[0] : pet;
}

async function findRecentPetByName(customerId, petName) {
  if (!customerId || !petName) return null;
  const rows = await supabaseFetch(
    `/rest/v1/pets?customer_id=eq.${encodeURIComponent(customerId)}&select=*&order=created_at.desc&limit=50`
  );
  const normalizedName = String(petName || '').trim().toLowerCase();
  if (!normalizedName) return null;
  return (Array.isArray(rows) ? rows : []).find(
    (row) => String(row?.name || '').trim().toLowerCase() === normalizedName
  ) || null;
}

async function patchPet(petId, patch) {
  const rows = await supabaseFetch(`/rest/v1/pets?id=eq.${encodeURIComponent(petId)}`, {
    method: 'PATCH',
    body: patch
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

async function createPet(payload) {
  let nextPayload = { ...payload };
  let lastError = null;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await insertPet(nextPayload);
    } catch (error) {
      lastError = error;
      const missingColumn = parseMissingColumn(error.message, 'pets');
      if (!missingColumn || !(missingColumn in nextPayload)) {
        break;
      }
      delete nextPayload[missingColumn];
    }
  }

  const fallbackPayload = {
    customer_id: payload.customer_id,
    name: payload.name,
    additional_notes: payload.additional_notes || null
  };

  try {
    return await insertPet(fallbackPayload);
  } catch (error) {
    const message = error?.message || lastError?.message || 'Unable to create pet record.';
    throw new Error(message);
  }
}

async function findOrCreatePet(payload) {
  const existing = await findRecentPetByName(payload.customer_id, payload.name);
  if (!existing) {
    return createPet(payload);
  }

  const patch = {};
  [
    'species',
    'breed',
    'age',
    'birth_date',
    'gender',
    'is_fixed',
    'is_memorial',
    'personality_description',
    'memorial_message'
  ].forEach((field) => {
    if (
      payload[field] !== undefined &&
      payload[field] !== null &&
      payload[field] !== '' &&
      (existing[field] === undefined || existing[field] === null || existing[field] === '')
    ) {
      patch[field] = payload[field];
    }
  });

  const mergedAdditionalNotes = mergeAdditionalNotes(existing.additional_notes, payload.additional_notes);
  if (mergedAdditionalNotes && mergedAdditionalNotes !== existing.additional_notes) {
    patch.additional_notes = mergedAdditionalNotes;
  }

  if (!Object.keys(patch).length) {
    return existing;
  }

  return patchPet(existing.id, patch);
}

async function insertReading(payload) {
  const reading = await supabaseFetch('/rest/v1/readings', {
    method: 'POST',
    body: payload
  });
  return Array.isArray(reading) ? reading[0] : reading;
}

async function createReading(payload) {
  let nextPayload = { ...payload };
  let lastError = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await insertReading(nextPayload);
    } catch (error) {
      lastError = error;
      const missingColumn = parseMissingColumn(error.message, 'readings');
      if (!missingColumn || !(missingColumn in nextPayload)) {
        break;
      }
      delete nextPayload[missingColumn];
    }
  }

  const fallbackPayload = {
    customer_id: payload.customer_id,
    pet_id: payload.pet_id,
    services: payload.services,
    consent_acknowledged: payload.consent_acknowledged,
    notes: payload.notes || null,
    total_price: payload.total_price
  };

  try {
    return await insertReading(fallbackPayload);
  } catch (error) {
    const message = error?.message || lastError?.message || 'Unable to create reading record.';
    throw new Error(message);
  }
}

async function createKeepsakeOrders({ reading, customer, pet, keepsakes, services, extraNotes }) {
  if (!reading?.id || !Array.isArray(keepsakes) || !keepsakes.length) {
    return [];
  }

  const existingRows = await supabaseFetch(
    `/rest/v1/keepsake_orders?reading_id=eq.${encodeURIComponent(reading.id)}&select=id,keepsake_type`
  );
  const existingTypes = new Set(
    (Array.isArray(existingRows) ? existingRows : []).map((row) => String(row?.keepsake_type || '').toLowerCase())
  );

  const toInsert = keepsakes
    .filter((type) => !existingTypes.has(type))
    .map((type) => ({
      reading_id: reading.id,
      customer_id: customer?.id || null,
      pet_id: pet?.id || null,
      keepsake_type: type,
      status: 'queued',
      quantity: 1,
      price: getKeepsakePrice(type, extraNotes),
      service_context: Array.isArray(services) ? services : [],
      customization: {
        keepsake_notes: extraNotes.keepsake_notes || '',
        quote: extraNotes.k_quote || '',
        excerpt: extraNotes.k_excerpt || '',
        design_style: extraNotes.k_style || '',
        memorial_format: extraNotes.k_memorial_format || '',
        memorial_orientation: extraNotes.k_memorial_orientation || '',
        chart_format: extraNotes.k_chart_format || '',
        chart_style: extraNotes.k_chart_style || '',
        apparel_item: extraNotes.k_apparel_item || '',
        apparel_size: extraNotes.k_apparel_size || '',
        apparel_color: extraNotes.k_apparel_color || '',
        apparel_art_source: extraNotes.k_apparel_art_source || '',
        apparel_text: extraNotes.k_apparel_text || '',
        tag_name: extraNotes.k_tag_name || '',
        tag_dates: extraNotes.k_tag_dates || '',
        tag_material: extraNotes.k_tag_material || '',
        tag_shape: extraNotes.k_tag_shape || '',
        shipping: {
          name: extraNotes.k_ship_name || '',
          email: extraNotes.k_ship_email || '',
          phone: extraNotes.k_ship_phone || '',
          address1: extraNotes.k_ship_address1 || '',
          address2: extraNotes.k_ship_address2 || '',
          city: extraNotes.k_ship_city || '',
          state: extraNotes.k_ship_state || '',
          postal: extraNotes.k_ship_postal || '',
          country: extraNotes.k_ship_country || ''
        }
      }
    }));

  if (!toInsert.length) {
    return Array.isArray(existingRows) ? existingRows : [];
  }

  const inserted = await supabaseFetch('/rest/v1/keepsake_orders', {
    method: 'POST',
    body: toInsert
  });
  return Array.isArray(inserted) ? inserted : [inserted];
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const guardianName = payload.guardian_name || payload.guardianName || '';
    const email = payload.email || '';
    const petName = payload.pet_name || payload.petName || '';
    const services = normalizeServices(payload);
    const keepsakes = normalizeKeepsakes(payload);
    const totalPrice = calculateTotalPrice(services, payload.estimated_total);

    if (!email || !petName || !guardianName || !services.length) {
      return jsonResponse(400, { error: 'Missing required intake fields.' });
    }

    const { first, last } = splitName(guardianName);
    const customer = await findOrCreateCustomer({
      firstName: first || 'Guardian',
      lastName: last || '',
      email
    });
    const furmilySelections = pickFieldsByPrefix(payload, 'furmily_pet_');

    const extraNotes = {
      intake_notes: payload.dd_notes || payload.pf_communicate || payload.bg_story || payload.pack_goal || '',
      keepsake_notes: payload.k_notes || '',
      community_request: payload.pass_n_prints ? true : false,
      quick_tone: payload.qq_tone || '',
      quick_prompt: payload.qq_prompt || '',
      quick_context: payload.qq_context || '',
      relationship: payload.relationship || '',
      timezone: payload.timezone || '',
      age: payload.age || '',
      sex: payload.sex || '',
      owner_duration: payload.owner_duration || '',
      rescue_rehomed: payload.rescue_rehomed || '',
      rescue_details: payload.rescue_details || '',
      home_environment: payload.home_environment || '',
      energy_level: payload.energy_level || '',
      primary_goal: payload.primary_goal || '',
      top_concerns: payload.top_concerns || '',
      behavior_notes: payload.behavior_notes || '',
      health_notes: payload.health_notes || '',
      training_history: payload.training_history || '',
      birth_time: payload.birth_time || '',
      birth_location: payload.birth_location || payload.sc_location || '',
      birth_unknown_notes: payload.birth_unknown_notes || '',
      owner_tone: payload.owner_tone || payload.qq_tone || '',
      spiritual_level: payload.spiritual_level || '',
      want_action_steps: payload.want_action_steps || '',
      avoid_mentions: payload.avoid_mentions || '',
      core_photo_face: toBoolean(payload.core_photo_face),
      core_photo_full_body: toBoolean(payload.core_photo_full_body),
      core_photo_paw: toBoolean(payload.core_photo_paw),
      core_photo_candid: toBoolean(payload.core_photo_candid),
      core_photo_memorial: toBoolean(payload.core_photo_memorial),
      bg_behaviors: payload.bg_behaviors || '',
      bg_start: payload.bg_start || payload.bg_when || '',
      bg_triggers: payload.bg_triggers || '',
      bg_frequency_intensity: payload.bg_frequency_intensity || '',
      bg_helps_worse: payload.bg_helps_worse || '',
      bg_routine: payload.bg_routine || '',
      bg_recent_changes: payload.bg_recent_changes || payload.bg_changes || '',
      bg_vet_notes: payload.bg_vet_notes || '',
      pl_opt_in: payload.pl_opt_in || '',
      pl_depth: payload.pl_depth || '',
      pl_avoid: payload.pl_avoid || '',
      pl_focus: payload.pl_focus || '',
      pl_paw_photos: payload.pl_paw_photos || '',
      bc_birth_date: payload.birth_date || '',
      bc_birth_time: payload.sc_time || payload.birth_time || '',
      bc_birth_location: payload.sc_location || payload.birth_location || '',
      bc_unknown_notes: payload.bc_unknown_notes || payload.birth_unknown_notes || '',
      memorial_story: payload.memorial_story || '',
      memorial_quirks: payload.memorial_quirks || '',
      memorial_hardest_part: payload.memorial_hardest_part || '',
      memorial_closure_message: payload.memorial_closure_message || '',
      memorial_spiritual_level: payload.memorial_spiritual_level || '',
      memorial_avoid: payload.memorial_avoid || '',
      pf_traits: payload.pf_traits || '',
      pf_love: payload.pf_love || '',
      pf_communicate: payload.pf_communicate || '',
      pf_bond: payload.pf_bond || '',
      bg_focus: payload.bg_focus || '',
      bg_story: payload.bg_story || '',
      dd_focus: payload.dd_focus || '',
      dd_notes: payload.dd_notes || '',
      paw_source: payload.paw_source || '',
      vision_style: payload.vision_style || '',
      sc_time: payload.sc_time || '',
      sc_location: payload.sc_location || '',
      pack_goal: payload.pack_goal || '',
      allpaws_notes: payload.allpaws_notes || '',
      furmily_count: payload.furmily_count || '',
      furmily_selections: furmilySelections,
      k_ship_name: payload.k_ship_name || '',
      k_ship_email: payload.k_ship_email || '',
      k_ship_phone: payload.k_ship_phone || '',
      k_ship_address1: payload.k_ship_address1 || '',
      k_ship_address2: payload.k_ship_address2 || '',
      k_ship_city: payload.k_ship_city || '',
      k_ship_state: payload.k_ship_state || '',
      k_ship_postal: payload.k_ship_postal || '',
      k_ship_country: payload.k_ship_country || '',
      k_quote: payload.k_quote || '',
      k_excerpt: payload.k_excerpt || '',
      k_style: payload.k_style || '',
      k_memorial_format: payload.k_memorial_format || '',
      k_memorial_orientation: payload.k_memorial_orientation || '',
      k_chart_format: payload.k_chart_format || '',
      k_chart_style: payload.k_chart_style || '',
      k_apparel_item: payload.k_apparel_item || '',
      k_apparel_size: payload.k_apparel_size || '',
      k_apparel_color: payload.k_apparel_color || '',
      k_apparel_art_source: payload.k_apparel_art_source || '',
      k_apparel_text: payload.k_apparel_text || '',
      k_tag_name: payload.k_tag_name || '',
      k_tag_dates: payload.k_tag_dates || '',
      k_tag_material: payload.k_tag_material || '',
      k_tag_shape: payload.k_tag_shape || '',
      selected_services: services,
      keepsakes
    };

    const pet = await findOrCreatePet({
      customer_id: customer.id,
      name: petName,
      species: payload.species || payload.pet_species || payload.pet_type || null,
      breed: payload.breed || payload.pet_breed || payload.petBreed || null,
      age: payload.age || payload.pet_age || payload.petAge || null,
      birth_date: payload.birth_date || null,
      gender: payload.sex || payload.petGender || payload.pet_gender || null,
      is_fixed: payload.petFixed || payload.pet_fixed || null,
      is_memorial: payload.pm_status ? payload.pm_status !== 'Living' : false,
      personality_description: payload.personality_description || payload.pf_traits || null,
      memorial_message: payload.pm_message || payload.memorial_message || null,
      additional_notes: Object.values(extraNotes).some(Boolean) ? JSON.stringify(extraNotes) : null
    });

    const wagbookSelected = toBoolean(payload.wagbook_selected) || keepsakes.includes('printed_book');
    const wagbookReferenceImages = [
      ...normalizeArray(payload.wagbook_reference_images),
      ...normalizeArray(payload.wagbook_reference_files)
    ].filter(Boolean);

    const reading = await createReading({
      customer_id: customer.id,
      pet_id: pet.id,
      services,
      consent_acknowledged: toBoolean(payload.consent),
      notes: payload.k_notes || null,
      total_price: totalPrice,
      wagbook_requested: wagbookSelected,
      wagbook_character_names: payload.wagbook_character_names || null,
      wagbook_storyline: payload.wagbook_storyline || null,
      wagbook_reference_images: wagbookSelected ? wagbookReferenceImages : [],
      wagbook_cover_image: payload.wagbook_cover_image || null,
      wagbook_price: wagbookSelected ? WAGBOOK_PRICE : 0,
      keepsakes,
      keepsake_status: keepsakes.length ? 'queued' : 'none',
      keepsake_last_error: null
    });

    if (keepsakes.length) {
      try {
        await createKeepsakeOrders({ reading, customer, pet, keepsakes, services, extraNotes });
      } catch (keepsakeError) {
        console.warn('Unable to queue keepsake orders', keepsakeError.message || keepsakeError);
        try {
          await supabaseFetch(`/rest/v1/readings?id=eq.${encodeURIComponent(reading.id)}`, {
            method: 'PATCH',
            body: {
              keepsake_status: 'failed',
              keepsake_last_error: keepsakeError.message || 'Unable to queue keepsake order.'
            }
          });
        } catch (patchError) {
          console.warn('Unable to persist keepsake queue error', patchError.message || patchError);
        }
      }
    }

    try {
      await upsertResendContact({
        email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        properties: {
          last_order_id: reading.id,
          last_pet_name: petName,
          last_services: services.join(', ')
        }
      });
    } catch (contactError) {
      console.warn('Resend contact sync failed', contactError.message || contactError);
    }

    return jsonResponse(200, { ok: true, readingId: reading.id, total_price: totalPrice });
  } catch (error) {
    console.error('Intake submit failed', error.message);
    return jsonResponse(500, { error: error.message || 'Unable to submit intake.' });
  }
};
