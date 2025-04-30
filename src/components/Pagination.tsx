import React from 'react';
import dynamic from 'next/dynamic';
import styled from '@emotion/styled';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { RootState } from '@/store';

// 동적 임포트
const AntPagination = dynamic(() => import('antd/lib/pagination'), { ssr: false }) as any;

const Pagination: React.FC = () => {
  const dispatch = useDispatch();
  const { currentPage, pageSize } = useSelector((state: RootState) => state.ui);
  const { totalCount } = useSelector((state: RootState) => state.data);

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pagination-container">
      <AntPagination
        current={currentPage}
        total={totalCount}
        pageSize={pageSize}
        onChange={handlePageChange}
        showSizeChanger={false}
        showQuickJumper
      />
    </div>
  );
};

export default Pagination;