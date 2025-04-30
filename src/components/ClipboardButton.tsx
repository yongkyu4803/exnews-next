import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CopyOutlined } from '@ant-design/icons';
import { NewsItem } from '@/types';

// 동적 임포트
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;

interface ClipboardButtonProps {
  item: NewsItem;
}

const ClipboardButton: React.FC<ClipboardButtonProps> = ({ item }) => {
  const [copying, setCopying] = useState(false);

  const handleCopy = async () => {
    setCopying(true);
    
    const textToCopy = `${item.title}\n${item.original_link}\n${new Date(item.pub_date).toLocaleDateString('ko-KR')}`;
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      
      // 동적으로 message 모듈 불러오기
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((messageModule) => {
          (messageModule.default as any).success('클립보드에 복사되었습니다.');
        });
      }
    } catch (err) {
      // 동적으로 message 모듈 불러오기
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((messageModule) => {
          (messageModule.default as any).error('복사에 실패했습니다.');
        });
      }
      console.error('복사 실패:', err);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Button 
      icon={<CopyOutlined />} 
      onClick={handleCopy} 
      loading={copying}
    >
      복사
    </Button>
  );
};

export default ClipboardButton;