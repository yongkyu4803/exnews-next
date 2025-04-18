/**
 * 푸시 알림 유틸리티 함수
 */

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
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('서비스 워커 등록 성공:', registration.scope);
    return registration;
  } catch (error) {
    console.error('서비스 워커 등록 실패:', error);
    throw error;
  }
};

// 푸시 구독 등록
export const subscribeToPush = async (): Promise<PushSubscription | null> => {
  try {
    if (!isPushNotificationSupported()) {
      console.log('푸시 알림이 지원되지 않습니다.');
      return null;
    }
    
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.log('알림 권한이 없습니다.');
      return null;
    }
    
    const registration = await navigator.serviceWorker.ready;
    
    // 기존 구독 확인
    let subscription = await registration.pushManager.getSubscription();
    
    // 기존 구독이 없으면 새로 구독
    if (!subscription) {
      // Public VAPID Key를 Uint8Array로 변환
      const applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY);
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
    }
    
    console.log('푸시 구독 정보:', subscription);
    
    // 서버에 구독 정보 전송 (실제 구현 필요)
    // await sendSubscriptionToServer(subscription);
    
    return subscription;
  } catch (error) {
    console.error('푸시 구독 실패:', error);
    return null;
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
    
    // 서버에서 구독 정보 삭제 요청 (실제 구현 필요)
    // await deleteSubscriptionFromServer(subscription);
    
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
  categories: {
    [key: string]: boolean;
  };
  schedule: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
}

// 기본 알림 설정
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: false,
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
    morning: true,
    afternoon: false,
    evening: true
  }
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
    const notification = new Notification('단독 뉴스 테스트 알림', {
      body: '알림 기능이 정상 작동하고 있습니다.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'test-notification',
      renotify: true,
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
    
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    
    return true;
  } catch (error) {
    console.error('테스트 알림 전송 실패:', error);
    return false;
  }
}; 