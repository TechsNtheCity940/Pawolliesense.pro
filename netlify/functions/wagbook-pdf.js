const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  };
}

function buildPages({ title, subtitle, dedication, storyPages, imagePages }) {
  const pages = [];
  pages.push({ type: 'title', text: title, subtitle });
  storyPages.forEach((story, index) => {
    pages.push({ type: 'story', text: story.text });
    pages.push({ type: 'image', imageUrl: imagePages[index]?.imageUrl || '' });
  });
  pages.push({ type: 'end', text: dedication || '' });
  return pages;
}

function buildHtml({ title, subtitle, dedication, pages }) {
  const pageHtml = pages.map((page, index) => {
    if (page.type === 'title') {
      return `
        <section class="page page-title">
          <div class="title-block">
            <h1>${title}</h1>
            <p>${subtitle || 'Wag Book'}</p>
          </div>
        </section>
      `;
    }
    if (page.type === 'story') {
      return `
        <section class="page page-story">
          <div class="page-number">${index + 1}</div>
          <div class="story-text">${page.text || ''}</div>
        </section>
      `;
    }
    if (page.type === 'image') {
      return `
        <section class="page page-image">
          <div class="page-number">${index + 1}</div>
          ${page.imageUrl ? `<img src="${page.imageUrl}" alt="Story image" />` : '<div class="image-placeholder">Image pending</div>'}
        </section>
      `;
    }
    if (page.type === 'end') {
      return `
        <section class="page page-end">
          <div class="page-number">${index + 1}</div>
          <div class="dedication">${dedication || 'With love.'}</div>
        </section>
      `;
    }
    return `
      <section class="page page-blank">
        <div class="page-number">${index + 1}</div>
      </section>
    `;
  }).join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          @page {
            size: 8.5in 11in;
            margin: 0;
          }
          html, body {
            margin: 0;
            padding: 0;
            font-family: "Georgia", "Times New Roman", serif;
            color: #1d1d1d;
          }
          .page {
            width: 8.5in;
            height: 11in;
            box-sizing: border-box;
            padding: 0.6in 0.7in;
            page-break-after: always;
            position: relative;
            background: #fff;
          }
          .page:last-child {
            page-break-after: auto;
          }
          .page-number {
            position: absolute;
            bottom: 0.4in;
            right: 0.6in;
            font-size: 12px;
            color: #888;
          }
          .page-title {
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .page-title h1 {
            font-size: 44px;
            margin: 0 0 12px;
          }
          .page-title p {
            font-size: 16px;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 0;
            color: #777;
          }
          .page-story {
            display: flex;
            flex-direction: column;
          }
          .story-text {
            font-size: 20px;
            line-height: 1.8;
            white-space: pre-wrap;
            text-align: justify;
            height: 100%;
          }
          .page-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 12px;
          }
          .image-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px dashed #cfcfcf;
            color: #999;
            border-radius: 12px;
            font-size: 16px;
          }
          .page-end {
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
            gap: 16px;
          }
          .page-end .dedication {
            font-size: 22px;
          }
        </style>
      </head>
      <body>
        ${pageHtml}
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
    const storyPages = Array.isArray(payload.storyPages) ? payload.storyPages : [];
    const imagePages = Array.isArray(payload.imagePages) ? payload.imagePages : [];
    const title = payload.title || 'Wag Book';
    const subtitle = payload.subtitle || '';
    const dedication = payload.dedication || '';

    if (storyPages.length !== 11 || imagePages.length !== 11) {
      return jsonResponse(400, { error: 'Story and image pages must both be 11 items.' });
    }

    const pages = buildPages({ title, subtitle, dedication, storyPages, imagePages });
    if (pages.length !== 24) {
      return jsonResponse(400, { error: 'PDF must contain exactly 24 pages.' });
    }

    const html = buildHtml({ title, subtitle, dedication, pages });

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
      format: 'letter',
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });
    await browser.close();

    const pdfBase64 = pdfBuffer.toString('base64');
    let pdfUrl = '';
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_WAGBOOK_BUCKET || 'wagbook-pdfs';
    if (supabaseUrl && supabaseKey) {
      const filename = `wagbook-interior-${Date.now()}.pdf`;
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
      pageCount: pages.length
    });
  } catch (error) {
    return jsonResponse(500, { error: error.message || 'PDF generation failed.' });
  }
};
