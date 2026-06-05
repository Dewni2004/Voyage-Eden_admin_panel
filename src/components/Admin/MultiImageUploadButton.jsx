import { useState } from 'react';
import { supabase } from '../../supabase';

const MultiImageUploadButton = ({ onUploadComplete, folder = 'uploads', defaultCategory = 'All' }) => {
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState(defaultCategory);

  const handleUpload = async (e) => {
    try {
      setUploading(true);
      const files = Array.from(e.target.files);
      if (!files.length) return;

      const uploadedUrls = [];

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (uploadError) {
          if (uploadError.message === 'Bucket not found') {
            throw new Error('Supabase Storage bucket "images" not found. Please create a PUBLIC bucket named "images" in your Supabase dashboard.');
          }
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      onUploadComplete(uploadedUrls, category);
      
      // Reset input value so same files can be selected again if needed
      e.target.value = '';
    } catch (error) {
      alert('Error uploading images: ' + error.message);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
      <div className="flex-1">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2 block">
          Bulk Upload Category
        </label>
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)} 
          className="w-full bg-white border border-gray-100 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all text-primary font-medium"
        >
          <option value="All">All</option>
          <option value="Panorama">Panorama</option>
          <option value="Bedroom">Bedroom</option>
          <option value="Restaurant">Restaurant</option>
        </select>
      </div>
      <div className="flex-1 mt-6">
        <label className={`cursor-pointer px-6 py-3.5 flex items-center justify-center rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-primary text-white hover:bg-primary/90'}`}>
          {uploading ? 'Uploading...' : 'SELECT MULTIPLE IMAGES'}
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            multiple
            onChange={handleUpload} 
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
};

export default MultiImageUploadButton;
