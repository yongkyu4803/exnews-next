import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from 'react-query';
import dynamic from 'next/dynamic';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { fetchNewsItemById, fetchCategories } from '@/lib/api';
import { NewsItem } from '@/types';

// 동적 임포트
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false }) as any;
const Card = dynamic(() => import('antd/lib/card'), { ssr: false }) as any;
const Form = dynamic(() => import('antd/lib/form'), { ssr: false }) as any;
const Input = dynamic(() => import('antd/lib/input'), { ssr: false }) as any;
const Button = dynamic(() => import('antd/lib/button'), { ssr: false }) as any;
const Select = dynamic(() => import('antd/lib/select'), { ssr: false }) as any;
const DatePicker = dynamic(() => import('antd/lib/date-picker'), { ssr: false }) as any;
const Space = dynamic(() => import('antd/lib/space'), { ssr: false }) as any;
const Spin = dynamic(() => import('antd/lib/spin'), { ssr: false }) as any;
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false }) as any;

// 컴포넌트 서브모듈
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
  const { data: categories, isLoading: isCategoriesLoading } = useQuery('categories', fetchCategories);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      // API 호출 대신 콘솔 출력
      console.log('저장된 데이터:', values);
      
      // 성공 메시지
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((module) => {
          const message = module.default;
          message.success('성공적으로 저장되었습니다.');
        });
      }
      
      router.push('/admin');
    } catch (error) {
      // 에러 메시지
      if (typeof window !== 'undefined') {
        import('antd/lib/message').then((module) => {
          const message = module.default;
          message.error('저장 중 오류가 발생했습니다.');
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin');
  };

  if (isNewsLoading || isCategoriesLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="로딩 중..." />
      </div>
    );
  }

  if (newsError) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="에러 발생"
          description="데이터를 불러오는 중 오류가 발생했습니다."
          type="error"
          showIcon
        />
        <div style={{ marginTop: '20px' }}>
          <Button onClick={() => router.push('/admin')} icon={<ArrowLeftOutlined />}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Button onClick={() => router.push('/admin')} icon={<ArrowLeftOutlined />}>
          목록으로 돌아가기
        </Button>
      </div>

      <Card>
        <Title level={3}>{id ? '뉴스 수정' : '새 뉴스 추가'}</Title>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            title: '',
            original_link: '',
            category: '',
            description: '',
          }}
        >
          <Form.Item
            name="title"
            label="제목"
            rules={[{ required: true, message: '제목을 입력해주세요.' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="original_link"
            label="원본 링크"
            rules={[{ required: true, message: '원본 링크를 입력해주세요.' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="category"
            label="카테고리"
            rules={[{ required: true, message: '카테고리를 선택해주세요.' }]}
          >
            <Select placeholder="카테고리 선택">
              {categories?.map((category: string) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="pub_date" label="발행일">
            <DatePicker showTime />
          </Form.Item>

          <Form.Item name="description" label="내용">
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={isSubmitting}>
                저장
              </Button>
              <Button onClick={handleCancel}>취소</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}