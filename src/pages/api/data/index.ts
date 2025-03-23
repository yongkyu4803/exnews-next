import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      const { page = '1', pageSize = '20', category } = req.query;
      
      const pageNum = parseInt(page as string, 10);
      const pageSizeNum = parseInt(pageSize as string, 10);
      const startIndex = (pageNum - 1) * pageSizeNum;
      
      let query = supabase
        .from('news_items')
        .select('id, title, original_link, pub_date, category', { count: 'exact' });
      
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      
      const { data, error, count } = await query
        .order('pub_date', { ascending: false })
        .range(startIndex, startIndex + pageSizeNum - 1);
      
      if (error) {
        throw error;
      }
      
      res.status(200).json({
        items: data,
        totalCount: count || 0,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}