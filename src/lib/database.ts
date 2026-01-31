import { supabase } from './supabase';

// Types
export interface Customer {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  created_at?: string;
}

export interface Pet {
  id?: string;
  customer_id: string;
  name: string;
  species?: string;
  breed?: string;
  age?: string;
  birth_date?: string;
  gender?: string;
  is_fixed?: string;
  is_memorial?: boolean;
  date_of_passing?: string;
  how_long_owned?: string;
  where_from?: string;
  previous_owners?: string;
  known_trauma?: string;
  personality_description?: string;
  behavior_concerns?: string;
  comfort_items?: string;
  fears?: string;
  bond_description?: string;
  special_moments?: string;
  memorial_message?: string;
  additional_notes?: string;
  created_at?: string;
}

export interface Reading {
  id?: string;
  customer_id: string;
  pet_id: string;
  services: string[];
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  consent_acknowledged: boolean;
  total_price?: number;
  notes?: string;
  completed_at?: string;
  created_at?: string;
  wagbook_requested?: boolean;
  wagbook_character_names?: string;
  wagbook_storyline?: string;
  wagbook_reference_images?: string[];
  wagbook_cover_image?: string;
  wagbook_price?: number;
}

export interface UploadedFile {
  id?: string;
  customer_id: string;
  pet_id: string;
  reading_id?: string;
  file_name: string;
  original_name: string;
  file_type?: string;
  file_size?: number;
  storage_path: string;
  photo_type?: string;
  created_at?: string;
}

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status?: 'unread' | 'read' | 'replied' | 'archived';
  replied_at?: string;
  created_at?: string;
}

export interface NewsletterSubscriber {
  id?: string;
  email: string;
  is_active?: boolean;
  subscribed_at?: string;
}

// Service prices
export const SERVICE_PRICES: Record<string, number> = {
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
  furmily_pack: 79,
  'paw-reading': 19.99,
  'behavior-insight': 19.99,
  'spirit-profile': 19.99,
  'birth-chart': 19.99,
  // Legacy services (kept for compatibility)
  'past-life': 65,
  'memorial': 70,
  'digital-memorial': 0,
  // New packs
  'pawmarks-pack': 45,
  'combone-pack': 39.99,
  'furmily-pack': 39.99,
  // Add-ons
  'pupdate-solo': 9.99,
  'pawollie-vision-photo': 4.99,
};

const ADD_ON_DISCOUNTS: Record<string, { solo: number; addon: number }> = {
  'pupdate-solo': { solo: 9.99, addon: 2.99 },
  'pawollie-vision-photo': { solo: 4.99, addon: 2.99 },
};

function calculateTotalPrice(services: string[]): number {
  const hasOtherService = (serviceId: string) =>
    services.some((s) => s !== serviceId);

  return services.reduce((sum, service) => {
    if (ADD_ON_DISCOUNTS[service]) {
      const pricing = ADD_ON_DISCOUNTS[service];
      const useAddon = hasOtherService(service);
      return sum + (useAddon ? pricing.addon : pricing.solo);
    }
    return sum + (SERVICE_PRICES[service] || 0);
  }, 0);
}

// Customer functions
export async function createCustomer(customer: Customer): Promise<{ data: Customer | null; error: Error | null }> {
  // First check if customer exists
  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('email', customer.email)
    .single();

  if (existing) {
    return { data: existing, error: null };
  }

  const { data, error } = await supabase
    .from('customers')
    .insert([customer])
    .select()
    .single();

  return { data, error: error as Error | null };
}

export async function getCustomers(): Promise<{ data: Customer[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error: error as Error | null };
}

// Pet functions
export async function createPet(pet: Pet): Promise<{ data: Pet | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('pets')
    .insert([pet])
    .select()
    .single();

  return { data, error: error as Error | null };
}

export async function getPetsByCustomer(customerId: string): Promise<{ data: Pet[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  return { data, error: error as Error | null };
}

// Reading functions
export async function createReading(reading: Reading): Promise<{ data: Reading | null; error: Error | null }> {
  // Calculate total price
  const wagbookPrice = Number(reading.wagbook_price || 0);
  const totalPrice = calculateTotalPrice(reading.services) + wagbookPrice;
  
  const { data, error } = await supabase
    .from('readings')
    .insert([{ ...reading, total_price: totalPrice }])
    .select()
    .single();

  return { data, error: error as Error | null };
}

export async function getReadings(): Promise<{ data: any[] | null; error: Error | null }> {
  try {
    const response = await fetch('/api/admin/readings', {
      method: 'GET',
      credentials: 'include'
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || 'Unable to fetch readings.');
    }
    return { data: result?.data ?? [], error: null };
  } catch (error: any) {
    return { data: null, error: error as Error };
  }
}

export async function getReadingById(readingId: string): Promise<{ data: any | null; error: Error | null }> {
  try {
    const response = await fetch(`/api/admin/reading?id=${encodeURIComponent(readingId)}`, {
      method: 'GET',
      credentials: 'include'
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || 'Unable to fetch reading.');
    }
    return { data: result?.data ?? null, error: null };
  } catch (error: any) {
    return { data: null, error: error as Error };
  }
}

export async function updateReadingStatus(
  readingId: string, 
  status: Reading['status']
): Promise<{ data: Reading | null; error: Error | null }> {
  try {
    const response = await fetch('/api/admin/reading/update', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readingId, status })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || 'Unable to update reading status.');
    }
    return { data: result?.data ?? null, error: null };
  } catch (error: any) {
    return { data: null, error: error as Error };
  }
}

