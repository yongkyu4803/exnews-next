import React from 'react';
import { Space, Select, DatePicker } from 'antd';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface FiltersProps {
  categories: string[];
  onCategoryFilter: (category: string) => void;
  onDateFilter: (dates: [Date | null, Date | null]) => void;
}

const Filters: React.FC<FiltersProps> = ({
  categories,
  onCategoryFilter,
  onDateFilter,
}) => {
  return (
    <Space>
      <Select
        style={{ width: 200 }}
        placeholder="카테고리 선택"
        onChange={onCategoryFilter}
        allowClear
      >
        <Option value="">전체</Option>
        {categories.map((category) => (
          <Option key={category} value={category}>
            {category}
          </Option>
        ))}
      </Select>

      <RangePicker
        onChange={(dates) => {
          onDateFilter(
            dates
              ? [dates[0]?.toDate() || null, dates[1]?.toDate() || null]
              : [null, null]
          );
        }}
      />
    </Space>
  );
};

export default Filters;