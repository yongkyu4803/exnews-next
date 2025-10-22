/**
 * 푸시 알림 유틸리티 함수
 */

import { getOrCreateDeviceId } from './deviceId';

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

// 푸시 알림 지원 여부 확인
export const isPushNotificationSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// 알림 권한 요청
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    throw new Error('이 브라우저는 알림을 지원하지 않습니다.');
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    throw new Error('알림 권한이 거부되었습니다. 브라우저 설정에서 변경해주세요.');
  }
  
  const permission = await Notification.requestPermission();
  return permission;
};

// 서비스 워커 등록
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('이 브라우저는 서비스 워커를 지원하지 않습니다.');
  }

  try {
    // next-pwa가 생성한 sw.js 사용 (개발/프로덕션 모두)
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('서비스 워커 등록 성공:', registration.scope);
    await navigator.serviceWorker.ready;
    console.log('서비스 워커 준비 완료');
    return registration;
  } catch (error) {
    console.error('서비스 워커 등록 실패:', error);
    throw error;
  }
};

// 푸시 구독 등록
export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  console.log('[subscribeToPush] 🚀 시작...');

  try {
    console.log('[subscribeToPush] Step 1: 지원 여부 확인');
    if (!isPushNotificationSupported()) {
      console.error('[subscribeToPush] ❌ 푸시 알림이 지원되지 않습니다.');
      return null;
    }
    console.log('[subscribeToPush] ✅ 푸시 알림 지원됨');

    console.log('[subscribeToPush] Step 2: 권한 요청');
    const permission = await requestNotificationPermission();
    console.log('[subscribeToPush] 권한 결과:', permission);
    if (permission !== 'granted') {
      console.error('[subscribeToPush] ❌ 알림 권한이 없습니다:', permission);
      return null;
    }
    console.log('[subscribeToPush] ✅ 알림 권한 승인됨');

    console.log('[subscribeToPush] Step 3: 서비스 워커 확인');
    let registration = await navigator.serviceWorker.getRegistration();
    if (!registration) {
      console.log('[subscribeToPush] 서비스 워커 없음, 등록 시작...');
      registration = await registerServiceWorker();
    }
    console.log('[subscribeToPush] ✅ 서비스 워커 등록됨:', registration?.scope);

    console.log('[subscribeToPush] Step 4: 서비스 워커 준비 대기');
    await navigator.serviceWorker.ready;
    console.log('[subscribeToPush] ✅ 서비스 워커 준비 완료');

    console.log('[subscribeToPush] Step 5: 기존 구독 확인');
    let subscription = await registration.pushManager.getSubscription();
    console.log('[subscribeToPush] 기존 구독:', subscription ? '있음' : '없음');

    // 기존 구독이 없으면 새로 구독
    if (!subscription) {
      console.log('[subscribeToPush] Step 6: 새 구독 생성');

      // VAPID 키가 없으면 에러 발생
      if (!PUBLIC_VAPID_KEY) {
        console.error('[subscribeToPush] ❌ VAPID 키가 설정되지 않았습니다!');
        console.error('[subscribeToPush] PUBLIC_VAPID_KEY:', PUBLIC_VAPID_KEY);
        throw new Error('VAPID 키가 설정되지 않았습니다.');
      }
      console.log('[subscribeToPush] ✅ VAPID 키 확인:', PUBLIC_VAPID_KEY.substring(0, 20) + '...');

      // Public VAPID Key를 Uint8Array로 변환
      const applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      console.log('[subscribeToPush] VAPID 키 변환 완료, 구독 시도 중...');

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      console.log('[subscribeToPush] ✅ 새 구독 생성 성공!');
    }

    console.log('[subscribeToPush] Step 7: 구독 정보 확인');
    console.log('[subscribeToPush] Endpoint:', subscription.endpoint);
    console.log('[subscribeToPush] Keys:', Object.keys(subscription.toJSON().keys || {}));

    console.log('[subscribeToPush] Step 8: 서버에 구독 정보 전송');
    await sendSubscriptionToServer(subscription);
    console.log('[subscribeToPush] ✅ 서버 전송 성공!');

    console.log('[subscribeToPush] 🎉 전체 프로세스 완료!');
    return subscription;
  } catch (error) {
    console.error('[subscribeToPush] ❌❌❌ 푸시 구독 실패:', error);
    console.error('[subscribeToPush] 에러 상세:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
};

// 구독 취소
export const unsubscribeFromPush = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      return true;
    }
    
    // 서버에서 구독 정보 삭제 요청
    await deleteSubscriptionFromServer();

    const result = await subscription.unsubscribe();
    console.log('푸시 구독 취소:', result);
    return result;
  } catch (error) {
    console.error('푸시 구독 취소 실패:', error);
    return false;
  }
};

// 카테고리별 푸시 알림 설정
export const subscribeToPushByCategory = async (category: string): Promise<boolean> => {
  try {
    const subscription = await subscribeToPush();
    if (!subscription) {
      return false;
    }
    
    // 로컬 스토리지에 카테고리 선호도 저장
    const preferences = getNotificationPreferences();
    preferences.categories[category] = true;
    saveNotificationPreferences(preferences);
    
    return true;
  } catch (error) {
    console.error(`${category} 카테고리 구독 실패:`, error);
    return false;
  }
};

// 카테고리별 푸시 알림 취소
export const unsubscribeFromPushByCategory = async (category: string): Promise<boolean> => {
  try {
    const preferences = getNotificationPreferences();
    preferences.categories[category] = false;
    saveNotificationPreferences(preferences);
    
    return true;
  } catch (error) {
    console.error(`${category} 카테고리 구독 취소 실패:`, error);
    return false;
  }
};

// Base64 URL을 Uint8Array로 변환
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
};