export async function updateReadingNotes(
  readingId: string,
  notes: string
): Promise<{ data: Reading | null; error: Error | null }> {
  try {
    const response = await fetch('/api/admin/reading/update', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readingId, notes })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result?.error || 'Unable to update reading notes.');
    }
    return { data: result?.data ?? null, error: null };
  } catch (error: any) {
    return { data: null, error: error as Error };
  }
}

// File upload functions
export async function uploadPetPhoto(
  file: File,
  customerId: string,
  petId: string,
  photoType: string
): Promise<{ data: UploadedFile | null; error: Error | null }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${customerId}/${petId}/${photoType}_${Date.now()}.${fileExt}`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('pet-photos')
    .upload(fileName, file);

  if (uploadError) {
    return { data: null, error: uploadError as Error };
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('pet-photos')
    .getPublicUrl(fileName);

  // Save file record to database
  const fileRecord: UploadedFile = {
    customer_id: customerId,
    pet_id: petId,
    file_name: fileName,
    original_name: file.name,
    file_type: file.type,
    file_size: file.size,
    storage_path: urlData.publicUrl,
    photo_type: photoType,
  };

  const { data, error } = await supabase
    .from('uploaded_files')
    .insert([fileRecord])
    .select()
    .single();

  return { data, error: error as Error | null };
}

export async function getFilesByPet(petId: string): Promise<{ data: UploadedFile[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('uploaded_files')
    .select('*')
    .eq('pet_id', petId)
    .order('created_at', { ascending: false });

  return { data, error: error as Error | null };
}

// Contact message functions
export async function createContactMessage(message: ContactMessage): Promise<{ data: ContactMessage | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('contact_messages')
    .insert([message])
    .select()
    .single();

  return { data, error: error as Error | null };
}

export async function getContactMessages(): Promise<{ data: ContactMessage[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false });

  return { data, error: error as Error | null };
}

export async function updateContactMessageStatus(
  messageId: string,
  status: ContactMessage['status']
): Promise<{ data: ContactMessage | null; error: Error | null }> {
  const updateData: any = { status };
  if (status === 'replied') {
    updateData.replied_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('contact_messages')
    .update(updateData)
    .eq('id', messageId)
    .select()
    .single();

  return { data, error: error as Error | null };
}

// Newsletter functions
export async function subscribeToNewsletter(email: string): Promise<{ data: NewsletterSubscriber | null; error: Error | null }> {
  // Check if already subscribed
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) {
    if (!existing.is_active) {
      // Reactivate subscription
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: true, unsubscribed_at: null })
        .eq('email', email)
        .select()
        .single();
      return { data, error: error as Error | null };
    }
    return { data: existing, error: null };
  }

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert([{ email }])
    .select()
    .single();

  return { data, error: error as Error | null };
}

export async function getNewsletterSubscribers(): Promise<{ data: NewsletterSubscriber[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('is_active', true)
    .order('subscribed_at', { ascending: false });

  return { data, error: error as Error | null };
}

// Complete intake form submission
export async function submitIntakeForm(formData: {
  customer: Customer;
  pet: Omit<Pet, 'customer_id'>;
  services: string[];
  consentAcknowledged: boolean;
  wagbook?: {
    requested: boolean;
    characterNames?: string;
    storyline?: string;
    referenceImages?: string[];
    coverImage?: string;
    price?: number;
  };
}): Promise<{ 
  data: { customer: Customer; pet: Pet; reading: Reading } | null; 
  error: Error | null 
}> {
  try {
    // 1. Create or get customer
    const { data: customer, error: customerError } = await createCustomer(formData.customer);
    if (customerError || !customer) {
      return { data: null, error: customerError || new Error('Failed to create customer') };
    }

    // 2. Create pet
    const { data: pet, error: petError } = await createPet({
      ...formData.pet,
      customer_id: customer.id!,
    });
    if (petError || !pet) {
      return { data: null, error: petError || new Error('Failed to create pet') };
    }

    // 3. Create reading
    const { data: reading, error: readingError } = await createReading({
      customer_id: customer.id!,
      pet_id: pet.id!,
      services: formData.services,
      consent_acknowledged: formData.consentAcknowledged,
      wagbook_requested: formData.wagbook?.requested ?? false,
      wagbook_character_names: formData.wagbook?.characterNames,
      wagbook_storyline: formData.wagbook?.storyline,
      wagbook_reference_images: formData.wagbook?.referenceImages,
      wagbook_cover_image: formData.wagbook?.coverImage,
      wagbook_price: formData.wagbook?.price
    });
    if (readingError || !reading) {
      return { data: null, error: readingError || new Error('Failed to create reading') };
    }

    return { data: { customer, pet, reading }, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}
