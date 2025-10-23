import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import {
  isPushNotificationSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getNotificationPreferences,
  saveNotificationPreferences,
  saveNotificationSettingsToServer,
  sendTestNotification
} from '@/utils/pushNotification';

// 동적 임포트
const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as any;
const Switch = dynamic(() => import('antd/lib/switch'), { ssr: false }) as any;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as any;
const Divider = dynamic(() => import('antd/lib/divider'), { ssr: false }) as any;
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false }) as any;
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as any;
const Tag = dynamic(() => import('antd/lib/tag'), { ssr: false }) as any;
const Input = dynamic(() => import('antd/lib/input'), { ssr: false }) as any;
const TimePicker = dynamic(() => import('antd/lib/time-picker'), { ssr: false }) as any;

const { Title, Text, Paragraph } = Typography;

const SettingsContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const KeywordContainer = styled.div`
  margin-top: 16px;
`;

const KeywordList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  margin-bottom: 12px;
`;

const NotificationCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const TimePickerContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 12px;
`;

const NotificationSettings: React.FC = () => {
  const [supported, setSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(getNotificationPreferences());
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

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

  // 알림 활성화 변경
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
        }
      } else {
        // 알림 구독 취소
        const result = await unsubscribeFromPush();
        if (result) {
          const updated = { ...preferences, enabled: false };
          setPreferences(updated);
          saveNotificationPreferences(updated);
        }
      }
    } catch (error) {
      console.error('[Settings] 알림 설정 변경 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 키워드 추가
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;

    if (preferences.keywords.includes(newKeyword.trim())) {
      alert('이미 추가된 키워드입니다.');
      return;
    }

    const updated = {
      ...preferences,
      keywords: [...preferences.keywords, newKeyword.trim()]
    };
    setPreferences(updated);
    saveNotificationPreferences(updated);
    saveNotificationSettingsToServer(updated);
    setNewKeyword('');
  };

  // 키워드 제거
  const handleRemoveKeyword = (keyword: string) => {
    const updated = {
      ...preferences,
      keywords: preferences.keywords.filter(k => k !== keyword)
    };
    setPreferences(updated);
    saveNotificationPreferences(updated);
    saveNotificationSettingsToServer(updated);
  };

  // 시간 제한 활성화 변경
  const handleToggleSchedule = (enabled: boolean) => {
    const updated = {
      ...preferences,
      schedule: { ...preferences.schedule, enabled }
    };
    setPreferences(updated);
    saveNotificationPreferences(updated);
    saveNotificationSettingsToServer(updated);
  };

  // 시간 변경
  const handleTimeChange = (type: 'startTime' | 'endTime', value: string) => {
    const updated = {
      ...preferences,
      schedule: { ...preferences.schedule, [type]: value }
    };
    setPreferences(updated);
    saveNotificationPreferences(updated);
    saveNotificationSettingsToServer(updated);
  };

  // 테스트 알림
  const handleTestNotification = async () => {
    setIsTestingNotification(true);
    try {
      const result = await sendTestNotification();
      if (result) {
        alert('테스트 알림이 전송되었습니다!');
      } else {
        alert('알림 권한이 없거나 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('[Settings] 테스트 알림 전송 실패:', error);
      alert('테스트 알림 전송에 실패했습니다.');
    } finally {
      setIsTestingNotification(false);
    }
  };

  if (!supported) {
    return (
      <SettingsContainer>
        <Alert
          message="알림 기능 미지원"
          description="이 브라우저는 푸시 알림을 지원하지 않습니다."
          type="warning"
          showIcon
        />
      </SettingsContainer>
    );
  }

  return (
    <SettingsContainer>
      <Title level={2}>푸시 알림 설정</Title>

      {/* 기본 설정 */}
      <NotificationCard title="기본 설정">
        <SettingItem>
          <div>
            <Text strong>푸시 알림 활성화</Text>
            <br />
            <Text type="secondary">새로운 뉴스가 등록되면 알림을 받습니다</Text>
          </div>
          <Switch
            checked={preferences.enabled && permissionGranted}
            onChange={handleToggleEnabled}
            loading={loading}
          />
        </SettingItem>

        {preferences.enabled && (
          <>
            <Divider />
            <Space>
              <Button
                onClick={handleTestNotification}
                loading={isTestingNotification}
              >
                테스트 알림 보내기
              </Button>
            </Space>
          </>
        )}
      </NotificationCard>

      {/* 키워드 설정 */}
      {preferences.enabled && (
        <NotificationCard title="키워드 알림">
          <Paragraph type="secondary">
            관심 키워드를 추가하면 해당 키워드가 포함된 뉴스만 알림을 받습니다.
            키워드를 추가하지 않으면 모든 뉴스에 대해 알림을 받습니다.
          </Paragraph>

          <KeywordContainer>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="키워드 입력 (예: 검찰, 대통령)"
                value={newKeyword}
                onChange={(e: any) => setNewKeyword(e.target.value)}
                onPressEnter={handleAddKeyword}
              />
              <Button type="primary" onClick={handleAddKeyword}>
                추가
              </Button>
            </Space.Compact>

            {preferences.keywords.length > 0 && (
              <KeywordList>
                {preferences.keywords.map((keyword) => (
                  <Tag
                    key={keyword}
                    closable
                    onClose={() => handleRemoveKeyword(keyword)}
                    color="blue"
                  >
                    {keyword}
                  </Tag>
                ))}
              </KeywordList>
            )}

            {preferences.keywords.length === 0 && (
              <Alert
                message="모든 뉴스 알림"
                description="키워드가 없으면 모든 새 뉴스에 대해 알림을 받습니다."
                type="info"
                showIcon
                style={{ marginTop: 12 }}
              />
            )}
          </KeywordContainer>
        </NotificationCard>
      )}

      {/* 시간대 설정 */}
      {preferences.enabled && (
        <NotificationCard title="알림 시간 설정">
          <SettingItem>
            <div>
              <Text strong>시간 제한 활성화</Text>
              <br />
              <Text type="secondary">특정 시간대에만 알림을 받습니다</Text>
            </div>
            <Switch
              checked={preferences.schedule.enabled}
              onChange={handleToggleSchedule}
            />
          </SettingItem>

          {preferences.schedule.enabled && (
            <TimePickerContainer>
              <div>
                <Text>시작 시간</Text>
                <Input
                  type="time"
                  value={preferences.schedule.startTime}
                  onChange={(e: any) => handleTimeChange('startTime', e.target.value)}
                  style={{ marginTop: 8, width: 150 }}
                />
              </div>
              <Text>~</Text>
              <div>
                <Text>종료 시간</Text>
                <Input
                  type="time"
                  value={preferences.schedule.endTime}
                  onChange={(e: any) => handleTimeChange('endTime', e.target.value)}
                  style={{ marginTop: 8, width: 150 }}
                />
              </div>
            </TimePickerContainer>
          )}
        </NotificationCard>
      )}

      {/* 안내 메시지 */}
      {!permissionGranted && (
        <Alert
          message="알림 권한이 필요합니다"
          description="푸시 알림을 받으려면 브라우저 권한이 필요합니다. 위의 '푸시 알림 활성화'를 켜주세요."
          type="info"
          showIcon
        />
      )}
    </SettingsContainer>
  );
};

export default NotificationSettings;
