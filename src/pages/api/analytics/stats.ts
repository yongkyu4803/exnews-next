import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { createLogger } from '@/utils/logger';
import { AnalyticsResponse, AnalyticsStats, TabStats, DeviceStats, DateRangeStats } from '@/types';

const logger = createLogger('API:Analytics:Stats');

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsResponse | ErrorResponse>
) {
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startDate, endDate, tabName, trend } = req.query;

    // Fetch all data with pagination to bypass 1000 row limit
    let allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('exnews_visit_analytics')
        .select('*');

      if (startDate) {
        query = query.gte('created_at', startDate as string);
      }
      if (endDate) {
        query = query.lte('created_at', endDate as string);
      }
      if (tabName && tabName !== 'all') {
        query = query.eq('tab_name', tabName as string);
      }

      // Apply ordering and pagination
      query = query
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch analytics data', { error, page });
        return res.status(500).json({
          error: 'Failed to fetch analytics data',
          details: error.message
        });
      }

      if (!data || data.length === 0) {
        hasMore = false;
      } else {
        allData = allData.concat(data);
        hasMore = data.length === pageSize;
        page++;
      }
    }

    const analyticsData = allData;

    // 디버깅: 가져온 데이터 정보 로그
    if (analyticsData && analyticsData.length > 0) {
      const dates = analyticsData.map(item => new Date(item.created_at).toISOString().split('T')[0]);
      const uniqueDates = [...new Set(dates)].sort();
      logger.info('Fetched analytics data', {
        totalRecords: analyticsData.length,
        pagesLoaded: page,
        dateRange: `${uniqueDates[0]} ~ ${uniqueDates[uniqueDates.length - 1]}`,
        uniqueDates: uniqueDates.length,
        latestDate: uniqueDates[uniqueDates.length - 1]
      });
    }

    if (!analyticsData || analyticsData.length === 0) {
      logger.info('No analytics data found', { startDate, endDate, tabName });
      return res.status(200).json({
        stats: {
          total_visitors: 0,
          total_pageviews: 0,
          total_sessions: 0,
          tab_stats: [],
          device_stats: { mobile: 0, desktop: 0 }
        },
        trend: []
      });
    }

    // Calculate statistics
    const uniqueVisitors = new Set(analyticsData.map(item => item.visitor_id)).size;
    const uniqueSessions = new Set(analyticsData.map(item => item.session_id)).size;
    const totalPageviews = analyticsData.filter(item => item.event_type === 'page_view').length;

    // Calculate tab statistics
    const tabCounts: Record<string, number> = {};
    analyticsData.forEach(item => {
      if (item.tab_name) {
        tabCounts[item.tab_name] = (tabCounts[item.tab_name] || 0) + 1;
      }
    });

    const tabStats: TabStats[] = Object.entries(tabCounts).map(([tab_name, count]) => ({
      tab_name: tab_name as any,
      count,
      percentage: Math.round((count / analyticsData.length) * 100)
    }));

    // Calculate device statistics
    const deviceCounts = analyticsData.reduce(
      (acc, item) => {
        if (item.device_type === 'mobile') {
          acc.mobile++;
        } else if (item.device_type === 'desktop') {
          acc.desktop++;
        }
        return acc;
      },
      { mobile: 0, desktop: 0 }
    );

    // Phase 2: Calculate advanced metrics if available
    const itemsWithDuration = analyticsData.filter(item => item.duration_seconds !== null);
    const avgDuration = itemsWithDuration.length > 0
      ? Math.round(
          itemsWithDuration.reduce((sum, item) => sum + (item.duration_seconds || 0), 0) /
          itemsWithDuration.length
        )
      : undefined;

    const itemsWithScroll = analyticsData.filter(item => item.scroll_depth !== null);
    const avgScrollDepth = itemsWithScroll.length > 0
      ? Math.round(
          itemsWithScroll.reduce((sum, item) => sum + (item.scroll_depth || 0), 0) /
          itemsWithScroll.length
        )
      : undefined;

    const bounceRate = analyticsData.length > 0
      ? Math.round(
          (analyticsData.filter(item => item.exit_page === true).length / uniqueSessions) * 100
        )
      : undefined;

    const stats: AnalyticsStats = {
      total_visitors: uniqueVisitors,
      total_pageviews: totalPageviews,
      total_sessions: uniqueSessions,
      tab_stats: tabStats,
      device_stats: deviceCounts,
      avg_duration: avgDuration,
      avg_scroll_depth: avgScrollDepth,
      bounce_rate: bounceRate
    };

    // Calculate trend data if requested
    let trendData: DateRangeStats[] | undefined;

    if (trend === 'true' || trend === '1') {
      // Group by date
      const dateGroups: Record<string, typeof analyticsData> = {};
      analyticsData.forEach(item => {
        const date = new Date(item.created_at).toISOString().split('T')[0];
        if (!dateGroups[date]) {
          dateGroups[date] = [];
        }
        dateGroups[date].push(item);
      });

      trendData = Object.entries(dateGroups)
        .map(([date, items]) => {
          const uniqueVisitorsForDate = new Set(items.map(item => item.visitor_id)).size;
          const uniqueSessionsForDate = new Set(items.map(item => item.session_id)).size;
          const pageviewsForDate = items.filter(item => item.event_type === 'page_view').length;

          // Tab stats for this date
          const tabCountsForDate: Record<string, number> = {};
          items.forEach(item => {
            if (item.tab_name) {
              tabCountsForDate[item.tab_name] = (tabCountsForDate[item.tab_name] || 0) + 1;
            }
          });

          const tabStatsForDate: TabStats[] = Object.entries(tabCountsForDate).map(([tab_name, count]) => ({
            tab_name: tab_name as any,
            count,
            percentage: Math.round((count / items.length) * 100)
          }));

          // Device stats for this date
          const deviceCountsForDate = items.reduce(
            (acc, item) => {
              if (item.device_type === 'mobile') {
                acc.mobile++;
              } else if (item.device_type === 'desktop') {
                acc.desktop++;
              }
              return acc;
            },
            { mobile: 0, desktop: 0 }
          );

          return {
            date,
            total_visitors: uniqueVisitorsForDate,
            total_pageviews: pageviewsForDate,
            total_sessions: uniqueSessionsForDate,
            tab_stats: tabStatsForDate,
            device_stats: deviceCountsForDate
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    logger.info('Analytics stats calculated successfully', {
      total_visitors: uniqueVisitors,
      total_sessions: uniqueSessions,
      total_pageviews: totalPageviews
    });

    return res.status(200).json({
      stats,
      trend: trendData
    });

  } catch (error) {
    logger.error('Unexpected error in stats endpoint', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
