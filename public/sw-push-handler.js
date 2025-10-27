/**
 * 커스텀 푸시 알림 핸들러
 *
 * 이 파일은 Service Worker에서 push 이벤트를 처리하여
 * "백그라운드에서 실행" 같은 기본 시스템 메시지 대신
 * 실제 알림 내용만 표시하도록 합니다.
 */

// Push 이벤트 리스너
self.addEventListener('push', function(event) {
  console.log('[SW] Push event received:', event);

  // 데이터가 없으면 무시
  if (!event.data) {
    console.log('[SW] Push event has no data, ignoring');
    return;
  }

  try {
    // 푸시 데이터 파싱
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    // 데이터 검증: 필수 필드 확인
    if (!data.title || !data.body) {
      console.error('[SW] Invalid push data: missing title or body', data);
      return;
    }

    // "백그라운드" 키워드가 포함된 알림 차단
    if (
      data.title.toLowerCase().includes('백그라운드') ||
      data.body.toLowerCase().includes('백그라운드') ||
      data.title.toLowerCase().includes('background') ||
      data.body.toLowerCase().includes('background')
    ) {
      console.log('[SW] Blocking background system notification');
      return;
    }

    // 알림 옵션 구성
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: data.badge || '/icons/badge-72x72.png',
      tag: data.tag || 'news-notification',
      requireInteraction: data.requireInteraction || false,
      data: {
        url: data.url || data.data?.url || '/',
        ...data.data
      },
      actions: data.actions || [
        {
          action: 'open',
          title: '보기'
        },
        {
          action: 'close',
          title: '닫기'
        }
      ],
      // 진동 패턴 (모바일)
      vibrate: [200, 100, 200],
      // 사운드
      silent: false
    };

    console.log('[SW] Showing notification:', data.title, options);

    // 알림 표시
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  } catch (error) {
    console.error('[SW] Error processing push event:', error);
  }
});

// Notification click 이벤트 리스너
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.notification.tag);

  event.notification.close();

  // action 처리
  if (event.action === 'close') {
    // 닫기 버튼 - 아무것도 안 함
    console.log('[SW] Notification closed by user');
    return;
  }

  // 'open' action 또는 알림 본문 클릭
  const urlToOpen = event.notification.data?.url || '/';

  console.log('[SW] Opening URL:', urlToOpen);

  // 기존 창이 있으면 포커스, 없으면 새 창 열기
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // 같은 URL을 가진 창이 이미 열려있는지 확인
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // 같은 도메인의 창이 있으면 해당 창에서 URL 이동
        if (clientList.length > 0) {
          const client = clientList[0];
          if ('navigate' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }

        // 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close 이벤트 리스너
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] Notification closed:', event.notification.tag);
});

console.log('[SW] Push handler loaded');
