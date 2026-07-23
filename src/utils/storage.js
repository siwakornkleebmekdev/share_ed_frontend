import { supabase } from './supabase';

/**
 * Upload a file (File object) to Supabase Storage
 * @param {File} file - The file object to upload
 * @param {string} bucketName - Target Supabase bucket name (default: 'posts')
 * @param {string} folder - Target folder path inside bucket (default: 'media')
 * @returns {Promise<string|null>} - Returns the public URL of the uploaded file
 */
export const uploadFileToSupabase = async (file, bucketName = 'posts', folder = 'media') => {
  if (!file || !(file instanceof File)) return null;

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn(`Supabase Storage upload notice (${bucketName}/${folder}):`, error.message);
      return null;
    }

    // Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.error('Error uploading file to Supabase Storage:', err);
    return null;
  }
};
