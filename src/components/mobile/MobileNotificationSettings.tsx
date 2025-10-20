import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import {
  isPushNotificationSupported,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationPreferences,
  saveNotificationPreferences,
  saveNotificationSettingsToServer,
  sendTestNotification
} from '@/utils/pushNotification';

const Container = styled.div`
  max-width: 100%;
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
`;

const Header = styled.div`
  margin-bottom: 24px;
`;

const Title = styled.h2`
  font-size: 24px;
  font-weight: bold;
  color: #1a4b8c;
  margin: 0 0 8px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
`;

const SettingLabel = styled.div`
  flex: 1;
`;

const SettingTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const SettingDescription = styled.div`
  font-size: 13px;
  color: #999;
`;

const Toggle = styled.button<{ active: boolean }>`
  width: 50px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background-color: ${props => props.active ? '#1a4b8c' : '#ddd'};
  position: relative;
  cursor: pointer;
  transition: background-color 0.3s;

  &::after {
    content: '';
    position: absolute;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: white;
    top: 2px;
    left: ${props => props.active ? '24px' : '2px'};
    transition: left 0.3s;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  width: 100%;
  padding: 14px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  ${props => props.variant === 'primary' ? `
    background: #1a4b8c;
    color: white;

    &:active {
      background: #153a6f;
    }
  ` : `
    background: #f0f0f0;
    color: #333;

    &:active {
      background: #e0e0e0;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChipGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const Chip = styled.button<{ selected: boolean }>`
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid ${props => props.selected ? '#1a4b8c' : '#ddd'};
  background: ${props => props.selected ? '#e6f0ff' : 'white'};
  color: ${props => props.selected ? '#1a4b8c' : '#666'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    transform: scale(0.95);
  }
`;

const TimeSlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 12px;
`;

const TimeSlot = styled.button<{ selected: boolean }>`
  padding: 16px;
  border-radius: 10px;
  border: 2px solid ${props => props.selected ? '#1a4b8c' : '#ddd'};
  background: ${props => props.selected ? '#e6f0ff' : 'white'};
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    transform: scale(0.98);
  }
`;

const TimeSlotTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${props => props.color || '#333'};
  margin-bottom: 4px;
`;

const TimeSlotTime = styled.div`
  font-size: 12px;
  color: #999;
`;

const Alert = styled.div<{ type: 'info' | 'warning' | 'success' }>`
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.6;

  ${props => {
    switch (props.type) {
      case 'info':
        return `
          background: #e6f0ff;
          color: #1a4b8c;
          border-left: 4px solid #1a4b8c;
        `;
      case 'warning':
        return `
          background: #fff7e6;
          color: #d46b08;
          border-left: 4px solid #faad14;
        `;
      case 'success':
        return `
          background: #f6ffed;
          color: #52c41a;
          border-left: 4px solid #52c41a;
        `;
    }
  }}
`;

const MobileNotificationSettings: React.FC = () => {
  const [supported, setSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(getNotificationPreferences());
  const [message, setMessage] = useState<{ text: string; type: 'info' | 'warning' | 'success' } | null>(null);

  useEffect(() => {
    // 브라우저 지원 확인
    const checkSupport = async () => {
      const isSupported = isPushNotificationSupported();
      setSupported(isSupported);

      if (isSupported && Notification.permission === 'granted') {
        setPermissionGranted(true);
      }
    };

    checkSupport();
  }, []);

  // 메시지 표시 헬퍼
  const showMessage = (text: string, type: 'info' | 'warning' | 'success' = 'info') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // 알림 권한 요청
  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setPermissionGranted(permission === 'granted');

      if (permission === 'granted') {
        // 권한이 허용되면 구독 활성화
        await handleToggleEnabled(true);
        showMessage('알림이 활성화되었습니다', 'success');
      }
    } catch (error) {
      showMessage('알림 권한 요청 실패', 'warning');
      console.error('알림 권한 요청 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 알림 활성화 토글
  const handleToggleEnabled = async (enabled: boolean) => {
    setLoading(true);
    try {
      if (enabled) {
        // 알림 구독
        const subscription = await subscribeToPush();
        if (subscription) {
          const updated = { ...preferences, enabled: true };
          setPreferences(updated);
          saveNotificationPreferences(updated);
          await saveNotificationSettingsToServer(updated);
          showMessage('알림이 활성화되었습니다', 'success');
        }
      } else {
        // 알림 구독 취소
        const result = await unsubscribeFromPush();
        if (result) {
          const updated = { ...preferences, enabled: false };
          setPreferences(updated);
          saveNotificationPreferences(updated);
          await saveNotificationSettingsToServer(updated);
          showMessage('알림이 비활성화되었습니다', 'info');
        }
      }
    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
      showMessage('알림 설정 변경에 실패했습니다', 'warning');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 변경
  const handleCategoryChange = async (category: string) => {
    const isEnabled = !preferences.categories[category];
    const updated = {
      ...preferences,
      categories: {
        ...preferences.categories,
        [category]: isEnabled
      }
    };

    setPreferences(updated);
    saveNotificationPreferences(updated);
    await saveNotificationSettingsToServer(updated);
  };

  // 스케줄 변경
  const handleScheduleChange = async (time: 'morning' | 'afternoon' | 'evening') => {
    const isEnabled = !preferences.schedule[time];
    const updated = {
      ...preferences,
      schedule: {
        ...preferences.schedule,
        [time]: isEnabled
      }
    };

    setPreferences(updated);
    saveNotificationPreferences(updated);
    await saveNotificationSettingsToServer(updated);
  };

  // 테스트 알림
  const handleTestNotification = async () => {
    setLoading(true);
    try {
      const result = await sendTestNotification();
      if (result) {
        showMessage('테스트 알림이 전송되었습니다', 'success');
      } else {
        showMessage('테스트 알림 전송에 실패했습니다', 'warning');
      }
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
      showMessage('테스트 알림 전송에 실패했습니다', 'warning');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <Container>
        <Alert type="warning">
          이 브라우저는 웹 푸시 알림을 지원하지 않습니다. 최신 버전의 Chrome, Firefox, Edge 또는 Safari 브라우저를 사용해주세요.
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>알림 설정</Title>
        <Subtitle>
          중요한 뉴스가 발행되면 알림을 받아보세요. 관심 있는 카테고리만 선택하여 맞춤형 알림을 설정할 수 있습니다.
        </Subtitle>
      </Header>

      {message && (
        <Alert type={message.type}>
          {message.text}
        </Alert>
      )}

      <Card>
        <SettingItem>
          <SettingLabel>
            <SettingTitle>알림 받기</SettingTitle>
            <SettingDescription>새로운 뉴스 알림 수신</SettingDescription>
          </SettingLabel>
          {permissionGranted ? (
            <Toggle
              active={preferences.enabled}
              onClick={() => handleToggleEnabled(!preferences.enabled)}
              disabled={loading}
            />
          ) : (
            <Button
              variant="primary"
              onClick={handleRequestPermission}
              disabled={loading}
              style={{ width: 'auto', padding: '8px 16px' }}
            >
              허용
            </Button>
          )}
        </SettingItem>

        {!permissionGranted && (
          <Alert type="info">
            알림을 받으려면 브라우저에서 알림 권한을 허용해야 합니다.
          </Alert>
        )}
      </Card>

      {preferences.enabled && permissionGranted && (
        <>
          <Card>
            <SettingTitle style={{ marginBottom: 12 }}>관심 카테고리</SettingTitle>
            <SettingDescription>관심 있는 뉴스 카테고리를 선택하세요</SettingDescription>

            <ChipGroup>
              {Object.entries(preferences.categories).map(([category, enabled]) => (
                <Chip
                  key={category}
                  selected={enabled}
                  onClick={() => handleCategoryChange(category)}
                  disabled={loading}
                >
                  {category === 'all' ? '전체' : category}
                </Chip>
              ))}
            </ChipGroup>
          </Card>

          <Card>
            <SettingTitle style={{ marginBottom: 12 }}>알림 시간</SettingTitle>
            <SettingDescription>알림을 받을 시간대를 선택하세요</SettingDescription>

            <TimeSlotGrid>
              <TimeSlot
                selected={preferences.schedule.morning}
                onClick={() => handleScheduleChange('morning')}
                disabled={loading}
              >
                <TimeSlotTitle color={preferences.schedule.morning ? '#1a4b8c' : undefined}>
                  아침
                </TimeSlotTitle>
                <TimeSlotTime>7AM - 9AM</TimeSlotTime>
              </TimeSlot>

              <TimeSlot
                selected={preferences.schedule.afternoon}
                onClick={() => handleScheduleChange('afternoon')}
                disabled={loading}
              >
                <TimeSlotTitle color={preferences.schedule.afternoon ? '#1a4b8c' : undefined}>
                  오후
                </TimeSlotTitle>
                <TimeSlotTime>12PM - 2PM</TimeSlotTime>
              </TimeSlot>

              <TimeSlot
                selected={preferences.schedule.evening}
                onClick={() => handleScheduleChange('evening')}
                disabled={loading}
              >
                <TimeSlotTitle color={preferences.schedule.evening ? '#1a4b8c' : undefined}>
                  저녁
                </TimeSlotTitle>
                <TimeSlotTime>6PM - 8PM</TimeSlotTime>
              </TimeSlot>
            </TimeSlotGrid>
          </Card>

          <Card>
            <Button
              variant="secondary"
              onClick={handleTestNotification}
              disabled={loading}
            >
              테스트 알림 보내기
            </Button>
          </Card>
        </>
      )}
    </Container>
  );
};

export default MobileNotificationSettings;
