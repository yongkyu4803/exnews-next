/**
 * Device ID 생성 및 관리 유틸리티
 * 브라우저 fingerprint 기반으로 고유한 기기 식별자를 생성합니다.
 * 로그인 없이 사용자별 알림 설정을 저장하기 위해 사용됩니다.
 */

const DEVICE_ID_KEY = 'exnews_device_id';

/**
 * 브라우저 fingerprint를 생성합니다.
 * navigator, screen, timezone 등의 정보를 조합하여 고유한 ID를 만듭니다.
 */
function generateBrowserFingerprint(): string {
  const components: string[] = [];

  // Navigator 정보
  components.push(navigator.userAgent);
  components.push(navigator.language);
  components.push(String(navigator.hardwareConcurrency || 0));
  components.push(String(navigator.maxTouchPoints || 0));

  // Screen 정보
  components.push(String(screen.width));
  components.push(String(screen.height));
  components.push(String(screen.colorDepth));
  components.push(String(screen.pixelDepth));

  // Timezone 정보
  components.push(String(new Date().getTimezoneOffset()));

  // Platform 정보
  components.push(navigator.platform);

  // Plugins 정보 (간단히)
  if (navigator.plugins) {
    const pluginNames = Array.from(navigator.plugins)
      .map(p => p.name)
      .slice(0, 5)
      .join(',');
    components.push(pluginNames);
  }

  // Canvas fingerprint (간단 버전)
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('EXNEWS', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('EXNEWS', 4, 17);
      components.push(canvas.toDataURL().slice(0, 100));
    }
  } catch (e) {
    // Canvas fingerprint 실패 시 무시
  }

  // 모든 컴포넌트를 합쳐서 해시 생성
  const fingerprint = components.join('|');
  return simpleHash(fingerprint);
}

/**
 * 간단한 해시 함수 (DJB2 알고리즘)
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // 양수로 변환하고 16진수로 변환
  return (hash >>> 0).toString(16);
}

/**
 * Device ID를 생성하거나 가져옵니다.
 * 이미 생성된 ID가 있으면 재사용하고, 없으면 새로 생성합니다.
 *
 * @returns Device ID (예: "device_a1b2c3d4_1234567890")
 */
export function getOrCreateDeviceId(): string {
  // 서버 사이드에서는 빈 문자열 반환
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    // 기존 Device ID 확인
    const existingId = localStorage.getItem(DEVICE_ID_KEY);
    if (existingId) {
      return existingId;
    }

    // 새로운 Device ID 생성
    const fingerprint = generateBrowserFingerprint();
    const timestamp = Date.now().toString(36); // 36진수로 변환하여 짧게
    const deviceId = `device_${fingerprint}_${timestamp}`;

    // 저장
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    return deviceId;
  } catch (error) {
    console.error('Device ID 생성 실패:', error);
    // 오류 시 임시 ID 반환 (메모리에만 존재)
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 저장된 Device ID를 가져옵니다.
 * 없으면 null을 반환합니다.
 */
export function getDeviceId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(DEVICE_ID_KEY);
  } catch (error) {
    console.error('Device ID 조회 실패:', error);
    return null;
  }
}

/**
 * Device ID를 삭제합니다.
 * 알림 구독 취소 시 사용됩니다.
 */
export function clearDeviceId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(DEVICE_ID_KEY);
  } catch (error) {
    console.error('Device ID 삭제 실패:', error);
  }
}

/**
 * Device ID가 유효한지 확인합니다.
 */
export function isValidDeviceId(deviceId: string | null): boolean {
  if (!deviceId) return false;

  // device_ 또는 temp_로 시작하는지 확인
  return /^(device|temp)_[a-z0-9]+_[a-z0-9]+$/i.test(deviceId);
}
