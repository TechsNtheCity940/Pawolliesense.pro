function initDrawer() {
  const drawer = document.getElementById('site-drawer') ?? document.querySelector('.drawer');
  const openBtn = document.querySelector('.menu-btn[aria-controls="site-drawer"]');
  const closeBtn = document.querySelector('[data-drawer-close]');
  const backdrop = document.querySelector('.drawer-backdrop');

  if (!drawer || !openBtn || !backdrop) return;
  if (drawer.dataset.pawollieInit === 'true') return;
  drawer.dataset.pawollieInit = 'true';

  const focusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function getFocusableElements() {
    return Array.from(drawer.querySelectorAll(focusableSelector)).filter(
      (el) => el instanceof HTMLElement && el.getAttribute('aria-hidden') !== 'true'
    );
  }

  function openDrawer() {
    drawer.classList.add('open');
    backdrop.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    const focusable = getFocusableElements();
    const firstTarget = focusable[0] ?? closeBtn ?? drawer;
    firstTarget?.focus?.();
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    backdrop.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    openBtn.focus?.();
  }

  openBtn.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) closeDrawer();
    else openDrawer();
  });

  closeBtn?.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);

  drawer.addEventListener('click', (e) => {
    const target = e.target;
    if (target instanceof HTMLAnchorElement) closeDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape') {
      closeDrawer();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = getFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (!(active instanceof HTMLElement) || !drawer.contains(active)) {
      e.preventDefault();
      first.focus();
      return;
    }

    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
      return;
    }

    if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  });
}

const SERVICE_CATALOG = {
  full_soul_profile: { label: 'Full Soul Discovery Profile', price: 30 },
  behavior_spirit_scan: { label: 'Personality & Behavior Spirit Scan', price: 20 },
  canine_birth_chart: { label: 'Canine Birth Chart', price: 15 },
  past_life_pawprint: { label: 'Past-Life Pawprint Reading', price: 5 },
  quick_quest: { label: 'Quick Quest', price: 5 }
};

const DAILY_SERVICES = {
  pawollie_vision: { label: 'Pawollie Vision', solo: 4.99, paired: 2.99 },
  pawsitive_pupdate: { label: 'Pawsitive Pupdate', solo: 4.99, paired: 2.99 }
};

const ADD_ONS = {
  soul_transition: 'Soul Transition and Next-Life Pathway',
  golden_aura: 'Golden Aura Glow',
  bonding_guidance: 'Bonding Guidance Card',
  extra_photos: 'Extra Photo Add-On'
};

function formatUSD(amount) {
  const asNumber = Number(amount);
  if (!Number.isFinite(asNumber)) return '$0.00';
  return `$${asNumber.toFixed(2)}`;
}

function slugifyForFilename(value) {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 60);
}

