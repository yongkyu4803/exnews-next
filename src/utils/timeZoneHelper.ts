/**
 * 한국 시간(KST, UTC+9) 기반 시간대 체크 유틸리티
 */

/**
 * 현재 한국 시간(KST)을 반환합니다.
 *
 * @returns Date 객체 (KST 기준)
 */
export function getCurrentKSTTime(): Date {
  // 현재 UTC 시간
  const now = new Date();

  // UTC 밀리초 변환
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

  // KST는 UTC+9 (9시간 = 9 * 60 * 60 * 1000 = 32400000ms)
  const kstTime = new Date(utcTime + (9 * 60 * 60 * 1000));

  return kstTime;
}

/**
 * 현재 KST 시간을 HH:mm 형식 문자열로 반환합니다.
 *
 * @returns "14:30" 형식의 문자열
 */
export function getCurrentKSTTimeString(): string {
  const kst = getCurrentKSTTime();
  const hours = String(kst.getHours()).padStart(2, '0');
  const minutes = String(kst.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 사용자 설정 시간대 내에 있는지 체크합니다.
 *
 * @param schedule - 사용자의 알림 시간 설정
 * @returns true: 알림 발송 가능, false: 알림 발송 불가
 *
 * @example
 * // 시간 제한 비활성화 (24시간 알림)
 * isWithinSchedule({ enabled: false, startTime: "09:00", endTime: "22:00" })
 * // → true (항상 알림 발송)
 *
 * // 현재 KST 시간이 14:30이고 설정이 09:00~22:00
 * isWithinSchedule({ enabled: true, startTime: "09:00", endTime: "22:00" })
 * // → true (시간대 내)
 *
 * // 현재 KST 시간이 23:00이고 설정이 09:00~22:00
 * isWithinSchedule({ enabled: true, startTime: "09:00", endTime: "22:00" })
 * // → false (시간대 밖)
 */
export function isWithinSchedule(schedule: {
  enabled: boolean;
  startTime: string;
  endTime: string;
}): boolean {
  // 시간 제한이 비활성화되어 있으면 항상 true (24시간 알림)
  if (!schedule.enabled) {
    return true;
  }

  const currentTime = getCurrentKSTTimeString();
  const { startTime, endTime } = schedule;

  // 자정을 넘지 않는 경우 (예: 09:00 ~ 22:00)
  if (startTime <= endTime) {
    return currentTime >= startTime && currentTime <= endTime;
  }

  // 자정을 넘는 경우 (예: 22:00 ~ 06:00)
  // 22:00 이후이거나 06:00 이전이면 알림 발송
  return currentTime >= startTime || currentTime <= endTime;
}

/**
 * 시간 문자열을 분(minute) 단위 숫자로 변환합니다.
 *
 * @param timeString - "HH:mm" 형식의 시간 문자열
 * @returns 자정부터의 분 (0~1439)
 *
 * @example
 * timeToMinutes("09:00") // → 540 (9 * 60)
 * timeToMinutes("14:30") // → 870 (14 * 60 + 30)
 */
export function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * 두 시간 사이의 차이를 분 단위로 계산합니다.
 *
 * @param time1 - "HH:mm" 형식의 시간 문자열
 * @param time2 - "HH:mm" 형식의 시간 문자열
 * @returns 시간 차이 (분 단위)
 */
export function getTimeDifferenceInMinutes(time1: string, time2: string): number {
  const minutes1 = timeToMinutes(time1);
  const minutes2 = timeToMinutes(time2);
  return Math.abs(minutes1 - minutes2);
}

/**
 * 현재 KST 날짜를 YYYY-MM-DD 형식으로 반환합니다.
 */
export function getCurrentKSTDateString(): string {
  const kst = getCurrentKSTTime();
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
