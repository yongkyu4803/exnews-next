import React from 'react';
import dynamic from 'next/dynamic';

// 동적 임포트
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as any;
const Select = dynamic(() => import('antd/lib/select'), { ssr: false }) as any;
const DatePicker = dynamic(() => import('antd/lib/date-picker'), { ssr: false }) as any;

const { RangePicker } = DatePicker;

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
  // Select 컴포넌트용 옵션 배열 생성
  const selectOptions = [
    { value: "", label: "전체" },
    ...categories.map(category => ({ value: category, label: category }))
  ];

  return (
    <Space>
      <Select
        style={{ width: 200 }}
        placeholder="카테고리 선택"
        onChange={onCategoryFilter}
        allowClear
        options={selectOptions}
      />

      <RangePicker
        onChange={(dates: any) => {
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