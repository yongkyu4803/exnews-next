import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { createLogger } from '@/utils/logger';

const logger = createLogger('API:GovReleases');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agency } = req.query;
    const limit = 5;

    // If specific agency requested, fetch only that agency
    if (agency && typeof agency === 'string') {
      const { data, error } = await supabase
        .from('press_releases')
        .select(`
          id,
          title,
          link,
          release_date,
          department,
          summary,
          agency_code,
          created_at
        `)
        .eq('agency_code', agency)
        .order('release_date', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching press releases for agency', { agency, error });
        throw error;
      }

      return res.status(200).json({ data });
    }

    // Fetch 5 releases from each agency
    const agencies = ['ftc', 'kca', 'fsc', 'fss'];
    const results = await Promise.all(
      agencies.map(async (agencyCode) => {
        const { data, error } = await supabase
          .from('press_releases')
          .select(`
            id,
            title,
            link,
            release_date,
            department,
            summary,
            agency_code,
            created_at
          `)
          .eq('agency_code', agencyCode)
          .order('release_date', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          logger.error(`Error fetching ${agencyCode} releases`, error);
          return { agency_code: agencyCode, items: [], error: error.message };
        }

        return { agency_code: agencyCode, items: data || [] };
      })
    );

    // Get agency names
    const { data: agenciesData } = await supabase
      .from('agencies')
      .select('agency_code, name, name_en, url');

    const agencyMap = (agenciesData || []).reduce((acc, agency) => {
      acc[agency.agency_code] = agency;
      return acc;
    }, {} as Record<string, any>);

    // Combine results with agency info
    const combined = results.map((result) => ({
      ...result,
      agency_name: agencyMap[result.agency_code]?.name || result.agency_code,
      agency_name_en: agencyMap[result.agency_code]?.name_en,
      agency_url: agencyMap[result.agency_code]?.url,
    }));

    logger.info('Successfully fetched government press releases', {
      total: combined.reduce((sum, r) => sum + r.items.length, 0),
    });

    res.status(200).json({ data: combined });
  } catch (error: any) {
    logger.error('Failed to fetch government press releases', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
