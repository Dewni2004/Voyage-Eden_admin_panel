import React, { useState } from 'react';
import { supabase } from '../../supabase';

const ImageUploadField = ({ label, value, onChange, folder = 'uploads' }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const file = e.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to 'images' bucket
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message === 'Bucket not found') {
          throw new Error('Supabase Storage bucket "images" not found. Please create a PUBLIC bucket named "images" in your Supabase dashboard.');
        }
        throw uploadError;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (error) {
      alert('Error uploading image: ' + error.message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">
        {label}
      </label>
      
      <div className="flex items-center gap-4">
        {value && (
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="relative flex-1">
          <input 
            type="text" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 pr-32 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-primary font-medium placeholder:text-gray-300 shadow-sm"
            placeholder="Image URL or upload →"
          />
          <div className="absolute right-2 top-2 bottom-2 flex items-center">
            <label className={`cursor-pointer px-4 h-full flex items-center justify-center rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white hover:bg-primary/90'}`}>
              {uploading ? '...' : 'UPLOAD'}
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleUpload} 
                disabled={uploading}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadField;
