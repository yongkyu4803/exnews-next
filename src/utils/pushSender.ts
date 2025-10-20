/**
 * 푸시 알림 전송 유틸리티 (서버 사이드)
 * web-push 라이브러리를 사용하여 실제 푸시 알림을 전송합니다.
 */

import webpush from 'web-push';

// VAPID 키 설정 (환경 변수에서 가져옴)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:gq.newslens@gmail.com';

// web-push 설정
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, any>;
}

export interface SendPushResult {
  success: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * 단일 사용자에게 푸시 알림을 전송합니다
 *
 * @param subscription PushSubscription 객체
 * @param payload 알림 내용
 * @returns 전송 결과
 */
export async function sendPushNotification(
  subscription: PushSubscriptionJSON,
  payload: PushNotificationPayload
): Promise<SendPushResult> {
  try {
    // VAPID 키 확인
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.error('VAPID 키가 설정되지 않았습니다.');
      return {
        success: false,
        error: 'VAPID keys not configured'
      };
    }

    // 구독 정보 유효성 검사
    if (!subscription || !subscription.endpoint) {
      return {
        success: false,
        error: 'Invalid subscription'
      };
    }

    // 알림 페이로드 생성
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icons/icon-192x192.png',
      badge: payload.badge || '/icons/badge-72x72.png',
      tag: payload.tag || 'news-notification',
      data: {
        url: payload.url || '/',
        ...payload.data
      },
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: '보기'
        },
        {
          action: 'close',
          title: '닫기'
        }
      ]
    });

    // 푸시 전송
    const response = await webpush.sendNotification(
      subscription as any,
      notificationPayload
    );

    return {
      success: true,
      statusCode: response.statusCode
    };
  } catch (error: any) {
    console.error('푸시 알림 전송 실패:', error);

    // 410 Gone: 구독이 만료됨 (클라이언트에서 구독 취소 필요)
    if (error.statusCode === 410) {
      return {
        success: false,
        error: 'Subscription expired',
        statusCode: 410
      };
    }

    // 404 Not Found: 구독이 존재하지 않음
    if (error.statusCode === 404) {
      return {
        success: false,
        error: 'Subscription not found',
        statusCode: 404
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error',
      statusCode: error.statusCode
    };
  }
}

/**
 * 여러 사용자에게 동시에 푸시 알림을 전송합니다
 *
 * @param subscriptions PushSubscription 객체 배열
 * @param payload 알림 내용
 * @returns 전송 결과 배열
 */
export async function sendPushNotificationBatch(
  subscriptions: Array<{ device_id: string; subscription: PushSubscriptionJSON }>,
  payload: PushNotificationPayload
): Promise<Array<{ device_id: string; result: SendPushResult }>> {
  const results = await Promise.allSettled(
    subscriptions.map(async ({ device_id, subscription }) => ({
      device_id,
      result: await sendPushNotification(subscription, payload)
    }))
  );

  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => (r as PromiseFulfilledResult<any>).value);
}

/**
 * 키워드 매칭 알림을 생성합니다
 *
 * @param newsTitle 뉴스 제목
 * @param matchedKeywords 매칭된 키워드 목록
 * @param newsLink 뉴스 링크
 * @returns 알림 페이로드
 */
export function createKeywordNotificationPayload(
  newsTitle: string,
  matchedKeywords: string[],
  newsLink: string,
  mediaName?: string
): PushNotificationPayload {
  const keywordText = matchedKeywords.length > 1
    ? `${matchedKeywords[0]} 외 ${matchedKeywords.length - 1}개`
    : matchedKeywords[0];

  const title = `🔔 [${keywordText}] 관련 뉴스`;

  // 제목이 너무 길면 자르기 (50자 제한)
  const truncatedTitle = newsTitle.length > 50
    ? newsTitle.substring(0, 47) + '...'
    : newsTitle;

  const body = mediaName
    ? `${mediaName} - ${truncatedTitle}`
    : truncatedTitle;

  return {
    title,
    body,
    url: newsLink,
    tag: `keyword-${matchedKeywords[0]}`,
    data: {
      keywords: matchedKeywords,
      type: 'keyword-match'
    }
  };
}

/**
 * 카테고리 기반 알림을 생성합니다
 *
 * @param newsTitle 뉴스 제목
 * @param category 카테고리
 * @param newsLink 뉴스 링크
 * @returns 알림 페이로드
 */
export function createCategoryNotificationPayload(
  newsTitle: string,
  category: string,
  newsLink: string,
  mediaName?: string
): PushNotificationPayload {
  const title = `📰 [${category}] 새로운 뉴스`;

  const truncatedTitle = newsTitle.length > 50
    ? newsTitle.substring(0, 47) + '...'
    : newsTitle;

  const body = mediaName
    ? `${mediaName} - ${truncatedTitle}`
    : truncatedTitle;

  return {
    title,
    body,
    url: newsLink,
    tag: `category-${category}`,
    data: {
      category,
      type: 'category-news'
    }
  };
}

/**
 * 만료된 구독 정보를 정리합니다
 *
 * @param device_id 기기 ID
 * @returns 정리 성공 여부
 */
export async function cleanupExpiredSubscription(device_id: string): Promise<boolean> {
  try {
    // API 호출하여 구독 삭제
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications/settings?device_id=${device_id}`, {
      method: 'DELETE'
    });

    return response.ok || response.status === 404;
  } catch (error) {
    console.error('구독 정리 실패:', error);
    return false;
  }
}
