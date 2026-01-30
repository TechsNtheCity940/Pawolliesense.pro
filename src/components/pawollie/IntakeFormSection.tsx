import React, { useEffect, useState } from 'react';
import { submitIntakeForm, SERVICE_PRICES } from '@/lib/database';
import { pawprintUrl } from '@/lib/brand-assets';

interface FormData {
  // Owner Info
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  phone: string;
  
  // Pet Info
  petName: string;
  petSpecies: string;
  petBreed: string;
  petAge: string;
  petBirthDate: string;
  petGender: string;
  petFixed: string;
  
  // Service Selection
  selectedServices: string[];
  
  // Pet History
  howLongOwned: string;
  whereFrom: string;
  previousOwners: string;
  knownTrauma: string;
  
  // Behavior
  personalityDescription: string;
  behaviorConcerns: string;
  comfortItems: string;
  fears: string;
  
  // Bond
  bondDescription: string;
  specialMoments: string;
  
  // Memorial (if applicable)
  isMemorial: boolean;
  dateOfPassing: string;
  memorialMessage: string;
  
  // Consent
  consentAcknowledged: boolean;
  additionalNotes: string;

  // Wag Book add-on
  wagBookSelected: boolean;
  wagBookCharacterNames: string;
  wagBookStoryline: string;
  wagBookReferenceImages: string;
  wagBookCoverImage: string;
}

