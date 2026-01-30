const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function buildHtml({ widthIn, heightIn, spineIn, title, personalMessage, bleedIn, safeIn }) {
  const totalWidth = widthIn;
  const totalHeight = heightIn;
  const spineWidth = spineIn;
  const bleed = bleedIn ?? 0.125;
  const safe = safeIn ?? 0.75;
  const frontWidth = (totalWidth - spineWidth) / 2;
  const backWidth = frontWidth;
  const backLeft = 0;
  const spineLeft = backWidth;
  const frontLeft = backWidth + spineWidth;

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: ${totalWidth}in ${totalHeight}in; margin: 0; }
          html, body { margin: 0; padding: 0; }
          body { font-family: "Georgia", "Times New Roman", serif; }
          .sheet {
            position: relative;
            width: ${totalWidth}in;
            height: ${totalHeight}in;
            background: #fff;
          }
          .panel {
            position: absolute;
            top: 0;
            height: 100%;
          }
          .back {
            left: ${backLeft}in;
            width: ${backWidth}in;
            background: #f6f2ea;
          }
          .spine {
            left: ${spineLeft}in;
            width: ${spineWidth}in;
            background: #f6f2ea;
          }
          .front {
            left: ${frontLeft}in;
            width: ${frontWidth}in;
            background: #fff;
            overflow: hidden;
          }
          .title {
            position: absolute;
            top: ${safe}in;
            left: ${frontLeft + safe}in;
            right: ${safe}in;
            text-align: center;
            font-size: 44px;
            font-weight: 600;
            color: #1d1d1d;
          }
          .message {
            position: absolute;
            bottom: ${safe}in;
            left: ${safe}in;
            width: ${backWidth - safe * 2}in;
            text-align: left;
            font-size: 16px;
            color: #2d2d2d;
            white-space: pre-wrap;
          }
          .bleed-line {
            position: absolute;
            inset: ${bleed}in;
            border: 1px dashed rgba(0,0,0,0.1);
            pointer-events: none;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="panel back"></div>
          <div class="panel spine"></div>
          <div class="panel front">
          </div>
          <div class="title">${title || 'Wag Book'}</div>
          <div class="message">${personalMessage || ''}</div>
          <div class="bleed-line"></div>
        </div>
      </body>
    </html>
  `;
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    const title = payload.title || 'Wag Book';
    const personalMessage = payload.personalMessage || '';
    const widthIn = Number(payload.coverWidthIn);
    const heightIn = Number(payload.coverHeightIn);
    const spineIn = Number(payload.spineWidthIn);
    const bleedIn = payload.bleedIn !== undefined ? Number(payload.bleedIn) : 0.125;
    const safeIn = payload.safeIn !== undefined ? Number(payload.safeIn) : 0.75;

    if (!widthIn || !heightIn || !spineIn) {
      return jsonResponse(400, { error: 'coverWidthIn, coverHeightIn, and spineWidthIn are required.' });
    }

    const html = buildHtml({
      widthIn,
      heightIn,
      spineIn,
      title,
      personalMessage,
      bleedIn,
      safeIn
    });

    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      printBackground: true,
      width: `${widthIn}in`,
      height: `${heightIn}in`,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    await browser.close();

    const pdfBase64 = pdfBuffer.toString('base64');
    let pdfUrl = '';
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_WAGBOOK_BUCKET || 'wagbook-pdfs';
    if (supabaseUrl && supabaseKey) {
      const filename = `wagbook-cover-${Date.now()}.pdf`;
      const uploadPath = `${bucket}/${filename}`;
      const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${uploadPath}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
          'Content-Type': 'application/pdf'
        },
        body: pdfBuffer
      });
      if (uploadResponse.ok) {
        pdfUrl = `${supabaseUrl}/storage/v1/object/public/${uploadPath}`;
      }
    }

    return jsonResponse(200, {
      pdfBase64,
      pdfUrl,
      widthIn,
      heightIn,
      spineIn
    });
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'Cover PDF generation failed.' });
  }
};
