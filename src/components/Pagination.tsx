import React from 'react';
import { Pagination as AntPagination } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentPage } from '@/store/slices/uiSlice';
import { RootState } from '@/store';

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