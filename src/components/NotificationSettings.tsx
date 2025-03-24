import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { 
  isPushNotificationSupported,
  requestNotificationPermission, 
  subscribeToPush,
  unsubscribeFromPush,
  subscribeToPushByCategory,
  unsubscribeFromPushByCategory,
  getNotificationPreferences,
  saveNotificationPreferences,
  sendTestNotification
} from '@/utils/pushNotification';
import { Categories } from '@/types';

// 동적 임포트
const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as any;
const Switch = dynamic(() => import('antd/lib/switch'), { ssr: false }) as any;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as any;
const Divider = dynamic(() => import('antd/lib/divider'), { ssr: false }) as any;
const Checkbox = dynamic(() => import('antd/lib/checkbox'), { ssr: false }) as any;
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false }) as any;
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as any;
const Tag = dynamic(() => import('antd/lib/tag'), { ssr: false }) as any;

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

const CategoryList = styled.div`
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ScheduleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 16px;
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ScheduleItem = styled.div`
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const NotificationCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const NotificationSettings: React.FC = () => {
  const [supported, setSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState(getNotificationPreferences());
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  
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
  
  // 알림 권한 요청
  const handleRequestPermission = async () => {
    setLoading(true);
    try {
      const permission = await requestNotificationPermission();
      setPermissionGranted(permission === 'granted');
      
      if (permission === 'granted') {
        // 권한이 허용되면 구독 활성화
        await handleToggleEnabled(true);
      }
    } catch (error) {
      // @ts-ignore
      message.error('알림 권한 요청 실패');
      console.error('알림 권한 요청 실패:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 알림 활성화 변경
  const handleToggleEnabled = async (enabled: boolean) => {
    setLoading(true);
    try {
      if (enabled) {
        // 알림 구독
        const subscription = await subscribeToPush();
        if (subscription) {
          setPreferences(prev => {
            const updated = { ...prev, enabled: true };
            saveNotificationPreferences(updated);
            return updated;
          });
          // @ts-ignore
          message.success('알림이 활성화되었습니다');
        } else {
          return;
        }
      } else {
        // 알림 구독 취소
        const result = await unsubscribeFromPush();
        if (result) {
          setPreferences(prev => {
            const updated = { ...prev, enabled: false };
            saveNotificationPreferences(updated);
            return updated;
          });
          // @ts-ignore
          message.info('알림이 비활성화되었습니다');
        }
      }
    } catch (error) {
      console.error('알림 설정 변경 실패:', error);
      // @ts-ignore
      message.error('알림 설정 변경에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };
  
  // 카테고리 알림 변경
  const handleCategoryChange = async (category: string, checked: boolean) => {
    try {
      if (checked) {
        await subscribeToPushByCategory(category);
      } else {
        await unsubscribeFromPushByCategory(category);
      }
      
      setPreferences(prev => {
        const updated = {
          ...prev,
          categories: {
            ...prev.categories,
            [category]: checked
          }
        };
        saveNotificationPreferences(updated);
        return updated;
      });
    } catch (error) {
      console.error('카테고리 설정 변경 실패:', error);
      // @ts-ignore
      message.error('카테고리 설정 변경에 실패했습니다');
    }
  };
  
  // 스케줄 설정 변경
  const handleScheduleChange = (time: 'morning' | 'afternoon' | 'evening', checked: boolean) => {
    setPreferences(prev => {
      const updated = {
        ...prev,
        schedule: {
          ...prev.schedule,
          [time]: checked
        }
      };
      saveNotificationPreferences(updated);
      return updated;
    });
  };
  
  // 테스트 알림 전송
  const handleSendTest = async () => {
    setLoading(true);
    try {
      const result = await sendTestNotification();
      if (result) {
        // @ts-ignore
        message.success('테스트 알림이 전송되었습니다');
      } else {
        // @ts-ignore
        message.error('테스트 알림 전송에 실패했습니다');
      }
    } catch (error) {
      console.error('테스트 알림 전송 실패:', error);
      // @ts-ignore
      message.error('테스트 알림 전송에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };
  
  if (!supported) {
    return (
      <SettingsContainer>
        <Alert
          type="warning"
          message="알림 지원되지 않음"
          description="이 브라우저는 웹 푸시 알림을 지원하지 않습니다. 최신 버전의 Chrome, Firefox, Edge 또는 Safari 브라우저를 사용해주세요."
          showIcon
        />
      </SettingsContainer>
    );
  }
  
  return (
    <SettingsContainer>
      <Title level={2}>알림 설정</Title>
      <Paragraph>
        중요한 뉴스가 발행되면 알림을 받아보세요. 관심 있는 카테고리만 선택하여 맞춤형 알림을 설정할 수 있습니다.
      </Paragraph>
      
      <NotificationCard>
        <SettingItem>
          <Text strong>알림 활성화</Text>
          {permissionGranted ? (
            <Switch
              checked={preferences.enabled}
              onChange={handleToggleEnabled}
              loading={loading}
              disabled={loading}
            />
          ) : (
            <Button 
              type="primary" 
              onClick={handleRequestPermission}
              loading={loading}
              disabled={loading}
            >
              알림 허용
            </Button>
          )}
        </SettingItem>
        
        {!permissionGranted && (
          <Alert
            type="info"
            message="알림 권한 필요"
            description="알림을 받으려면 브라우저에서 알림 권한을 허용해야 합니다."
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
        
        {preferences.enabled && permissionGranted && (
          <>
            <Divider>카테고리 설정</Divider>
            <Text>관심 있는 뉴스 카테고리를 선택하세요:</Text>
            
            <CategoryList>
              {Object.entries(preferences.categories).map(([category, enabled]) => (
                <Checkbox
                  key={category}
                  checked={enabled}
                  onChange={e => handleCategoryChange(category, e.target.checked)}
                  disabled={loading}
                >
                  {category === 'all' ? '전체 카테고리' : category}
                </Checkbox>
              ))}
            </CategoryList>
            
            <Divider>알림 시간</Divider>
            <Text>알림을 받을 시간대를 선택하세요:</Text>
            
            <ScheduleGrid>
              <ScheduleItem>
                <Text strong>아침</Text>
                <Text type="secondary">7AM - 9AM</Text>
                <Checkbox
                  checked={preferences.schedule.morning}
                  onChange={e => handleScheduleChange('morning', e.target.checked)}
                  style={{ marginTop: 10 }}
                />
              </ScheduleItem>
              
              <ScheduleItem>
                <Text strong>오후</Text>
                <Text type="secondary">12PM - 2PM</Text>
                <Checkbox
                  checked={preferences.schedule.afternoon}
                  onChange={e => handleScheduleChange('afternoon', e.target.checked)}
                  style={{ marginTop: 10 }}
                />
              </ScheduleItem>
              
              <ScheduleItem>
                <Text strong>저녁</Text>
                <Text type="secondary">6PM - 8PM</Text>
                <Checkbox
                  checked={preferences.schedule.evening}
                  onChange={e => handleScheduleChange('evening', e.target.checked)}
                  style={{ marginTop: 10 }}
                />
              </ScheduleItem>
            </ScheduleGrid>
            
            <Divider />
            
            <Button 
              onClick={handleSendTest}
              loading={loading}
              disabled={loading}
              style={{ marginRight: 10 }}
            >
              테스트 알림 보내기
            </Button>
          </>
        )}
      </NotificationCard>
    </SettingsContainer>
  );
};

export default NotificationSettings; 