function initIntakeForm() {
  const form = document.getElementById('intake-form');
  if (!form) return;
  if (form.dataset.pawollieInit === 'true') return;
  form.dataset.pawollieInit = 'true';

  const ownerLastName = document.getElementById('owner_last_name');
  const serviceSelect = document.getElementById('service_purchased');
  const photosInput = document.getElementById('photos');
  const photoError = document.getElementById('photo_error');
  const photoCountHint = document.getElementById('photo_count_hint');
  const photoConfirmationText = document.getElementById('photo_confirmation_text');
  const servicePriceDisplay = document.getElementById('service_price_display');
  const serviceError = document.getElementById('service_error');
  const summaryService = document.getElementById('summary_service_label');
  const summaryAddOns = document.getElementById('summary_add_ons');
  const summaryDaily = document.getElementById('summary_daily_services');
  const summaryPhotos = document.getElementById('summary_photos');

  const memorialFields = document.getElementById('memorial_fields');
  const dateOfPassing = document.getElementById('date_of_passing');
  const rememberedAs = document.getElementById('remembered_as');
  const memorialVisibilityInputs = Array.from(
    form.querySelectorAll('input[name="memorial_visibility"]')
  );
  const petStatusInputs = Array.from(form.querySelectorAll('input[name="pet_status"]'));

  const addOnInputs = Array.from(form.querySelectorAll('input[name="add_ons"]'));
  const dailyInputs = Array.from(form.querySelectorAll('input[name="daily_services"]'));
  const serviceSections = Array.from(form.querySelectorAll('[data-service-section]'));
  const addOnSections = Array.from(form.querySelectorAll('[data-addon-section]'));

  const hiddenSelectedService = form.querySelector('input[name="selected_service_label"]');
  const hiddenSelectedAddOns = form.querySelector('input[name="selected_add_ons_csv"]');
  const hiddenSelectedDaily = form.querySelector('input[name="selected_daily_services_csv"]');
  const hiddenEstimatedPrice = form.querySelector('input[name="estimated_price"]');
  const hiddenOwnerLastName = form.querySelector('input[name="owner_last_name_derived"]');
  const hiddenPhotoPrefix = form.querySelector('input[name="photo_label_prefix"]');

  const birthTimeStatus = document.getElementById('birth_time_status');
  const birthTimeField = document.getElementById('birth_time_field');
  const birthTimeInput = document.getElementById('birth_time');

  function setRequiredInSection(section, isRequired) {
    const requiredFields = section.querySelectorAll('[data-required]');
    requiredFields.forEach((field) => {
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
        field.required = isRequired;
      }
    });
  }

  function updateServiceSections() {
    const selected = serviceSelect instanceof HTMLSelectElement ? serviceSelect.value : '';
    serviceSections.forEach((section) => {
      const key = section.getAttribute('data-service-section');
      const isActive = key === selected;
      section.hidden = !isActive;
      setRequiredInSection(section, isActive);
    });
  }

  function updateAddOnSections() {
    const selected = new Set(addOnInputs.filter((input) => input.checked).map((input) => input.value));
    addOnSections.forEach((section) => {
      const key = section.getAttribute('data-addon-section');
      const isActive = selected.has(key ?? '');
      section.hidden = !isActive;
      setRequiredInSection(section, isActive);
    });
  }

  function getPhotoLimit() {
    const hasExtra = addOnInputs.some((input) => input.value === 'extra_photos' && input.checked);
    return { min: 2, max: hasExtra ? 5 : 4 };
  }

  function updatePhotoHints() {
    const { min, max } = getPhotoLimit();
    if (photoConfirmationText) {
      photoConfirmationText.textContent = `I have uploaded ${min} to ${max} photos named using my LAST NAME.`;
    }
    if (photoCountHint) {
      photoCountHint.textContent = max === 5 ? 'Extra Photo Add-On allows 5 uploads.' : '';
    }
    if (summaryPhotos) {
      summaryPhotos.textContent = max === 5 ? '2-5 required' : '2-4 required';
    }
  }

  function updateBirthTimeField() {
    if (!(birthTimeStatus instanceof HTMLSelectElement)) return;
    const showTime = birthTimeStatus.value === 'exact';
    if (birthTimeField) birthTimeField.hidden = !showTime;
    if (birthTimeInput instanceof HTMLInputElement) {
      birthTimeInput.required = showTime;
    }
  }

  function setMemorialVisibility() {
    const status = petStatusInputs.find((i) => i.checked)?.value ?? 'living';
    const isPassed = status === 'passed';

    if (memorialFields) memorialFields.hidden = !isPassed;
    if (dateOfPassing instanceof HTMLInputElement) dateOfPassing.required = isPassed;
    if (rememberedAs instanceof HTMLTextAreaElement) rememberedAs.required = isPassed;
    memorialVisibilityInputs.forEach((input) => {
      if (input instanceof HTMLInputElement) input.required = isPassed;
    });
  }

  function updateHiddenFields() {
    const key = serviceSelect instanceof HTMLSelectElement ? serviceSelect.value : '';
    const service = key ? SERVICE_CATALOG[key] : null;
    const selectedDaily = dailyInputs.filter((input) => input.checked).map((input) => input.value);
    const dailyLabels = selectedDaily.map((value) => DAILY_SERVICES[value]?.label || value);
    const hasCore = Boolean(service);
    const dailyTotal = selectedDaily.reduce((sum, value) => {
      const entry = DAILY_SERVICES[value];
      if (!entry) return sum;
      const price = hasCore ? entry.paired : entry.solo;
      return sum + price;
    }, 0);
    const total = (service ? service.price : 0) + dailyTotal;

    if (servicePriceDisplay) servicePriceDisplay.textContent = formatUSD(total);
    if (hiddenSelectedService) {
      if (service && dailyLabels.length) {
        hiddenSelectedService.value = `${service.label}; Daily: ${dailyLabels.join(' + ')}`;
      } else if (service) {
        hiddenSelectedService.value = service.label;
      } else if (dailyLabels.length) {
        hiddenSelectedService.value = `Daily Services Only: ${dailyLabels.join(' + ')}`;
      } else {
        hiddenSelectedService.value = '';
      }
    }
    if (hiddenEstimatedPrice) hiddenEstimatedPrice.value = String(total);

    const selectedAddOns = addOnInputs.filter((input) => input.checked).map((input) => input.value);
    if (hiddenSelectedAddOns) hiddenSelectedAddOns.value = selectedAddOns.join(', ');
    if (hiddenSelectedDaily) hiddenSelectedDaily.value = dailyLabels.join(', ');

    const addOnLabels = selectedAddOns.map((value) => ADD_ONS[value] || value);
    if (summaryService) {
      summaryService.textContent = service ? service.label : (dailyLabels.length ? 'Daily services only' : 'Select a service');
    }
    if (summaryAddOns) {
      summaryAddOns.textContent = addOnLabels.length ? addOnLabels.join(', ') : 'None selected';
    }
    if (summaryDaily) {
      summaryDaily.textContent = dailyLabels.length ? dailyLabels.join(', ') : 'None selected';
    }

    const lastNameRaw = ownerLastName instanceof HTMLInputElement ? ownerLastName.value : '';
    const lastName = slugifyForFilename(lastNameRaw) || 'Customer';
    if (hiddenOwnerLastName) hiddenOwnerLastName.value = lastNameRaw;

    const prefix = `${lastName.toUpperCase()}`;
    if (hiddenPhotoPrefix) hiddenPhotoPrefix.value = prefix;
  }

  function validateServiceSelection() {
    const key = serviceSelect instanceof HTMLSelectElement ? serviceSelect.value : '';
    const hasDaily = dailyInputs.some((input) => input.checked);
    const message = key || hasDaily ? '' : 'Please select a core service or a daily service.';
    if (serviceSelect instanceof HTMLSelectElement) serviceSelect.setCustomValidity(message);
    if (serviceError) serviceError.textContent = message;
    return !message;
  }

  function validatePhotos() {
    if (!(photosInput instanceof HTMLInputElement)) return true;

    const { min, max } = getPhotoLimit();
    const count = photosInput.files?.length ?? 0;
    let message = '';

    if (count < min) message = `Please upload at least ${min} photos.`;
    if (count > max) message = `Please upload no more than ${max} photos.`;

    photosInput.setCustomValidity(message);
    if (photoError) photoError.textContent = message;

    return !message;
  }

  function relabelPhotoFiles() {
    if (!(photosInput instanceof HTMLInputElement)) return;
    if (!photosInput.files?.length) return;
    if (typeof DataTransfer === 'undefined') return;

    const lastNameRaw = ownerLastName instanceof HTMLInputElement ? ownerLastName.value : '';
    const lastName = slugifyForFilename(lastNameRaw).toUpperCase() || 'CUSTOMER';
    const prefix = `${lastName}`;

    const dt = new DataTransfer();
    Array.from(photosInput.files).forEach((file, idx) => {
      const originalName = file.name || `photo_${idx + 1}`;
      const dotIndex = originalName.lastIndexOf('.');
      const hasExtension = dotIndex > 0 && dotIndex < originalName.length - 1;
      const ext = hasExtension ? originalName.slice(dotIndex + 1) : '';
      const cleanExt = slugifyForFilename(ext).toLowerCase();
      const newName = `${prefix}_${idx + 1}${cleanExt ? '.' + cleanExt : ''}`;
      dt.items.add(new File([file], newName, { type: file.type, lastModified: file.lastModified }));
    });

    photosInput.files = dt.files;
  }

  ownerLastName?.addEventListener('input', () => {
    updateHiddenFields();
  });

  serviceSelect?.addEventListener('change', () => {
    updateServiceSections();
    updateHiddenFields();
    validateServiceSelection();
  });

  addOnInputs.forEach((input) => {
    input.addEventListener('change', () => {
      updateAddOnSections();
      updatePhotoHints();
      updateHiddenFields();
      validatePhotos();
    });
  });

  dailyInputs.forEach((input) => {
    input.addEventListener('change', () => {
      updateHiddenFields();
      validateServiceSelection();
    });
  });

  petStatusInputs.forEach((input) =>
    input.addEventListener('change', () => {
      setMemorialVisibility();
    })
  );

  birthTimeStatus?.addEventListener('change', updateBirthTimeField);

  photosInput?.addEventListener('change', () => {
    validatePhotos();
  });

  form.addEventListener('submit', (e) => {
    updateServiceSections();
    updateAddOnSections();
    updatePhotoHints();
    updateBirthTimeField();
    setMemorialVisibility();
    updateHiddenFields();

    if (!validateServiceSelection()) {
      e.preventDefault();
      serviceSelect?.reportValidity?.();
      return;
    }

    if (!validatePhotos()) {
      e.preventDefault();
      photosInput?.reportValidity?.();
      return;
    }

    relabelPhotoFiles();
  });

  updateServiceSections();
  updateAddOnSections();
  updatePhotoHints();
  updateBirthTimeField();
  setMemorialVisibility();
  updateHiddenFields();
}

