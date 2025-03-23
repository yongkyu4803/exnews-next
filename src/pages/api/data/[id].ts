import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: '유효한 ID가 필요합니다' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('news_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (!data) {
        return res.status(404).json({ error: '아이템을 찾을 수 없습니다' });
      }
      
      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } 
  // 향후 PUT, DELETE 메서드 구현 (CRUD 기능 확장 시)
  else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}