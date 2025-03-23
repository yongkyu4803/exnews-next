import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import dynamic from 'next/dynamic';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { fetchNewsItemById, fetchCategories } from '@/lib/api';
import { NewsItem } from '@/types';
import { message, Typography, Card, Form, Input, Button, Select, DatePicker, Space, Spin, Alert } from 'antd';

// No need for dynamic imports if we're directly importing
const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function AdminDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 뉴스 아이템 상세 정보 가져오기
  const { data: newsItem, isLoading: isNewsLoading, error: newsError } = useQuery(
    ['newsItem', id],
    () => fetchNewsItemById(id as string),
    {
      enabled: !!id,
      onSuccess: (data) => {
        // 폼 초기값 설정
        form.setFieldsValue({
          ...data,
          pub_date: data.pub_date ? new Date(data.pub_date) : null,
        });
      },
    }
  );

  // 카테고리 목록 가져오기
  const { data: categories = [], isLoading: isCategoriesLoading, error: categoriesError } = 
    useQuery('categories', fetchCategories);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // 여기에 데이터 업데이트 로직 추가 (향후 구현)
      const updatedItem = {
        ...values,
        pub_date: values.pub_date ? values.pub_date.format('YYYY-MM-DD') : null,
      };
      
      console.log('Updated item:', updatedItem);
      message.success('데이터가 성공적으로 업데이트되었습니다.');
      
      // 관리자 목록 페이지로 이동
      router.push('/admin');
    } catch (error) {
      console.error('Update error:', error);
      message.error('데이터 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  const isLoading = isNewsLoading || isCategoriesLoading;
  const error = newsError || categoriesError;

  return (
    <div className="admin-detail-container" style={{ padding: '20px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.push('/admin')}
        >
          목록으로 돌아가기
        </Button>

        <Title level={2}>뉴스 아이템 상세</Title>

        {error ? (
          <Alert 
            message={error instanceof Error ? error.name : "데이터 로딩 오류"}
            description={error instanceof Error ? error.message : String(error)}
            type="error" 
            showIcon 
          />
        ) : null}

        <Spin spinning={isLoading}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={newsItem}
            >
              <Form.Item
                name="title"
                label="제목"
                rules={[{ required: true, message: '제목을 입력해주세요' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="original_link"
                label="원본 링크"
                rules={[{ required: true, message: '원본 링크를 입력해주세요' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                name="category"
                label="카테고리"
                rules={[{ required: true, message: '카테고리를 선택해주세요' }]}
              >
                <Select placeholder="카테고리 선택">
                  {categories.map((category) => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="pub_date"
                label="발행일"
                rules={[{ required: true, message: '발행일을 선택해주세요' }]}
              >
                <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="description"
                label="설명"
              >
                <TextArea rows={4} />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" loading={isSubmitting}>
                    저장
                  </Button>
                  <Button onClick={handleCancel}>
                    취소
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Spin>
      </Space>
    </div>
  );
}