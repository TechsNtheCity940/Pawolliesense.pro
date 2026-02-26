const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = 'pet-photos';
const MAX_BYTES = 10 * 1024 * 1024;

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

const safeSegment = (value, fallback = 'unknown') => {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 60);
  return cleaned || fallback;
};

const supabaseFetch = async (path, { method = 'GET', body, headers = {}, prefer = 'return=representation' } = {}) => {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials are missing.');
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: prefer,
      ...headers
    },
    body
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.message || data?.error || data?.details || 'Supabase request failed.';
    throw new Error(message);
  }
  return data;
};

const getReading = async (readingId) => {
  const data = await supabaseFetch(
    `/rest/v1/readings?id=eq.${encodeURIComponent(readingId)}&select=id,customer_id,pet_id,customers(id,first_name,last_name,email,profile_image_url),pets(id,name,primary_image_url)&limit=1`
  );
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) {
    throw new Error('Reading not found.');
  }
  return row;
};

const patchCustomerProfilePhoto = async (customerId, photoUrl) => {
  if (!customerId || !photoUrl) return;
  await supabaseFetch(`/rest/v1/customers?id=eq.${encodeURIComponent(customerId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile_image_url: photoUrl })
  });
};

const patchPetPrimaryPhoto = async (petId, photoUrl) => {
  if (!petId || !photoUrl) return;
  await supabaseFetch(`/rest/v1/pets?id=eq.${encodeURIComponent(petId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ primary_image_url: photoUrl })
  });
};

const inferExtension = (name, fileType) => {
  const fromName = String(name || '').split('.').pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  const fromType = String(fileType || '').toLowerCase();
  if (fromType === 'image/jpeg') return 'jpg';
  if (fromType === 'image/png') return 'png';
  if (fromType === 'image/webp') return 'webp';
  if (fromType === 'image/gif') return 'gif';
  return 'jpg';
};

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const readingId = String(payload.readingId || '').trim();
    const originalName = String(payload.fileName || '').trim();
    const fileType = String(payload.fileType || '').trim().toLowerCase();
    const photoType = safeSegment(payload.photoType || 'intake_photo', 'intake_photo');
    const base64Input = String(payload.base64 || '').trim();

    if (!readingId || !base64Input) {
      return jsonResponse(400, { error: 'Missing readingId or file content.' });
    }
    if (!fileType.startsWith('image/')) {
      return jsonResponse(400, { error: 'Only image uploads are allowed.' });
    }

    const reading = await getReading(readingId);
    const base64 = base64Input.includes(',') ? base64Input.split(',').pop() : base64Input;
    const buffer = Buffer.from(base64 || '', 'base64');
    if (!buffer.length) {
      return jsonResponse(400, { error: 'Invalid image payload.' });
    }
    if (buffer.length > MAX_BYTES) {
      return jsonResponse(413, { error: 'Image too large. Maximum file size is 10MB.' });
    }

    const lastName = reading?.customers?.last_name || reading?.customers?.email || 'customer';
    const petName = reading?.pets?.name || 'pet';
    const ext = inferExtension(originalName, fileType);
    const suffix = Math.random().toString(36).slice(2, 8);
    const path = `${safeSegment(lastName, 'customer')}/${safeSegment(petName, 'pet')}/${safeSegment(readingId, 'reading')}/${photoType}_${Date.now()}_${suffix}.${ext}`;
    const storagePath = path
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    await supabaseFetch(`/storage/v1/object/${BUCKET}/${storagePath}`, {
      method: 'POST',
      headers: {
        'Content-Type': fileType,
        'x-upsert': 'false'
      },
      body: buffer,
      prefer: 'return=minimal'
    });

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;
    const fileRows = await supabaseFetch('/rest/v1/uploaded_files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_id: reading.customer_id,
        pet_id: reading.pet_id,
        reading_id: reading.id,
        file_name: path,
        original_name: originalName || path.split('/').pop(),
        file_type: fileType,
        file_size: buffer.length,
        storage_path: publicUrl,
        photo_type: photoType
      })
    });

    const saved = Array.isArray(fileRows) ? fileRows[0] : fileRows;

    const isOwnerPhoto = ['owner_profile', 'guardian_profile'].includes(photoType);
    if (isOwnerPhoto && !reading?.customers?.profile_image_url) {
      try {
        await patchCustomerProfilePhoto(reading.customer_id, publicUrl);
      } catch (error) {
        console.warn('Unable to set customer profile image', error.message || error);
      }
    } else if (!isOwnerPhoto && !reading?.pets?.primary_image_url) {
      try {
        await patchPetPrimaryPhoto(reading.pet_id, publicUrl);
      } catch (error) {
        console.warn('Unable to set pet primary image', error.message || error);
      }
    }

    return jsonResponse(200, {
      ok: true,
      file: {
        id: saved?.id,
        storage_path: publicUrl,
        file_name: path
      }
    });
  } catch (error) {
    console.error('intake-upload-photo error', error.message);
    return jsonResponse(500, { error: error.message || 'Unable to upload image.' });
  }
};
