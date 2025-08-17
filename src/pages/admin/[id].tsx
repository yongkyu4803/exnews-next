import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useQuery } from 'react-query';

import { ArrowLeftOutlined } from '@ant-design/icons';
import { fetchNewsItemById, fetchCategories } from '@/lib/api';
import { NewsItem } from '@/types';

// 동적 임포트
const Typography = dynamic(() => import('antd/lib/typography'), { ssr: false });
const Card = dynamic(() => import('antd/lib/card'), { ssr: false });
const Form = dynamic(() => import('antd/lib/form'), { ssr: false });
const Input = dynamic(() => import('antd/lib/input'), { ssr: false });
const Button = dynamic(() => import('antd/lib/button'), { ssr: false });
const Select = dynamic(() => import('antd/lib/select'), { ssr: false });
const DatePicker = dynamic(() => import('antd/lib/date-picker'), { ssr: false });
const Space = dynamic(() => import('antd/lib/space'), { ssr: false });
const Spin = dynamic(() => import('antd/lib/spin'), { ssr: false });
const Alert = dynamic(() => import('antd/lib/alert'), { ssr: false });
const FormItem = dynamic(() => import('antd/lib/form').then(mod => mod.default.Item), { ssr: false });

// 컴포넌트 서브모듈
// const { Title, Text, Paragraph } = Typography; // Moved inside component
const Option = dynamic(() => import('antd/lib/select').then(mod => mod.default.Option), { ssr: false });
const TextArea = dynamic(() => import('antd/lib/input').then(mod => mod.default.TextArea), { ssr: false });

// AdminDetailPage 컴포넌트
interface FormItemsProps {
  formInstance: any;
  categories: string[] | undefined;
  Input: any;
  Select: any;
  DatePicker: any;
  TextArea: any;
  FormItem: any;
}

const FormItems: React.FC<FormItemsProps> = ({ formInstance, categories, Input, Select, DatePicker, TextArea, FormItem }) => {
  if (!formInstance) return null;

  return (
    <>
      <FormItem
        name="title"
        label="제목"
        rules={[{ required: true, message: '제목을 입력해주세요.' }]}
      >
        <Input />
      </FormItem>

      <FormItem
        name="original_link"
        label="원본 링크"
        rules={[{ required: true, message: '원본 링크를 입력해주세요.' }]}
      >
        <Input />
      </FormItem>

      <FormItem
        name="category"
        label="카테고리"
        rules={[{ required: true, message: '카테고리를 선택해주세요.' }]}
      >
        <Select 
          placeholder="카테고리 선택"
          options={categories?.map((category: string) => ({
            value: category,
            label: category
          }))}
        />
      </FormItem>

      <FormItem name="pub_date" label="발행일">
        <DatePicker showTime />
      </FormItem>

      <FormItem name="description" label="내용">
        <TextArea rows={6} />
      </FormItem>

      <FormItem />
    </>
  );
};

function AdminDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  // 클라이언트 사이드에서만 실행
  const [formInstance, setFormInstance] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 컴포넌트 서브모듈
  const Title = dynamic(() => import('antd/lib/typography').then(mod => mod.default.Title), { ssr: false });
  const Text = dynamic(() => import('antd/lib/typography').then(mod => mod.default.Text), { ssr: false });
  const Paragraph = dynamic(() => import('antd/lib/typography').then(mod => mod.default.Paragraph), { ssr: false });

  useEffect(() => {
    // Ensure Form is available before calling useForm
    if (typeof window !== 'undefined') {
      setIsMounted(true);
      import('antd/lib/form').then(mod => {
        const AntdForm = mod.default;
        setFormInstance(AntdForm.useForm()[0]);
      });
    }
  }, []);

  // 뉴스 아이템 상세 정보 가져오기
  const { data: newsItem, isLoading: isNewsLoading, error: newsError } = useQuery(
    ['newsItem', id],
    () => fetchNewsItemById(id as string),
    {
      enabled: router.isReady && !!id && isMounted,
      onSuccess: (data) => {
        // 폼 초기값 설정 (formInstance가 존재할 때만)
        if (formInstance) {
          formInstance.setFieldsValue({
            ...data,
            pub_date: data.pub_date ? new Date(data.pub_date) : null,
          });
        }
      },
    }
  );

  // 카테고리 목록 가져오기
  const { data: categories, isLoading: isCategoriesLoading } = useQuery('categories', fetchCategories, {
    enabled: router.isReady && isMounted
  });

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

  if (!isMounted) {
    return null; // 클라이언트에서 마운트되기 전에는 아무것도 렌더링하지 않음
  }

  if (isNewsLoading || isCategoriesLoading || !formInstance) {
    return (
      <Card style={{ maxWidth: 800, margin: '0 auto', marginTop: 20 }}>
        <Spin tip="데이터 로딩 중..." />
      </Card>
    );
  }

  if (newsError) {
    return (
      <Card style={{ maxWidth: 800, margin: '0 auto', marginTop: 20 }}>
        <Alert
          message="데이터 로딩 오류"
          description={(newsError as Error).message}
          type="error"
          showIcon
        />
      </Card>
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
          form={formInstance}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            title: '',
            original_link: '',
            category: '',
            description: '',
          }}
        >
          <FormItems
            formInstance={formInstance}
            categories={categories}
            Input={Input}
            Select={Select}
            DatePicker={DatePicker}
            TextArea={TextArea}
            FormItem={FormItem}
          />
            <FormItem>
              <Space>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  저장
                </Button>
                <Button onClick={handleCancel}>취소</Button>
              </Space>
            </FormItem>
        </Form>
      </Card>
    </div>
  );
}

// 이 페이지는 클라이언트 사이드에서만 렌더링
export default dynamic(() => Promise.resolve(AdminDetailPage), {
  ssr: false
});