// 사용자 알림 설정 인터페이스
interface NotificationPreferences {
  enabled: boolean;
  notificationMode?: 'all' | 'keyword'; // 알림 모드: 전체 뉴스 or 키워드만
  categories: {
    [key: string]: boolean;
  };
  schedule: {
    enabled: boolean; // 시간 제한 활성화 여부
    startTime: string; // 시작 시간 (HH:mm 형식, 한국 시간 KST)
    endTime: string;   // 종료 시간 (HH:mm 형식, 한국 시간 KST)
  };
  keywords?: string[]; // 관심 키워드 목록
}

// 기본 알림 설정
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false,
  notificationMode: 'all',
  categories: {
    all: true,
    정치: false,
    경제: false,
    사회: false,
    국제: false,
    문화: false,
    '연예/스포츠': false,
    기타: false
  },
  schedule: {
    enabled: false,     // 기본적으로 시간 제한 비활성화 (24시간 알림)
    startTime: '09:00', // 기본 시작 시간: 오전 9시 (KST)
    endTime: '22:00'    // 기본 종료 시간: 오후 10시 (KST)
  },
  keywords: []
};

// 알림 설정 가져오기
export const getNotificationPreferences = (): NotificationPreferences => {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  
  const storedPrefs = localStorage.getItem('notification_preferences');
  if (!storedPrefs) {
    return DEFAULT_PREFERENCES;
  }
  
  try {
    return JSON.parse(storedPrefs);
  } catch (error) {
    console.error('알림 설정 가져오기 실패:', error);
    return DEFAULT_PREFERENCES;
  }
};

// 알림 설정 저장하기
export const saveNotificationPreferences = (preferences: NotificationPreferences): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
  } catch (error) {
    console.error('알림 설정 저장 실패:', error);
  }
};

// 테스트 알림 보내기
export const sendTestNotification = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.error('이 브라우저는 알림을 지원하지 않습니다.');
    return false;
  }

  if (Notification.permission !== 'granted') {
    console.log('알림 권한이 없습니다.');
    return false;
  }

  try {
    // Service Worker를 통한 알림 (actions 지원)
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification('단독 뉴스 테스트 알림', {
      body: '알림 기능이 정상 작동하고 있습니다.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'test-notification',
      requireInteraction: false,
      data: {
        url: '/'
      },
      actions: [
        {
          action: 'open',
          title: '열기'
        },
        {
          action: 'dismiss',
          title: '닫기'
        }
      ]
    });

    console.log('테스트 알림 전송 성공');
    return true;
  } catch (error) {
    console.error('테스트 알림 전송 실패:', error);
    return false;
  }
};

/**
 * 서버에 푸시 구독 정보 전송
 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  console.log('[sendSubscriptionToServer] 🚀 시작...');

  try {
    const deviceId = getOrCreateDeviceId();
    console.log('[sendSubscriptionToServer] Device ID:', deviceId);

    const subscriptionJSON = subscription.toJSON();
    console.log('[sendSubscriptionToServer] Subscription JSON:', {
      endpoint: subscriptionJSON.endpoint?.substring(0, 50) + '...',
      hasKeys: !!subscriptionJSON.keys,
      keysCount: Object.keys(subscriptionJSON.keys || {}).length
    });

    console.log('[sendSubscriptionToServer] API 호출 중...');
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: deviceId,
        subscription: subscriptionJSON
      })
    });

    console.log('[sendSubscriptionToServer] API 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sendSubscriptionToServer] ❌ 서버 응답 오류:', errorText);
      throw new Error(`서버 응답 오류: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[sendSubscriptionToServer] ✅ 서버 구독 등록 성공:', data);
  } catch (error) {
    console.error('[sendSubscriptionToServer] ❌❌❌ 서버 구독 전송 실패:', error);
    console.error('[sendSubscriptionToServer] 에러 상세:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * 서버에서 푸시 구독 정보 삭제
 */
async function deleteSubscriptionFromServer(): Promise<void> {
  try {
    const deviceId = getOrCreateDeviceId();

    const response = await fetch(`/api/notifications/settings?device_id=${deviceId}`, {
      method: 'DELETE'
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }

    console.log('서버 구독 삭제 성공');
  } catch (error) {
    console.error('서버 구독 삭제 실패:', error);
    // 삭제 실패해도 로컬 구독 취소는 진행
  }
}

/**
 * 서버에서 알림 설정 가져오기
 */
export async function fetchNotificationSettings(): Promise<NotificationPreferences | null> {
  try {
    const deviceId = getOrCreateDeviceId();

    const response = await fetch(`/api/notifications/settings?device_id=${deviceId}`);

    if (response.status === 404) {
      // 설정이 없는 경우 - 정상
      return null;
    }

    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }

    const data = await response.json();

    // 서버 데이터를 NotificationPreferences 형식으로 변환
    return {
      enabled: data.enabled,
      notificationMode: data.notificationMode || 'all',
      categories: data.categories,
      schedule: data.schedule,
      keywords: data.keywords || []
    };
  } catch (error) {
    console.error('서버 설정 가져오기 실패:', error);
    return null;
  }
}

/**
 * 서버에 알림 설정 저장
 */
export async function saveNotificationSettingsToServer(
  preferences: NotificationPreferences
): Promise<boolean> {
  try {
    const deviceId = getOrCreateDeviceId();

    const response = await fetch('/api/notifications/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_id: deviceId,
        enabled: preferences.enabled,
        categories: preferences.categories,
        schedule: preferences.schedule,
        keywords: preferences.keywords || []
      })
    });

    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }

    console.log('서버 설정 저장 성공');
    return true;
  } catch (error) {
    console.error('서버 설정 저장 실패:', error);
    return false;
  }
} 