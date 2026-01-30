function initDrawer() {
  const drawer = document.getElementById('site-drawer') ?? document.querySelector('.drawer');
  const openBtn = document.querySelector('.topbar .menu-btn[aria-controls]');
  const closeBtn = document.querySelector('[data-drawer-close]');
  const backdrop = document.querySelector('.drawer-backdrop');

  if (!drawer || !openBtn || !backdrop) return;

  function openDrawer() {
    drawer.classList.add('open');
    backdrop.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    const firstLink = drawer.querySelector('a');
    firstLink?.focus?.();
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
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });
}

const SERVICE_CATALOG = {
  full_soul_profile: { label: 'Full Soul Discovery Profile', price: 30 },
  behavior_spirit_scan: { label: 'Personality and Behavior Spirit Scan', price: 20 },
  canine_birth_chart: { label: 'Canine Birth Chart', price: 15 },
  past_life_pawprint: { label: 'Past-Life Pawprint Reading', price: 5 },
  quick_quest: { label: 'Quick Quest', price: 5 },
  pawollie_vision: { label: 'Pawollie Vision (Daily)', price: 4.99 },
  pawsitive_pupdate: { label: 'Pawsitive Pupdate (Daily)', price: 4.99 }
};

const cssEscape =
  window.CSS && typeof window.CSS.escape === 'function'
    ? window.CSS.escape.bind(window.CSS)
    : (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');

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

  const ownerLastName = document.getElementById('owner_last_name');
  const serviceSelect = document.getElementById('service_purchased');
  const photosInput = document.getElementById('photos');
  const photoError = document.getElementById('photo_error');
  const photoCountHint = document.getElementById('photo_count_hint');
  const photoConfirmationText = document.getElementById('photo_confirmation_text');
  const servicePriceDisplay = document.getElementById('service_price_display');
  const serviceError = document.getElementById('service_error');

  const memorialFields = document.getElementById('memorial_fields');
  const dateOfPassing = document.getElementById('date_of_passing');
  const rememberedAs = document.getElementById('remembered_as');
  const memorialVisibilityInputs = Array.from(
    form.querySelectorAll('input[name="memorial_visibility"]')
  );
  const petStatusInputs = Array.from(form.querySelectorAll('input[name="pet_status"]'));

  const addOnInputs = Array.from(form.querySelectorAll('input[name="add_ons"]'));
  const serviceSections = Array.from(form.querySelectorAll('[data-service-section]'));
  const addOnSections = Array.from(form.querySelectorAll('[data-addon-section]'));

  const hiddenSelectedService = form.querySelector('input[name="selected_service_label"]');
  const hiddenSelectedAddOns = form.querySelector('input[name="selected_add_ons_csv"]');
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

    if (servicePriceDisplay) servicePriceDisplay.textContent = service ? formatUSD(service.price) : '$0.00';
    if (hiddenSelectedService) hiddenSelectedService.value = service ? service.label : '';
    if (hiddenEstimatedPrice) hiddenEstimatedPrice.value = service ? String(service.price) : '';

    const selectedAddOns = addOnInputs.filter((input) => input.checked).map((input) => input.value);
    if (hiddenSelectedAddOns) hiddenSelectedAddOns.value = selectedAddOns.join(', ');

    const lastNameRaw = ownerLastName instanceof HTMLInputElement ? ownerLastName.value : '';
    const lastName = slugifyForFilename(lastNameRaw) || 'Customer';
    if (hiddenOwnerLastName) hiddenOwnerLastName.value = lastNameRaw;

    const prefix = `${lastName.toUpperCase()}_${key || 'service'}`;
    if (hiddenPhotoPrefix) hiddenPhotoPrefix.value = prefix;
  }

  function validateServiceSelection() {
    const key = serviceSelect instanceof HTMLSelectElement ? serviceSelect.value : '';
    const message = key ? '' : 'Please select a service.';
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
    const serviceKey = serviceSelect instanceof HTMLSelectElement ? serviceSelect.value : 'service';
    const prefix = `${lastName}_${serviceKey || 'service'}`;

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
    btn.addEventListener('click', (event) => {
      const key = btn.getAttribute('data-select-service');
      if (!key) return;

      if (!intakeForm) {
        window.location.href = `intake.html?service=${encodeURIComponent(key)}`;
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
  pawMark.src = 'assets/pawprint.png';

  let sourceImg = null;
  let seed = 1;

  function seededRandom() {
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return ((seed < 0 ? ~seed + 1 : seed) % 1000) / 1000;
  }

  function setSeedFromFile(file) {
    const value = (file?.size ?? 0) + (file?.lastModified ?? 0);
    seed = Number(value % 2147483647) || 1;
  }

  function drawCoverImage(img) {
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.width;
    const ih = img.height;
    const scale = Math.max(cw / iw, ch / ih);
    const w = iw * scale;
    const h = ih * scale;
    const x = (cw - w) / 2;
    const y = (ch - h) / 2;
    ctx.drawImage(img, x, y, w, h);
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

    ctx.fillStyle = 'rgba(43, 40, 35, .20)';
    ctx.fillRect(0, 0, cw, ch);

    if (starsToggle instanceof HTMLInputElement && starsToggle.checked) {
      const count = 80;
      for (let i = 0; i < count; i += 1) {
        const x = seededRandom() * cw;
        const y = seededRandom() * ch;
        const r = seededRandom() * 2.2 + 0.6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.2 + seededRandom() * 0.5})`;
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(47,54,82,.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const x = cw * (0.2 + seededRandom() * 0.6);
        const y = ch * (0.2 + seededRandom() * 0.6);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
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

    const petName = String(petNameInput?.value ?? '').trim();
    if (petName) {
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.font = '600 32px Manrope, system-ui, sans-serif';
      ctx.fillText(petName, padding, ch - padding - 44);
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
    render();
  });
  pawToggle?.addEventListener('change', () => {
    render();
  });
  petNameInput?.addEventListener('input', () => {
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
