const crypto = require('crypto');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function makeId() {
  return crypto.randomBytes(6).toString('hex');
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const petName = payload.petName || 'Pet';
    const guardianName = payload.guardianName || 'Guardian';
    const characterNames = payload.characterNames || '';
    const storyline = payload.storyline || '';
    const referenceImages = Array.isArray(payload.referenceImages) ? payload.referenceImages : [];
    const coverImage = payload.coverImage || referenceImages[0] || '';

    if (!coverImage) {
      return jsonResponse(400, { error: 'Cover image is required.' });
    }

    const pages = [
      {
        id: `page-${makeId()}`,
        title: 'Chapter 1: The First Hello',
        body: `${petName} arrived like a spark—curious, gentle, and full of quiet bravery.`,
        imageUrl: referenceImages[1] || coverImage
      },
      {
        id: `page-${makeId()}`,
        title: 'Chapter 2: Soulful Adventures',
        body: `From sunlit strolls to late-night cuddles, ${petName} turned ordinary moments into luminous memories.`,
        imageUrl: referenceImages[2] || coverImage
      },
      {
        id: `page-${makeId()}`,
        title: 'Chapter 3: A Love That Stays',
        body: `This chapter is a gentle letter to ${petName} from ${guardianName}, honoring a bond that never fades.`,
        imageUrl: referenceImages[3] || coverImage
      }
    ];

    return jsonResponse(200, {
      ok: true,
      draft: {
        title: `${petName}'s Wag Book`,
        subtitle: `A keepsake journey for ${guardianName}`,
        coverImage,
        pages,
        metadata: {
          characterNames,
          storyline
        }
      }
    });
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Unable to generate draft.' });
  }
};