function initServicePickButtons() {
  const buttons = Array.from(document.querySelectorAll('[data-select-service]'));
  if (!buttons.length) return;

  const intakeForm = document.getElementById('intake-form');
  const serviceSelect = document.getElementById('service_purchased');

  buttons.forEach((btn) => {
    if (btn.dataset.pawollieInit === 'true') return;
    btn.dataset.pawollieInit = 'true';
    btn.addEventListener('click', (event) => {
      const key = btn.getAttribute('data-select-service');
      if (!key) return;

      if (!intakeForm) {
        window.location.href = `/intake?service=${encodeURIComponent(key)}`;
        return;
      }

      event.preventDefault();
      if (serviceSelect instanceof HTMLSelectElement) {
        serviceSelect.value = key;
        serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
        serviceSelect.focus?.();
      }
    });
  });
}

function initServicePreselectFromUrl() {
  const form = document.getElementById('intake-form');
  if (!form) return;

  const serviceSelect = document.getElementById('service_purchased');
  if (!(serviceSelect instanceof HTMLSelectElement)) return;

  const params = new URLSearchParams(window.location.search);
  const service = params.get('service');

  if (!service) return;

  window.setTimeout(() => {
    serviceSelect.value = service;
    serviceSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }, 0);
}

function initPhotoBooth() {
  const form = document.getElementById('photobooth-form');
  if (!form) return;
  if (form.dataset.pawollieInit === 'true') return;
  form.dataset.pawollieInit = 'true';

  const ownerFullName = document.getElementById('booth_owner_full_name');
  const petNameInput = document.getElementById('booth_pet_name');
  const photoInput = document.getElementById('booth_photo');
  const starsToggle = document.getElementById('booth_stars');
  const pawToggle = document.getElementById('booth_paw');
  const downloadBtn = document.getElementById('booth_download');
  const canvas = document.getElementById('booth_canvas');

  if (!(canvas instanceof HTMLCanvasElement) || !(photoInput instanceof HTMLInputElement)) return;

  const hiddenOwnerLastName = form.querySelector('input[name="owner_last_name_derived"]');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const pawMark = new Image();
  let pawMarkReady = false;
  pawMark.onload = () => {
    pawMarkReady = true;
    render();
  };
  pawMark.onerror = () => {
    pawMarkReady = false;
  };
  pawMark.src = '/assets/pawprint.png';

  let sourceImg = null;
  let seed = 1;
  let baseSeed = 1;
  let constellationPath = [];
  let nameConstellationPoints = [];
  let backgroundStars = [];
  let coverTransform = { scale: 1, offsetX: 0, offsetY: 0 };
  let dragIndex = null;
  let dragOffset = { x: 0, y: 0 };

  function seededRandom() {
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return ((seed < 0 ? ~seed + 1 : seed) % 1000) / 1000;
  }

  function setSeedFromFile(file) {
    const value = (file?.size ?? 0) + (file?.lastModified ?? 0);
    baseSeed = Number(value % 2147483647) || 1;
    seed = baseSeed;
  }

  function withSeed(nextSeed, fn) {
    const previous = seed;
    seed = nextSeed;
    const result = fn();
    seed = previous;
    return result;
  }

  function computeCoverTransform(img) {
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.width;
    const ih = img.height;
    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    coverTransform = { scale, offsetX: x, offsetY: y };
  }

  function drawCoverImage(img) {
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.width;
    const ih = img.height;
    const scale = coverTransform.scale || Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = coverTransform.offsetX ?? (cw - w) / 2;
    const y = coverTransform.offsetY ?? (ch - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  }

  function buildBackgroundStars() {
    backgroundStars = [];
    withSeed(baseSeed + 7, () => {
      const count = 140;
      for (let i = 0; i < count; i += 1) {
        backgroundStars.push({
          x: seededRandom() * canvas.width,
          y: seededRandom() * canvas.height,
          size: seededRandom() * 1.8 + 0.6,
          alpha: 0.2 + seededRandom() * 0.6
        });
      }
    });
  }

  function buildEdgeConstellation() {
    if (!sourceImg) {
      constellationPath = [];
      return;
    }

    const sampleWidth = 260;
    const scale = sampleWidth / sourceImg.width;
    const sampleHeight = Math.max(1, Math.round(sourceImg.height * scale));
    const offscreen = document.createElement('canvas');
    offscreen.width = sampleWidth;
    offscreen.height = sampleHeight;
    const octx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!octx) return;
    octx.drawImage(sourceImg, 0, 0, sampleWidth, sampleHeight);

    const imageData = octx.getImageData(0, 0, sampleWidth, sampleHeight);
    const total = sampleWidth * sampleHeight;
    const gray = new Float32Array(total);

    for (let i = 0; i < total; i += 1) {
      const offset = i * 4;
      const r = imageData.data[offset];
      const g = imageData.data[offset + 1];
      const b = imageData.data[offset + 2];
      gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    const magnitude = new Float32Array(total);
    let maxMag = 0;

    for (let y = 1; y < sampleHeight - 1; y += 1) {
      for (let x = 1; x < sampleWidth - 1; x += 1) {
        const idx = y * sampleWidth + x;
        const gx =
          -gray[idx - sampleWidth - 1] -
          2 * gray[idx - 1] -
          gray[idx + sampleWidth - 1] +
          gray[idx - sampleWidth + 1] +
          2 * gray[idx + 1] +
          gray[idx + sampleWidth + 1];
        const gy =
          -gray[idx - sampleWidth - 1] -
          2 * gray[idx - sampleWidth] -
          gray[idx - sampleWidth + 1] +
          gray[idx + sampleWidth - 1] +
          2 * gray[idx + sampleWidth] +
          gray[idx + sampleWidth + 1];
        const mag = Math.sqrt(gx * gx + gy * gy);
        magnitude[idx] = mag;
        if (mag > maxMag) maxMag = mag;
      }
    }

    const threshold = maxMag * 0.35;
    const marginX = sampleWidth * 0.12;
    const marginY = sampleHeight * 0.12;
    const edgePoints = [];

    for (let y = 2; y < sampleHeight - 2; y += 2) {
      for (let x = 2; x < sampleWidth - 2; x += 2) {
        if (x < marginX || x > sampleWidth - marginX) continue;
        if (y < marginY || y > sampleHeight - marginY) continue;
        const idx = y * sampleWidth + x;
        if (magnitude[idx] > threshold) {
          edgePoints.push({ x, y });
        }
      }
    }

    if (!edgePoints.length) {
      constellationPath = [];
      return;
    }

    const cx = edgePoints.reduce((sum, p) => sum + p.x, 0) / edgePoints.length;
    const cy = edgePoints.reduce((sum, p) => sum + p.y, 0) / edgePoints.length;

    const bins = 72;
    const selections = Array.from({ length: bins }, () => null);
    const distances = new Array(bins).fill(-1);

    edgePoints.forEach((point) => {
      const dx = point.x - cx;
      const dy = point.y - cy;
      const angle = Math.atan2(dy, dx);
      const idx = Math.min(bins - 1, Math.max(0, Math.floor(((angle + Math.PI) / (Math.PI * 2)) * bins)));
      const dist = dx * dx + dy * dy;
      if (dist > distances[idx]) {
        distances[idx] = dist;
        selections[idx] = point;
      }
    });

    const scaleX = sourceImg.width / sampleWidth;
    const scaleY = sourceImg.height / sampleHeight;
    const mapped = selections
      .filter(Boolean)
      .map((point) => {
        const originalX = point.x * scaleX;
        const originalY = point.y * scaleY;
        return {
          x: originalX * coverTransform.scale + coverTransform.offsetX,
          y: originalY * coverTransform.scale + coverTransform.offsetY
        };
      })
      .filter((point) => point.x >= -20 && point.x <= canvas.width + 20 && point.y >= -20 && point.y <= canvas.height + 20);

    if (mapped.length < 8) {
      constellationPath = [];
      return;
    }

    const mappedCx = mapped.reduce((sum, p) => sum + p.x, 0) / mapped.length;
    const mappedCy = mapped.reduce((sum, p) => sum + p.y, 0) / mapped.length;

    constellationPath = mapped
      .slice()
      .sort((a, b) => Math.atan2(a.y - mappedCy, a.x - mappedCx) - Math.atan2(b.y - mappedCy, b.x - mappedCx));
  }

  function buildNameConstellation() {
    const petName = String(petNameInput?.value ?? '').trim();
    if (!petName) {
      nameConstellationPoints = [];
      return;
    }

    const fontSize = Math.max(28, Math.round(canvas.width * 0.05));
    const textCanvas = document.createElement('canvas');
    const tctx = textCanvas.getContext('2d', { willReadFrequently: true });
    if (!tctx) return;
    tctx.font = `600 ${fontSize}px Cormorant Garamond, serif`;
    const metrics = tctx.measureText(petName);
    const textWidth = Math.ceil(metrics.width) + 10;
    const textHeight = Math.ceil(fontSize * 1.3);
    textCanvas.width = textWidth;
    textCanvas.height = textHeight;
    tctx.font = `600 ${fontSize}px Cormorant Garamond, serif`;
    tctx.fillStyle = '#ffffff';
    tctx.fillText(petName, 5, fontSize);

    const data = tctx.getImageData(0, 0, textWidth, textHeight).data;
    const points = [];
    for (let y = 0; y < textHeight; y += 3) {
      for (let x = 0; x < textWidth; x += 3) {
        const alpha = data[(y * textWidth + x) * 4 + 3];
        if (alpha > 120) points.push({ x, y });
      }
    }

    if (!points.length) {
      nameConstellationPoints = [];
      return;
    }

    const maxWidth = canvas.width * 0.42;
    const scale = Math.min(1, maxWidth / textWidth);
    const offsetX = canvas.width - textWidth * scale - 54;
    const offsetY = 54;
    nameConstellationPoints = points.map((point) => ({
      x: offsetX + point.x * scale,
      y: offsetY + point.y * scale
    }));
  }

  function drawStarField() {
    backgroundStars.forEach((star) => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawConstellation(points, options) {
    if (!points.length) return;
    const {
      lineAlpha = 0.35,
      starAlpha = 0.85,
      starSize = 2.2,
      lineWidth = 1.4,
      closePath = true
    } = options || {};

    ctx.save();
    ctx.strokeStyle = `rgba(255,255,255,${lineAlpha})`;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    points.forEach((point, idx) => {
      if (idx === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    if (closePath) ctx.closePath();
    ctx.stroke();

    ctx.shadowColor = 'rgba(255,255,255,0.6)';
    ctx.shadowBlur = 6;
    points.forEach((point, idx) => {
      ctx.beginPath();
      const isAnchor = idx % 6 === 0;
      const size = isAnchor ? starSize + 1.6 : starSize;
      const alpha = isAnchor ? Math.min(1, starAlpha + 0.2) : starAlpha;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
  }

  function findNearbyPoint(points, x, y) {
    const threshold = Math.max(12, canvas.width * 0.012);
    const thresholdSq = threshold * threshold;
    for (let i = 0; i < points.length; i += 1) {
      const dx = points[i].x - x;
      const dy = points[i].y - y;
      if (dx * dx + dy * dy <= thresholdSq) return i;
    }
    return null;
  }

  function render() {
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    const gradient = ctx.createLinearGradient(0, 0, cw, ch);
    gradient.addColorStop(0, 'rgba(246, 241, 232, 1)');
    gradient.addColorStop(1, 'rgba(231, 221, 208, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, cw, ch);

    if (sourceImg) {
      drawCoverImage(sourceImg);
    } else {
      ctx.fillStyle = 'rgba(43, 40, 35, .65)';
      ctx.font = '600 42px Manrope, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload a photo to preview', cw / 2, ch / 2);
      return;
    }

    ctx.fillStyle = 'rgba(43, 40, 35, .18)';
    ctx.fillRect(0, 0, cw, ch);

    if (starsToggle instanceof HTMLInputElement && starsToggle.checked) {
      drawStarField();
      drawConstellation(constellationPath, { lineAlpha: 0.5, starAlpha: 0.95, starSize: 2.8, lineWidth: 1.6 });

      if (nameConstellationPoints.length) {
        const step = Math.max(1, Math.floor(nameConstellationPoints.length / 90));
        const namePath = nameConstellationPoints.filter((_, idx) => idx % step === 0);
        namePath.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y));
        drawConstellation(namePath, { lineAlpha: 0.28, starAlpha: 0.8, starSize: 1.9, lineWidth: 1.1, closePath: false });
      }
    }

    const vignette = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.2, cw / 2, ch / 2, cw * 0.72);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,.35)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, cw, ch);

    const padding = 54;
    if (pawToggle instanceof HTMLInputElement && pawToggle.checked && pawMarkReady) {
      const size = 120;
      ctx.globalAlpha = 0.2;
      ctx.drawImage(pawMark, padding, padding, size, size);
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.font = '700 52px Cormorant Garamond, serif';
    ctx.textAlign = 'left';
    ctx.fillText('PAWOLLIE SENSE', padding, ch - padding);

    if (dragIndex !== null && constellationPath[dragIndex]) {
      const point = constellationPath[dragIndex];
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

  }

  function updateDerivedLastName() {
    const lastName = ownerFullName?.value
      ? ownerFullName.value.trim().split(/\s+/).slice(-1)[0]
      : '';
    if (hiddenOwnerLastName) hiddenOwnerLastName.value = lastName;
  }

  function makeFilename() {
    const lastName = slugifyForFilename(
      ownerFullName?.value ? ownerFullName.value.trim().split(/\s+/).slice(-1)[0] : 'Customer'
    );
    const pet = slugifyForFilename(String(petNameInput?.value ?? '').trim() || 'pet');
    return `${lastName || 'Customer'}_photobooth_${pet}.png`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function setFileToInput(input, file) {
    if (typeof DataTransfer === 'undefined') return false;
    const dt = new DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    return true;
  }

  ownerFullName?.addEventListener('input', () => {
    updateDerivedLastName();
  });

  starsToggle?.addEventListener('change', () => {
    canvas.style.cursor = 'default';
    render();
  });
  pawToggle?.addEventListener('change', () => {
    render();
  });
  function startDrag(event) {
    if (!(starsToggle instanceof HTMLInputElement) || !starsToggle.checked) return;
    if (!constellationPath.length) return;
    const point = getCanvasPoint(event);
    const index = findNearbyPoint(constellationPath, point.x, point.y);
    if (index === null) return;
    dragIndex = index;
    dragOffset = {
      x: constellationPath[index].x - point.x,
      y: constellationPath[index].y - point.y
    };
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = 'grabbing';
  }

  function moveDrag(event) {
    if (dragIndex !== null && (!(starsToggle instanceof HTMLInputElement) || !starsToggle.checked)) {
      dragIndex = null;
      canvas.style.cursor = 'default';
      render();
      return;
    }
    if (dragIndex === null) {
      if (!(starsToggle instanceof HTMLInputElement) || !starsToggle.checked) return;
      const point = getCanvasPoint(event);
      const hoverIndex = findNearbyPoint(constellationPath, point.x, point.y);
      canvas.style.cursor = hoverIndex !== null ? 'grab' : 'default';
      return;
    }
    const point = getCanvasPoint(event);
    const nextX = Math.min(Math.max(point.x + dragOffset.x, 8), canvas.width - 8);
    const nextY = Math.min(Math.max(point.y + dragOffset.y, 8), canvas.height - 8);
    constellationPath[dragIndex] = { x: nextX, y: nextY };
    render();
  }

  function endDrag(event) {
    if (dragIndex === null) return;
    dragIndex = null;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.style.cursor = 'default';
    render();
  }

  canvas.addEventListener('pointerdown', startDrag);
  canvas.addEventListener('pointermove', moveDrag);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointerleave', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  petNameInput?.addEventListener('input', () => {
    buildNameConstellation();
    render();
  });

  photoInput.addEventListener('change', () => {
    const file = photoInput.files?.[0];
    if (!file) return;

    setSeedFromFile(file);

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      sourceImg = img;
      computeCoverTransform(sourceImg);
      buildEdgeConstellation();
      buildBackgroundStars();
      buildNameConstellation();
      dragIndex = null;
      render();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });

  downloadBtn?.addEventListener('click', () => {
    if (!sourceImg) return;
    render();
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, makeFilename());
    }, 'image/png');
  });

  form.addEventListener('submit', (e) => {
    if (!sourceImg) return;
    e.preventDefault();
    updateDerivedLastName();
    render();

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], makeFilename(), { type: 'image/png', lastModified: Date.now() });
      const replaced = setFileToInput(photoInput, file);
      if (!replaced) return;
      form.submit();
    }, 'image/png');
  });

  updateDerivedLastName();
  render();
}

initDrawer();
initIntakeForm();
initServicePickButtons();
initServicePreselectFromUrl();
initPhotoBooth();

window.pawollieInitDrawer = initDrawer;
window.pawollieInitIntakeForm = initIntakeForm;
window.pawollieInitServicePickButtons = initServicePickButtons;
window.pawollieInitServicePreselectFromUrl = initServicePreselectFromUrl;
window.pawollieInitPhotoBooth = initPhotoBooth;