const IntakeFormSection: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{ petName: string; services: string[] } | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    ownerFirstName: '',
    ownerLastName: '',
    email: '',
    phone: '',
    petName: '',
    petSpecies: 'dog',
    petBreed: '',
    petAge: '',
    petBirthDate: '',
    petGender: '',
    petFixed: '',
    selectedServices: [],
    howLongOwned: '',
    whereFrom: '',
    previousOwners: '',
    knownTrauma: '',
    personalityDescription: '',
    behaviorConcerns: '',
    comfortItems: '',
    fears: '',
    bondDescription: '',
    specialMoments: '',
    isMemorial: false,
    dateOfPassing: '',
    memorialMessage: '',
    consentAcknowledged: false,
    additionalNotes: '',
    wagBookSelected: false,
    wagBookCharacterNames: '',
    wagBookStoryline: '',
    wagBookReferenceImages: '',
    wagBookCoverImage: '',
  });

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ serviceId?: string }>;
      const serviceId = custom.detail?.serviceId;
      if (!serviceId) return;

      setFormData(prev => ({
        ...prev,
        selectedServices: prev.selectedServices.includes(serviceId)
          ? prev.selectedServices
          : [...prev.selectedServices, serviceId],
      }));
      setCurrentStep(prev => Math.max(prev, 3));
    };

    window.addEventListener('pawollie:intake:select-service', handler as EventListener);

    const params = new URLSearchParams(window.location.search);
    const service = params.get('service');
    const servicesParam = params.get('services');
    const keys = [
      ...(service ? [service] : []),
      ...(servicesParam ? servicesParam.split(',').map(s => s.trim()).filter(Boolean) : []),
    ];

    if (keys.length) {
      setFormData(prev => ({
        ...prev,
        selectedServices: Array.from(new Set([...prev.selectedServices, ...keys])),
      }));
      setCurrentStep(prev => Math.max(prev, 3));
    }

    return () => {
      window.removeEventListener('pawollie:intake:select-service', handler as EventListener);
    };
  }, []);

  const services = [
    { id: 'paw-reading', name: 'Paw Reading — Emotional & Energetic Insight', price: SERVICE_PRICES['paw-reading'] },
    { id: 'behavior-insight', name: 'Behavior & Aura Paw-file', price: SERVICE_PRICES['behavior-insight'] },
    { id: 'spirit-profile', name: 'Soul Discovery — Soul Role & Bond Meaning', price: SERVICE_PRICES['spirit-profile'] },
    { id: 'birth-chart', name: 'Pet Birth Chart — Symbolic Personality Mapping', price: SERVICE_PRICES['birth-chart'] },
    { id: 'pawmarks-pack', name: 'Pawmarks Pack — Legacy & Transition Insight', price: SERVICE_PRICES['pawmarks-pack'] },
    { id: 'combone-pack', name: 'Combone Pack — Full Pawollie Experience', price: SERVICE_PRICES['combone-pack'] },
    { id: 'furmily-pack', name: 'Furmily Pack — Whole Household Bundle', price: SERVICE_PRICES['furmily-pack'] },
    { id: 'pupdate-solo', name: 'Pawsitive Pupdate (Solo)', price: SERVICE_PRICES['pupdate-solo'] },
    { id: 'pupdate-add', name: 'Pawsitive Pupdate (Add-on)', price: SERVICE_PRICES['pupdate-add'] },
    { id: 'pawollie-vision-photo', name: 'Pawollie Vision Photo', price: SERVICE_PRICES['pawollie-vision-photo'] },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId],
    }));
  };

  const calculateTotal = () => {
    const baseTotal = formData.selectedServices.reduce((sum, serviceId) => {
      return sum + (SERVICE_PRICES[serviceId] || 0);
    }, 0);
    return baseTotal + (formData.wagBookSelected ? 40 : 0);
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
    window.scrollTo({ top: document.getElementById('intake')?.offsetTop || 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: document.getElementById('intake')?.offsetTop || 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consentAcknowledged) {
      setSubmitError('Please acknowledge the ethical disclosure to continue.');
      return;
    }

    if (formData.selectedServices.length === 0) {
      setSubmitError('Please select at least one service.');
      return;
    }

    if (formData.wagBookSelected) {
      if (!formData.wagBookCharacterNames.trim() || !formData.wagBookStoryline.trim() || !formData.wagBookCoverImage.trim()) {
        setSubmitError('Please complete the Wag Book character names, story idea, and cover photo fields.');
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { data, error } = await submitIntakeForm({
        customer: {
          first_name: formData.ownerFirstName,
          last_name: formData.ownerLastName,
          email: formData.email,
          phone: formData.phone || undefined,
        },
        pet: {
          name: formData.petName,
          species: formData.petSpecies,
          breed: formData.petBreed || undefined,
          age: formData.petAge || undefined,
          birth_date: formData.petBirthDate || undefined,
          gender: formData.petGender || undefined,
          is_fixed: formData.petFixed || undefined,
          is_memorial: formData.isMemorial,
          date_of_passing: formData.dateOfPassing || undefined,
          how_long_owned: formData.howLongOwned || undefined,
          where_from: formData.whereFrom || undefined,
          previous_owners: formData.previousOwners || undefined,
          known_trauma: formData.knownTrauma || undefined,
          personality_description: formData.personalityDescription || undefined,
          behavior_concerns: formData.behaviorConcerns || undefined,
          comfort_items: formData.comfortItems || undefined,
          fears: formData.fears || undefined,
          bond_description: formData.bondDescription || undefined,
          special_moments: formData.specialMoments || undefined,
          memorial_message: formData.memorialMessage || undefined,
          additional_notes: formData.additionalNotes || undefined,
        },
        services: formData.selectedServices,
        consentAcknowledged: formData.consentAcknowledged,
        wagbook: formData.wagBookSelected ? {
          requested: true,
          characterNames: formData.wagBookCharacterNames || undefined,
          storyline: formData.wagBookStoryline || undefined,
          referenceImages: formData.wagBookReferenceImages
            .split(',')
            .map(item => item.trim())
            .filter(Boolean),
          coverImage: formData.wagBookCoverImage || undefined,
          price: 40
        } : {
          requested: false
        }
      });

      if (error) {
        throw error;
      }

      setSubmittedData({
        petName: formData.petName,
        services: formData.selectedServices,
      });
      setSubmitSuccess(true);
    } catch (error: any) {
      console.error('Submission error:', error);
      setSubmitError(error.message || 'An error occurred while submitting the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmitSuccess(false);
    setSubmitError(null);
    setSubmittedData(null);
    setCurrentStep(1);
    setFormData({
      ownerFirstName: '',
      ownerLastName: '',
      email: '',
      phone: '',
      petName: '',
      petSpecies: 'dog',
      petBreed: '',
      petAge: '',
      petBirthDate: '',
      petGender: '',
      petFixed: '',
      selectedServices: [],
      howLongOwned: '',
      whereFrom: '',
      previousOwners: '',
      knownTrauma: '',
      personalityDescription: '',
      behaviorConcerns: '',
      comfortItems: '',
      fears: '',
      bondDescription: '',
      specialMoments: '',
      isMemorial: false,
      dateOfPassing: '',
      memorialMessage: '',
      consentAcknowledged: false,
      additionalNotes: '',
      wagBookSelected: false,
      wagBookCharacterNames: '',
      wagBookStoryline: '',
      wagBookReferenceImages: '',
      wagBookCoverImage: '',
    });
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border-2 border-[#9DB5A5]/30 focus:border-[#D4AF37] focus:outline-none transition-colors font-body bg-white input-celestial";
  const labelClasses = "block font-display text-sm font-semibold text-[#2D3561] mb-2";

  if (submitSuccess && submittedData) {
    return (
      <section id="intake" className="py-24 bg-gradient-to-b from-[#9DB5A5]/20 to-[#F5F1E8]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl shadow-xl p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-display text-3xl font-bold text-[#2D3561] mb-4">
              Thank You, {formData.ownerFirstName}!
            </h2>
            <p className="font-body text-lg text-[#3A3A3A] mb-6">
              Your intake form for <strong>{submittedData.petName}</strong> has been submitted successfully. 
              We'll review your information and reach out within 24-48 hours.
            </p>
            <div className="bg-[#F5F1E8] rounded-xl p-4 mb-6">
              <p className="font-body text-sm text-[#3A3A3A]">
                <strong>Selected Services:</strong><br />
                {submittedData.services.map(id => services.find(s => s.id === id)?.name).join(', ') || 'None selected'}
              </p>
              <p className="font-display text-lg font-bold text-[#D4AF37] mt-2">
                Total: ${calculateTotal()}
              </p>
            </div>
            <p className="font-body text-sm text-[#3A3A3A]/70 mb-6">
              Don't forget to upload your pet's photos in the Photo Booth section!
            </p>
            <button
              onClick={resetForm}
              className="px-6 py-3 bg-[#2D3561] text-white font-display font-semibold rounded-full hover:bg-[#3D4A7A] transition-colors"
            >
              Submit Another Form
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="intake" className="py-24 bg-gradient-to-b from-[#9DB5A5]/20 to-[#F5F1E8] relative">
      {/* Decorative Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            <svg className="w-3 h-3 text-[#D4AF37]/30" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
            </svg>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-[#D4AF37]/20 text-[#2D3561] font-display text-sm font-semibold rounded-full mb-4">
            Get Started
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#2D3561] mb-6">
            Intake Form
          </h2>
          <div className="flex items-center justify-center mb-8">
            <div className="h-px w-12 bg-[#D4AF37]" />
              <img
                src={pawprintUrl}
                alt=""
                className="w-8 h-8 mx-3"
              />
            <div className="h-px w-12 bg-[#D4AF37]" />
          </div>
          <p className="font-body text-lg text-[#3A3A3A] max-w-2xl mx-auto">
            Complete this form to begin your Pawollie Sense journey. All information is kept confidential and used solely for your reading.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3, 4, 5].map((step) => (
            <React.Fragment key={step}>
              <button
                onClick={() => setCurrentStep(step)}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold transition-all ${
                  currentStep >= step
                    ? 'bg-[#D4AF37] text-[#2D3561]'
                    : 'bg-[#9DB5A5]/30 text-[#3A3A3A]'
                }`}
              >
                {step}
              </button>
              {step < 5 && (
                <div className={`w-12 h-1 mx-1 rounded ${currentStep > step ? 'bg-[#D4AF37]' : 'bg-[#9DB5A5]/30'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 font-body">
            {submitError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          {/* Step 1: Owner Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="font-display text-2xl font-bold text-[#2D3561] mb-6">
                Step 1: Your Information
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>First Name *</label>
                  <input
                    type="text"
                    name="ownerFirstName"
                    value={formData.ownerFirstName}
                    onChange={handleInputChange}
                    required
                    className={inputClasses}
                    placeholder="Your first name"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Last Name *</label>
                  <input
                    type="text"
                    name="ownerLastName"
                    value={formData.ownerLastName}
                    onChange={handleInputChange}
                    required
                    className={inputClasses}
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={inputClasses}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className={labelClasses}>Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={inputClasses}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          )}

          {/* Step 2: Pet Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="font-display text-2xl font-bold text-[#2D3561] mb-6">
                Step 2: Pet Information
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Pet's Name *</label>
                  <input
                    type="text"
                    name="petName"
                    value={formData.petName}
                    onChange={handleInputChange}
                    required
                    className={inputClasses}
                    placeholder="Your pet's name"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Species *</label>
                  <select
                    name="petSpecies"
                    value={formData.petSpecies}
                    onChange={handleInputChange}
                    className={inputClasses}
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Breed</label>
                  <input
                    type="text"
                    name="petBreed"
                    value={formData.petBreed}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="e.g., Golden Retriever, Mixed"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Age</label>
                  <input
                    type="text"
                    name="petAge"
                    value={formData.petAge}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="e.g., 5 years, 8 months"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Birth Date (if known)</label>
                  <input
                    type="date"
                    name="petBirthDate"
                    value={formData.petBirthDate}
                    onChange={handleInputChange}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Gender</label>
                  <select
                    name="petGender"
                    value={formData.petGender}
                    onChange={handleInputChange}
                    className={inputClasses}
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClasses}>Spayed/Neutered?</label>
                <select
                  name="petFixed"
                  value={formData.petFixed}
                  onChange={handleInputChange}
                  className={inputClasses}
                >
                  <option value="">Select...</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              {/* Memorial Toggle */}
              <div className="bg-[#F5F1E8] rounded-xl p-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isMemorial"
                    checked={formData.isMemorial}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded border-[#9DB5A5] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span className="ml-3 font-display text-[#2D3561] font-medium">
                    This is a memorial reading (pet has passed)
                  </span>
                </label>
              </div>

              {formData.isMemorial && (
                <div>
                  <label className={labelClasses}>Date of Passing</label>
                  <input
                    type="date"
                    name="dateOfPassing"
                    value={formData.dateOfPassing}
                    onChange={handleInputChange}
                    className={inputClasses}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 3: Service Selection */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="font-display text-2xl font-bold text-[#2D3561] mb-6">
                Step 3: Select Services
              </h3>
              <p className="font-body text-[#3A3A3A] mb-6">
                Choose one or more core services or Pawollie Packs you're interested in:
              </p>

              <div className="space-y-4">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.selectedServices.includes(service.id)
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                        : 'border-[#9DB5A5]/30 hover:border-[#9DB5A5]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedServices.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="w-5 h-5 rounded border-[#9DB5A5] text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <div className="ml-4 flex-1">
                      <span className="font-display font-semibold text-[#2D3561]">
                        {service.name}
                      </span>
                    </div>
                    <span className="font-display font-bold text-[#D4AF37]">
                      ${service.price}
                    </span>
                  </label>
                ))}
              </div>

              {formData.selectedServices.length > 0 && (
                <div className="bg-[#2D3561] rounded-xl p-4 text-center">
                  <p className="font-display text-white">
                    Total: <span className="text-2xl font-bold text-[#D4AF37]">${calculateTotal()}</span>
                  </p>
                </div>
              )}

              <div className="bg-[#F5F1E8] rounded-xl p-6 border border-[#9DB5A5]/30">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display text-lg font-bold text-[#2D3561]">Wag Book add-on</h4>
                    <p className="font-body text-sm text-[#3A3A3A]/80">
                      Hardcover keepsake storybook (US Letter, 24 pages). Price: $40.
                    </p>
                  </div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="wagBookSelected"
                      checked={formData.wagBookSelected}
                      onChange={handleInputChange}
                      className="w-5 h-5 rounded border-[#9DB5A5] text-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <span className="font-display text-[#2D3561] font-semibold">Add Wag Book</span>
                  </label>
                </div>
                {formData.wagBookSelected ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className={labelClasses}>Character names (required)</label>
                      <input
                        type="text"
                        name="wagBookCharacterNames"
                        value={formData.wagBookCharacterNames}
                        onChange={handleInputChange}
                        required={formData.wagBookSelected}
                        className={inputClasses}
                        placeholder="Pet + family names to include"
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>General story idea (required)</label>
                      <textarea
                        name="wagBookStoryline"
                        value={formData.wagBookStoryline}
                        onChange={handleInputChange}
                        required={formData.wagBookSelected}
                        rows={3}
                        className={inputClasses}
                        placeholder="Short plot, themes, or key moments to highlight"
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Reference images (comma separated URLs)</label>
                      <textarea
                        name="wagBookReferenceImages"
                        value={formData.wagBookReferenceImages}
                        onChange={handleInputChange}
                        rows={2}
                        className={inputClasses}
                        placeholder="Links to photos you want used"
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Cover photo URL (required)</label>
                      <input
                        type="text"
                        name="wagBookCoverImage"
                        value={formData.wagBookCoverImage}
                        onChange={handleInputChange}
                        required={formData.wagBookSelected}
                        className={inputClasses}
                        placeholder="Cover photo link"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Step 4: Pet History & Behavior */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="font-display text-2xl font-bold text-[#2D3561] mb-6">
                Step 4: Pet History & Behavior
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>How long have you had {formData.petName || 'your pet'}?</label>
                  <input
                    type="text"
                    name="howLongOwned"
                    value={formData.howLongOwned}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="e.g., 3 years, since puppyhood"
                  />
                </div>
                <div>
                  <label className={labelClasses}>Where did they come from?</label>
                  <input
                    type="text"
                    name="whereFrom"
                    value={formData.whereFrom}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="e.g., Shelter, breeder, rescue"
                  />
                </div>
              </div>

              <div>
                <label className={labelClasses}>Any known previous owners or history?</label>
                <textarea
                  name="previousOwners"
                  value={formData.previousOwners}
                  onChange={handleInputChange}
                  rows={3}
                  className={inputClasses}
                  placeholder="Share any known history before you..."
                />
              </div>

              <div>
                <label className={labelClasses}>Any known trauma or significant life events?</label>
                <textarea
                  name="knownTrauma"
                  value={formData.knownTrauma}
                  onChange={handleInputChange}
                  rows={3}
                  className={inputClasses}
                  placeholder="Surgeries, accidents, rehoming, loss of companion..."
                />
              </div>

              <div>
                <label className={labelClasses}>Describe {formData.petName || 'your pet'}'s personality</label>
                <textarea
                  name="personalityDescription"
                  value={formData.personalityDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className={inputClasses}
                  placeholder="Playful, shy, protective, curious, calm..."
                />
              </div>

              <div>
                <label className={labelClasses}>Any behavior concerns or patterns you'd like insight on?</label>
                <textarea
                  name="behaviorConcerns"
                  value={formData.behaviorConcerns}
                  onChange={handleInputChange}
                  rows={4}
                  className={inputClasses}
                  placeholder="Anxiety, aggression, withdrawal, attachment..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClasses}>Comfort items or routines?</label>
                  <input
                    type="text"
                    name="comfortItems"
                    value={formData.comfortItems}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Favorite toy, blanket, spot..."
                  />
                </div>
                <div>
                  <label className={labelClasses}>Known fears or triggers?</label>
                  <input
                    type="text"
                    name="fears"
                    value={formData.fears}
                    onChange={handleInputChange}
                    className={inputClasses}
                    placeholder="Thunder, strangers, loud noises..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Bond & Consent */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h3 className="font-display text-2xl font-bold text-[#2D3561] mb-6">
                Step 5: Your Bond & Final Details
              </h3>

              <div>
                <label className={labelClasses}>Describe your bond with {formData.petName || 'your pet'}</label>
                <textarea
                  name="bondDescription"
                  value={formData.bondDescription}
                  onChange={handleInputChange}
                  rows={4}
                  className={inputClasses}
                  placeholder="What makes your relationship special? How do they make you feel?"
                />
              </div>

              <div>
                <label className={labelClasses}>Any special moments or memories you'd like to share?</label>
                <textarea
                  name="specialMoments"
                  value={formData.specialMoments}
                  onChange={handleInputChange}
                  rows={4}
                  className={inputClasses}
                  placeholder="Meaningful experiences, funny stories, touching moments..."
                />
              </div>

              {formData.isMemorial && (
                <div>
                  <label className={labelClasses}>Memorial message or anything you'd like to honor?</label>
                  <textarea
                    name="memorialMessage"
                    value={formData.memorialMessage}
                    onChange={handleInputChange}
                    rows={4}
                    className={inputClasses}
                    placeholder="Share what you'd like to honor about their memory..."
                  />
                </div>
              )}

              <div>
                <label className={labelClasses}>Additional notes or questions?</label>
                <textarea
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleInputChange}
                  rows={3}
                  className={inputClasses}
                  placeholder="Anything else you'd like us to know..."
                />
              </div>

              {/* Order Summary */}
              {formData.selectedServices.length > 0 && (
                <div className="bg-[#F5F1E8] rounded-xl p-6">
                  <h4 className="font-display text-lg font-bold text-[#2D3561] mb-3">Order Summary</h4>
                  <ul className="space-y-2 mb-4">
                    {formData.selectedServices.map(id => {
                      const service = services.find(s => s.id === id);
                      return service ? (
                        <li key={id} className="flex justify-between font-body text-[#3A3A3A]">
                          <span>{service.name}</span>
                          <span>${service.price}</span>
                        </li>
                      ) : null;
                    })}
                    {formData.wagBookSelected ? (
                      <li className="flex justify-between font-body text-[#3A3A3A]">
                        <span>Wag Book add-on</span>
                        <span>$40</span>
                      </li>
                    ) : null}
                  </ul>
                  <div className="border-t border-[#9DB5A5]/30 pt-3 flex justify-between">
                    <span className="font-display font-bold text-[#2D3561]">Total</span>
                    <span className="font-display font-bold text-[#D4AF37] text-xl">${calculateTotal()}</span>
                  </div>
                </div>
              )}

              {/* Ethical Disclosure */}
              <div className="bg-[#2D3561]/5 rounded-xl p-6 border border-[#2D3561]/10">
                <h4 className="font-display text-lg font-bold text-[#2D3561] mb-3">
                  Ethical Disclosure
                </h4>
                <p className="font-body text-sm text-[#3A3A3A] mb-4">
                  Pawollie Sense is a spiritual and interpretive service. It does not provide medical, veterinary, behavioral, legal, or psychological advice. It does not claim psychic ability, prediction, or mediumship. All insights are symbolic and intended for reflection, comfort, and understanding only.
                </p>
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    name="consentAcknowledged"
                    checked={formData.consentAcknowledged}
                    onChange={handleInputChange}
                    required
                    className="w-5 h-5 mt-0.5 rounded border-[#9DB5A5] text-[#D4AF37] focus:ring-[#D4AF37]"
                  />
                  <span className="ml-3 font-body text-[#2D3561]">
                    I acknowledge and understand this disclosure. I consent to receiving spiritual and interpretive insights only. *
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-10 pt-6 border-t border-[#9DB5A5]/20">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 font-display font-semibold text-[#2D3561] border-2 border-[#2D3561] rounded-full hover:bg-[#2D3561] hover:text-white transition-colors"
              >
                Previous
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-8 py-3 font-display font-semibold bg-[#2D3561] text-white rounded-full hover:bg-[#3D4A7A] transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !formData.consentAcknowledged}
                className={`px-8 py-3 font-display font-bold rounded-full shadow-lg transition-all ${
                  isSubmitting || !formData.consentAcknowledged
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#2D3561] hover:shadow-xl transform hover:-translate-y-1'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Intake Form'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
};

export default IntakeFormSection;
