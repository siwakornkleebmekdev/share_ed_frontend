import api from '../utils/api';
import { supabase } from '../utils/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidCategoryUuid = (id) => {
  return typeof id === 'string' && UUID_REGEX.test(id);
};

export const generateUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const DEFAULT_SUBJECT_NAMES = [
  'คณิตศาสตร์',
  'ฟิสิกส์',
  'เคมี',
  'ชีววิทยา',
  'วิทยาศาสตร์',
  'ภาษาอังกฤษ',
  'ภาษาไทย',
  'สังคมศึกษา',
  'คอมพิวเตอร์และเทคโนโลยี',
  'ทั่วไป',
];

export const DEFAULT_CATEGORIES = [
  { id: 'cat-math', name: 'คณิตศาสตร์', description: 'รวมสรุปสูตร เทคนิคการคำนวณ พีชคณิต เรขาคณิต แคลคูลัส', count: 0, isDbRecord: false },
  { id: 'cat-physics', name: 'ฟิสิกส์', description: 'สรุปการเคลื่อนที่ แรง คลื่น ไฟฟ้า กลศาสตร์ และดาราศาสตร์', count: 0, isDbRecord: false },
  { id: 'cat-chem', name: 'เคมี', description: 'ตารางธาตุ พันธะเคมี ปริมาณสารสัมพันธ์ กรด-เบส เคมีอินทรีย์', count: 0, isDbRecord: false },
  { id: 'cat-bio', name: 'ชีววิทยา', description: 'เซลล์ พันธุศาสตร์ พืชและสัตว์ ระบบร่างกาย นิเวศวิทยา', count: 0, isDbRecord: false },
  { id: 'cat-sci', name: 'วิทยาศาสตร์', description: 'วิทยาศาสตร์ทั่วไป พื้นฐานวิทย์ ม.ต้น และเตรียมสอบ', count: 0, isDbRecord: false },
  { id: 'cat-eng', name: 'ภาษาอังกฤษ', description: 'ไวยากรณ์ คำศัพท์ Reading, Writing, Listening & Speaking', count: 0, isDbRecord: false },
  { id: 'cat-thai', name: 'ภาษาไทย', description: 'หลักภาษาไทย วรรณคดี การอ่านจับใจความ การเขียนความเรียง', count: 0, isDbRecord: false },
  { id: 'cat-social', name: 'สังคมศึกษา', description: 'ประวัติศาสตร์ ภูมิศาสตร์ หน้าที่พลเมือง เศรษฐศาสตร์ ศาสนา', count: 0, isDbRecord: false },
  { id: 'cat-tech', name: 'คอมพิวเตอร์และเทคโนโลยี', description: 'วิทยาการคำนวณ การเขียนโปรแกรม ระบบไอที และปัญญาประดิษฐ์', count: 0, isDbRecord: false },
  { id: 'cat-general', name: 'ทั่วไป', description: 'บทเรียน ความรู้ทั่วไป เทคนิคการเรียน และแนวข้อสอบรวม', count: 0, isDbRecord: false },
];

export const categoryService = {
  // Fetch all categories from backend or Supabase
  getAllCategories: async () => {
    try {
      // 1. Try Backend API first (GET /api/v1/categories)
      const response = await api.get('/categories');
      if (response.data && response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
        return response.data.data.map(cat => ({
          id: cat.id || cat.category_id,
          name: cat.name || cat.category_name || 'ทั่วไป',
          description: cat.description || `สรุปเนื้อหาและแนวข้อสอบวิชา ${cat.name || 'ทั่วไป'}`,
          views: cat._count?.posts ? cat._count.posts * 150 : (cat.views || 0),
          postCount: cat._count?.posts || 0,
          isDbRecord: isValidCategoryUuid(cat.id || cat.category_id),
        }));
      }

      // 2. If Backend returned empty array, query / seed via Supabase
      try {
        const { data: sbCategories, error: sbError } = await supabase
          .from('categories')
          .select('*');

        if (!sbError && Array.isArray(sbCategories) && sbCategories.length > 0) {
          return sbCategories.map(cat => ({
            id: cat.category_id || cat.id,
            name: cat.name || cat.category_name || 'ทั่วไป',
            description: `สรุปเนื้อหาและแนวข้อสอบวิชา ${cat.name || 'ทั่วไป'}`,
            views: 0,
            postCount: 0,
            isDbRecord: true,
          }));
        }

        // If categories table is still empty in DB, attempt to seed default categories with genuine UUIDs
        const defaultToInsert = DEFAULT_SUBJECT_NAMES.map(name => ({
          category_id: generateUuid(),
          name: name
        }));

        const { data: inserted, error: insertError } = await supabase
          .from('categories')
          .insert(defaultToInsert)
          .select('*');

        if (!insertError && Array.isArray(inserted) && inserted.length > 0) {
          return inserted.map(cat => ({
            id: cat.category_id || cat.id,
            name: cat.name || cat.category_name || 'ทั่วไป',
            description: `สรุปเนื้อหาและแนวข้อสอบวิชา ${cat.name || 'ทั่วไป'}`,
            views: 0,
            postCount: 0,
            isDbRecord: true,
          }));
        }
      } catch (sbEx) {
        console.log('Supabase categories fetch notice:', sbEx);
      }

      return DEFAULT_CATEGORIES;
    } catch (error) {
      console.warn('Notice: Failed to fetch categories from API, using default categories:', error);
      return DEFAULT_CATEGORIES;
    }
  },

  // Helper to match category by ID or name
  findCategory: (categories, query) => {
    if (!query) return null;
    const lower = String(query).toLowerCase().trim();
    return (categories || []).find(
      c => c.id === query || (c.name && c.name.toLowerCase().trim() === lower)
    );
  }
};

export default categoryService;
