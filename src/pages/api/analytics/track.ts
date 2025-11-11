import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabaseClient';
import { createLogger } from '@/utils/logger';
import { VisitAnalytics } from '@/types';

const logger = createLogger('API:Analytics:Track');

interface TrackRequest {
  session_id: string;
  visitor_id: string;
  page_path: string;
  tab_name?: string;
  event_type: string;
  referrer?: string;
  user_agent?: string;
  device_type: string;
  duration_seconds?: number;
  scroll_depth?: number;
  interaction_count?: number;
  exit_page?: boolean;
}

interface TrackResponse {
  success: boolean;
  message?: string;
  id?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TrackResponse | ErrorResponse>
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set timeout to prevent QUIC protocol errors
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  try {
    const trackData: TrackRequest = req.body;

    // Validate required fields
    if (!trackData.session_id || !trackData.visitor_id || !trackData.page_path ||
        !trackData.event_type || !trackData.device_type) {
      logger.error('Missing required fields in track request', { trackData });
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'session_id, visitor_id, page_path, event_type, and device_type are required'
      });
    }

    // Validate event_type
    const validEventTypes = ['page_view', 'tab_change', 'interaction'];
    if (!validEventTypes.includes(trackData.event_type)) {
      return res.status(400).json({
        error: 'Invalid event_type',
        details: `event_type must be one of: ${validEventTypes.join(', ')}`
      });
    }

    // Validate device_type
    const validDeviceTypes = ['mobile', 'desktop'];
    if (!validDeviceTypes.includes(trackData.device_type)) {
      return res.status(400).json({
        error: 'Invalid device_type',
        details: `device_type must be one of: ${validDeviceTypes.join(', ')}`
      });
    }

    // Validate tab_name if provided
    if (trackData.tab_name) {
      const validTabNames = ['exclusive', 'ranking', 'editorial', 'political', 'bills', 'restaurant'];
      if (!validTabNames.includes(trackData.tab_name)) {
        return res.status(400).json({
          error: 'Invalid tab_name',
          details: `tab_name must be one of: ${validTabNames.join(', ')}`
        });
      }
    }

    // Validate scroll_depth if provided
    if (trackData.scroll_depth !== undefined &&
        (trackData.scroll_depth < 0 || trackData.scroll_depth > 100)) {
      return res.status(400).json({
        error: 'Invalid scroll_depth',
        details: 'scroll_depth must be between 0 and 100'
      });
    }

    // Prepare data for insertion
    const analyticsData: Partial<VisitAnalytics> = {
      session_id: trackData.session_id,
      visitor_id: trackData.visitor_id,
      page_path: trackData.page_path,
      tab_name: trackData.tab_name as any,
      event_type: trackData.event_type as any,
      referrer: trackData.referrer || undefined,
      user_agent: trackData.user_agent || req.headers['user-agent'],
      device_type: trackData.device_type as any,
      duration_seconds: trackData.duration_seconds,
      scroll_depth: trackData.scroll_depth,
      interaction_count: trackData.interaction_count || 0,
      exit_page: trackData.exit_page || false
    };

    // Insert into Supabase with timeout protection
    const insertPromise = supabase
      .from('exnews_visit_analytics')
      .insert([analyticsData])
      .select('id')
      .single();

    // 10초 타임아웃 설정
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Analytics insert timeout')), 10000)
    );

    const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

    if (error) {
      logger.error('Failed to insert analytics data', { error, analyticsData });
      return res.status(500).json({
        error: 'Failed to track event',
        details: error.message
      });
    }

    logger.info('Analytics event tracked successfully', {
      id: data.id,
      event_type: trackData.event_type,
      tab_name: trackData.tab_name
    });

    return res.status(200).json({
      success: true,
      message: 'Event tracked successfully',
      id: data.id
    });

  } catch (error) {
    logger.error('Unexpected error in track endpoint', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
