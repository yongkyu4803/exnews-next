import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { SearchOutlined } from '@ant-design/icons';

// 동적 임포트
const Input = dynamic(() => import('antd/lib/input'), { ssr: false }) as any;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as any;
const Form = dynamic(() => import('antd/lib/form'), { ssr: false }) as any;

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    onSearch(searchTerm.trim());
  };

  const handleReset = () => {
    setSearchTerm('');
    onSearch('');
  };

  return (
    <Space className="search-form">
      <Form layout="inline" 
        style={{ display: 'flex', alignItems: 'center' }}
        onFinish={handleSearch}
      >
        <Form.Item>
          <Input
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSearch}>
            검색
          </Button>
        </Form.Item>
        <Form.Item>
          <Button onClick={handleReset}>초기화</Button>
        </Form.Item>
      </Form>
    </Space>
  );
};

export default SearchBar;