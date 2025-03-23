import React, { useState } from 'react';
import { Input, Button, Space, Form } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

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
    <Form layout="inline" className="search-form">
      <Space>
        <Form.Item>
          <Input
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
      </Space>
    </Form>
  );
};

export default SearchBar;