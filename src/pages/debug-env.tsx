import React, { useEffect, useState } from 'react';

export default function DebugEnv() {
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
  const [browserInfo, setBrowserInfo] = useState({
    serviceWorker: false,
    pushManager: false,
    notification: false,
    permission: 'N/A'
  });

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    setBrowserInfo({
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notification: 'Notification' in window,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'N/A'
    });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Debug</h1>
      <div style={{ background: '#f0f0f0', padding: '10px', marginTop: '20px' }}>
        <p><strong>VAPID Key Status:</strong></p>
        <p>Exists: {vapidKey ? 'YES ✅' : 'NO ❌'}</p>
        {vapidKey && (
          <>
            <p>Length: {vapidKey.length} characters</p>
            <p>First 20 chars: {vapidKey.substring(0, 20)}...</p>
          </>
        )}
      </div>

      <div style={{ background: '#f0f0f0', padding: '10px', marginTop: '20px' }}>
        <p><strong>Browser Support:</strong></p>
        <p>serviceWorker: {browserInfo.serviceWorker ? 'YES ✅' : 'NO ❌'}</p>
        <p>PushManager: {browserInfo.pushManager ? 'YES ✅' : 'NO ❌'}</p>
        <p>Notification: {browserInfo.notification ? 'YES ✅' : 'NO ❌'}</p>
        <p>Notification.permission: {browserInfo.permission}</p>
      </div>
    </div>
  );
}
