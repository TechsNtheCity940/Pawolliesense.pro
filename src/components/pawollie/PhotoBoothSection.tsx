import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { pawprintUrl } from '@/lib/brand-assets';

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  photoType: string;
}

const PhotoBoothSection: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [petName, setPetName] = useState('');
  const [ownerLastName, setOwnerLastName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoTypes = ['front-paws', 'back-paws', 'full-body', 'face', 'extra'];

  const slugifyPathSegment = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 60);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    if (!imageFiles.length) return;

    setUploadError(null);
    setUploadedFiles((prev) => {
      const startingIndex = prev.length;
      const incoming: UploadedFile[] = imageFiles.map((file, index) => ({
        id: Math.random().toString(36).slice(2, 11),
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        photoType: photoTypes[startingIndex + index] || 'extra',
      }));

      const combined = [...prev, ...incoming];
      if (combined.length <= 5) return combined;

      combined.slice(5).forEach((f) => URL.revokeObjectURL(f.preview));
      setUploadError('Maximum 5 photos allowed. Extra photos were not added.');
      return combined.slice(0, 5);
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const updatePhotoType = (id: string, photoType: string) => {
    setUploadedFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, photoType } : f))
    );
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length < 2) {
      setUploadError('Please upload at least 2 photos (maximum 5).');
      return;
    }
    if (!petName || !ownerLastName || !ownerEmail) {
      setUploadError('Please fill in all required fields.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const safeLastName = slugifyPathSegment(ownerLastName);
      const safePetName = slugifyPathSegment(petName);
      if (!safeLastName || !safePetName) {
        setUploadError('Please use letters/numbers for pet name and last name.');
        return;
      }

      // Upload each file to Supabase storage
      for (const uploadedFile of uploadedFiles) {
        const fileExt = uploadedFile.file.name.split('.').pop();
        const safeType = slugifyPathSegment(uploadedFile.photoType) || 'photo';
        const unique = `${Date.now()}_${uploadedFile.id}`;
        const fileName = `${safeLastName}/${safePetName}/${safeType}_${unique}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('pet-photos')
          .upload(fileName, uploadedFile.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload ${uploadedFile.name}`);
        }
      }

      setUploadSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
        setUploadedFiles([]);
        setPetName('');
        setOwnerLastName('');
        setOwnerEmail('');
      }, 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload photos. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section id="photobooth" className="py-24 bg-[#F5F1E8] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 opacity-10">
        <img
          src={pawprintUrl}
          alt=""
          className="w-32 h-32"
        />
      </div>
      <div className="absolute bottom-10 right-10 opacity-10">
        <img
          src={pawprintUrl}
          alt=""
          className="w-24 h-24"
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-[#9DB5A5]/30 text-[#2D3561] font-display text-sm font-semibold rounded-full mb-4">
            Photo Booth
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-[#2D3561] mb-6">
            Upload Your Pet's Photos
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
            Submit 2-5 clear photos of your pet for your reading. Front and back paw photos are strongly recommended for accuracy.
          </p>
        </div>

        {/* File Naming Instructions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="font-display text-xl font-bold text-[#2D3561] mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Photo Guidelines
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-body text-[#3A3A3A] mb-3">
                Your photos will be organized automatically. Just provide your info below:
              </p>
              <ul className="font-body text-sm text-[#3A3A3A] space-y-1">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#D4AF37] rounded-full mr-2"></span>
                  Front paws (strongly recommended)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#D4AF37] rounded-full mr-2"></span>
                  Back paws (strongly recommended)
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#9DB5A5] rounded-full mr-2"></span>
                  Full body shot
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-[#9DB5A5] rounded-full mr-2"></span>
                  Face photo
                </li>
              </ul>
            </div>
            <div className="bg-[#F5F1E8] rounded-xl p-4">
              <p className="font-body text-sm text-[#3A3A3A] mb-2 font-semibold">Tips for best results:</p>
              <ul className="font-body text-sm text-[#3A3A3A] space-y-1">
                <li>• Use good natural lighting</li>
                <li>• Ensure photos are clear and focused</li>
                <li>• Show paw pads clearly if possible</li>
                <li>• Include your pet's natural posture</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Owner Info Inputs */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block font-display text-sm font-semibold text-[#2D3561] mb-2">
              Pet's Name *
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="e.g., Bella"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#9DB5A5]/30 focus:border-[#D4AF37] focus:outline-none transition-colors font-body input-celestial"
            />
          </div>
          <div>
            <label className="block font-display text-sm font-semibold text-[#2D3561] mb-2">
              Your Last Name *
            </label>
            <input
              type="text"
              value={ownerLastName}
              onChange={(e) => setOwnerLastName(e.target.value)}
              placeholder="e.g., Smith"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#9DB5A5]/30 focus:border-[#D4AF37] focus:outline-none transition-colors font-body input-celestial"
            />
          </div>
          <div>
            <label className="block font-display text-sm font-semibold text-[#2D3561] mb-2">
              Your Email *
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border-2 border-[#9DB5A5]/30 focus:border-[#D4AF37] focus:outline-none transition-colors font-body input-celestial"
            />
          </div>
        </div>

        {/* Error Message */}
        {uploadError && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 font-body">
            {uploadError}
          </div>
        )}

        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-3 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-[#D4AF37] bg-[#D4AF37]/10'
              : 'border-[#9DB5A5] bg-white hover:border-[#D4AF37] hover:bg-[#D4AF37]/5'
          }`}
          style={{ borderWidth: '3px' }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-[#9DB5A5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <p className="font-display text-xl font-semibold text-[#2D3561] mb-2">
            Drag & drop photos here
          </p>
          <p className="font-body text-[#3A3A3A]/70 mb-4">
            or click to browse your files
          </p>
          <p className="font-body text-sm text-[#3A3A3A]/50">
            Accepts JPG, PNG, WEBP • Max 5 photos • 10MB each
          </p>
        </div>

        {/* Uploaded Files Preview */}
        {uploadedFiles.length > 0 && (
          <div className="mt-8">
            <h3 className="font-display text-lg font-bold text-[#2D3561] mb-4">
              Uploaded Photos ({uploadedFiles.length}/5)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#9DB5A5]/20">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <select
                    value={file.photoType}
                    onChange={(e) => updatePhotoType(file.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-2 w-full text-xs font-body rounded-lg border border-[#9DB5A5]/30 px-2 py-1 focus:outline-none focus:border-[#D4AF37]"
                  >
                    {photoTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 text-center">
          {uploadSuccess ? (
            <div className="inline-flex items-center px-8 py-4 bg-green-500 text-white font-display font-bold rounded-full">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Photos Uploaded Successfully!
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={uploadedFiles.length < 2 || isUploading}
              className={`px-8 py-4 font-display font-bold rounded-full shadow-lg transition-all duration-300 ${
                uploadedFiles.length >= 2 && !isUploading
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-[#2D3561] hover:shadow-xl transform hover:-translate-y-1'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isUploading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </span>
              ) : (
                'Upload Photos'
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default PhotoBoothSection;
