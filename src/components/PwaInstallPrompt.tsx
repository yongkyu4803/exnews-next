import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';

// 동적 임포트 
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false }) as any;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;
const Modal = dynamic(() => import('antd/lib/modal'), { ssr: false }) as any;

const InstallPromptWrapper = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
`;

const InstallInstructions = styled.div`
  margin-top: 16px;
  
  h4 {
    margin-top: 16px;
    margin-bottom: 8px;
  }
  
  ol {
    padding-left: 20px;
  }
  
  img {
    max-width: 100%;
    margin: 12px 0;
    border: 1px solid #eee;
    border-radius: 4px;
  }
`;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// iOS Safari 대응을 위한 Navigator 타입 확장
interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;
    
    // iOS 여부 확인
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
    
    // PWA가 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as NavigatorWithStandalone).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // 설치 프롬프트 저장
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 이미 방문한 적이 있는지 확인
    const hasVisited = localStorage.getItem('pwa_prompt_shown');
    // 처음 방문했거나 마지막 방문이 7일 이전인지 확인
    const shouldShowPrompt = !hasVisited || 
      (Date.now() - parseInt(hasVisited, 10) > 7 * 24 * 60 * 60 * 1000);
      
    if (shouldShowPrompt) {
      setIsVisible(true);
      localStorage.setItem('pwa_prompt_shown', Date.now().toString());
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowInstructions(true);
      return;
    }
    
    if (!installPrompt) return;

    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      setIsVisible(false);
    }
    
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (isInstalled || !isVisible) {
    return null;
  }

  return (
    <>
      <InstallPromptWrapper>
        <Alert
          message="앱 설치하기"
          description="홈 화면에 추가하고 오프라인에서도 사용해보세요."
          type="info"
          showIcon
          action={
            <Button 
              size="small" 
              type="primary"
              onClick={handleInstallClick}
            >
              설치 안내
            </Button>
          }
          closable
          onClose={handleDismiss}
        />
      </InstallPromptWrapper>
      
      {/* iOS용 설치 안내 모달 */}
      <Modal
        title="앱 설치 방법"
        open={showInstructions}
        onCancel={() => setShowInstructions(false)}
        footer={[
          <Button key="close" onClick={() => setShowInstructions(false)}>
            확인
          </Button>
        ]}
      >
        <InstallInstructions>
          {isIOS ? (
            <>
              <p>Safari 브라우저에서 다음 단계를 따라 홈 화면에 앱을 추가하세요:</p>
              <ol>
                <li>하단 메뉴바에서 <strong>공유 버튼</strong> 탭하기</li>
                <li><strong>"홈 화면에 추가"</strong> 선택하기</li>
                <li><strong>"추가"</strong> 버튼 탭하기</li>
              </ol>
            </>
          ) : (
            <>
              <p>브라우저 메뉴에서 다음 단계를 따라 홈 화면에 앱을 추가하세요:</p>
              <ol>
                <li>주소창 오른쪽의 <strong>메뉴 버튼</strong> 탭하기</li>
                <li><strong>"앱 설치"</strong> 또는 <strong>"홈 화면에 추가"</strong> 선택하기</li>
                <li><strong>"설치"</strong> 버튼 탭하기</li>
              </ol>
            </>
          )}
        </InstallInstructions>
      </Modal>
    </>
  );
} 