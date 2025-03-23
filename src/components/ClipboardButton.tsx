import React, { useState } from 'react';
import { Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { NewsItem } from '@/types';

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
      message.success('클립보드에 복사되었습니다.');
    } catch (err) {
      message.error('복사에 실패했습니다.');
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