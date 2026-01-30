function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const interiorUrl = payload?.interiorPdfUrl;
    const coverUrl = payload?.coverPdfUrl;
    const interiorBase64 = payload?.interiorPdfBase64;
    const coverBase64 = payload?.coverPdfBase64;
    if ((!interiorUrl && !interiorBase64) || (!coverUrl && !coverBase64)) {
      return jsonResponse(400, { error: 'Interior and cover PDFs are required to print.' });
    }

    return jsonResponse(200, {
      ok: true,
      order: {
        id: `lulu_${Date.now()}`,
        status: 'queued',
        quantity: 1,
        destination: 'United States',
        shipping: 'Mail | trackable'
      }
    });
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Unable to place print order.' });
  }
};
