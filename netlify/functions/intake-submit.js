const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function createPet(payload) {
  let nextPayload = { ...payload };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const pet = await supabaseFetch('/rest/v1/pets', {
        method: 'POST',
        body: nextPayload
      });
      return Array.isArray(pet) ? pet[0] : pet;
    } catch (error) {
      const missingColumn = parseMissingColumn(error.message, 'pets');
      if (!missingColumn || !(missingColumn in nextPayload)) {
        throw error;
      }
      delete nextPayload[missingColumn];
    }
  }
  throw new Error('Unable to create pet record.');
}

async function createReading(payload) {
  const reading = await supabaseFetch('/rest/v1/readings', {
    method: 'POST',
    body: payload
  });
  return Array.isArray(reading) ? reading[0] : reading;
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

    const extraNotes = {
      intake_notes: payload.dd_notes || payload.pf_communicate || payload.bg_story || payload.pack_goal || '',
      keepsake_notes: payload.k_notes || '',
      community_request: payload.pass_n_prints ? true : false,
      quick_tone: payload.qq_tone || '',
      quick_prompt: payload.qq_prompt || '',
      quick_context: payload.qq_context || '',
      relationship: payload.relationship || '',
      timezone: payload.timezone || '',
      selected_services: services,
      keepsakes: normalizeArray(payload.keepsakes)
    };

    const pet = await createPet({
      customer_id: customer.id,
      name: petName,
      species: payload.species || payload.pet_species || null,
      breed: payload.breed || payload.pet_breed || null,
      birth_date: payload.birth_date || null,
      gender: payload.petGender || payload.pet_gender || null,
      is_fixed: payload.petFixed || payload.pet_fixed || null,
      is_memorial: payload.pm_status ? payload.pm_status !== 'Living' : false,
      personality_description: payload.personality_description || payload.pf_traits || null,
      memorial_message: payload.pm_message || payload.memorial_message || null,
      additional_notes: Object.values(extraNotes).some(Boolean) ? JSON.stringify(extraNotes) : null
    });

    const keepsakes = normalizeArray(payload.keepsakes);
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
      wagbook_price: wagbookSelected ? WAGBOOK_PRICE : 0
    });

    return jsonResponse(200, { ok: true, readingId: reading.id, total_price: totalPrice });
  } catch (error) {
    console.error('Intake submit failed', error.message);
    return jsonResponse(500, { error: error.message || 'Unable to submit intake.' });
  }
};
