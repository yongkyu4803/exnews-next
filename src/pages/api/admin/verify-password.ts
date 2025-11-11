import type { NextApiRequest, NextApiResponse } from 'next';
import { createLogger } from '@/utils/logger';

const logger = createLogger('API:Admin:VerifyPassword');

/**
 * Admin password verification API
 * POST /api/admin/verify-password
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; message?: string }>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { password } = req.body;

    // Validate input
    if (!password || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: '비밀번호를 입력해주세요.'
      });
    }

    // Get password from environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      logger.error('ADMIN_PASSWORD environment variable is not set');
      return res.status(500).json({
        success: false,
        message: '서버 설정 오류가 발생했습니다.'
      });
    }

    // Verify password
    const isValid = password === adminPassword;

    if (isValid) {
      logger.info('Admin authentication successful');
      return res.status(200).json({ success: true });
    } else {
      logger.warn('Admin authentication failed - invalid password');
      return res.status(401).json({
        success: false,
        message: '비밀번호가 일치하지 않습니다.'
      });
    }
  } catch (error) {
    logger.error('Error verifying password', error);
    return res.status(500).json({
      success: false,
      message: '인증 처리 중 오류가 발생했습니다.'
    });
  }
}
