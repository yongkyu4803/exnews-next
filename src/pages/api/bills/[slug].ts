import { supabase } from '@/lib/supabaseClient';
import { createLogger } from '@/utils/logger';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { BillsReport, BillItem, BillsReportWithBills } from '@/types/bills';

const logger = createLogger('API:BillsDetail');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.query;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Invalid slug parameter' });
  }

  try {
    // 리포트 정보 가져오기
    const { data: reportData, error: reportError } = await supabase
      .from('bills_monitor_reports')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (reportError) {
      logger.error('Failed to fetch report', reportError);
      throw reportError;
    }

    if (!reportData) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const report = reportData as BillsReport;

    // 법안 목록 가져오기
    const { data: billsData, error: billsError } = await supabase
      .from('bills_monitor_bills')
      .select('*')
      .eq('report_id', report.id)
      .order('regulation_type', { ascending: true });

    if (billsError) {
      logger.error('Failed to fetch bills', billsError);
      throw billsError;
    }

    const result: BillsReportWithBills = {
      ...report,
      bills: billsData as BillItem[],
    };

    // 영향 대상 데이터 확인
    if (billsData && billsData.length > 0) {
      console.log('=== 첫 번째 법안 전체 데이터 ===');
      console.log(JSON.stringify(billsData[0], null, 2));
      console.log('=== regulation_affected_groups 필드 ===');
      billsData.slice(0, 3).forEach((bill: any) => {
        console.log(`법안명: ${bill.bill_name}`);
        console.log(`regulation_affected_groups:`, bill.regulation_affected_groups);
        console.log(`summary_who_affected:`, bill.summary_who_affected);
        console.log('---');
      });
    }

    logger.info('Bills report detail fetched successfully', {
      slug,
      billsCount: billsData?.length || 0
    });

    res.status(200).json({ data: result });
  } catch (error: any) {
    logger.error('Error in bills detail API', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bill report detail' });
  }
}
