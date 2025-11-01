import { supabase } from '@/lib/supabaseClient';
import { createLogger } from '@/utils/logger';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { BillsReport } from '@/types/bills';

const logger = createLogger('API:Bills');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('bills_monitor_reports')
      .select('*')
      .eq('is_published', true)
      .order('report_date', { ascending: false });

    if (error) {
      logger.error('Failed to fetch bills reports', error);
      throw error;
    }

    logger.info('Bills reports fetched successfully', { count: data?.length || 0 });
    res.status(200).json({ data: data as BillsReport[] });
  } catch (error: any) {
    logger.error('Error in bills API', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bills reports' });
  }
}
