import React, { useState } from 'react';
import styled from '@emotion/styled';

const Container = styled.div`
  width: 100%;
`;

const Header = styled.div`
  margin-bottom: 12px;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
`;

const Description = styled.div`
  font-size: 13px;
  color: #999;
  line-height: 1.5;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: #1a4b8c;
  }

  &::placeholder {
    color: #bbb;
  }
`;

const AddButton = styled.button`
  padding: 12px 20px;
  background: #1a4b8c;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;

  &:active {
    background: #153a6f;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const KeywordListHeader = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;

  span {
    color: #1a4b8c;
    font-weight: 600;
  }
`;

const KeywordTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 40px;
`;

const KeywordTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #e6f0ff;
  border: 1px solid #1a4b8c;
  border-radius: 20px;
  font-size: 14px;
  color: #1a4b8c;
  font-weight: 500;
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #1a4b8c;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  line-height: 1;

  &:active {
    background: #153a6f;
  }
`;

const EmptyMessage = styled.div`
  color: #bbb;
  font-size: 14px;
  text-align: center;
  padding: 20px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  font-size: 13px;
  margin-top: 6px;
`;

const HelpText = styled.div`
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  line-height: 1.4;
`;

interface KeywordManagerProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  maxKeywords?: number;
  disabled?: boolean;
}

const KeywordManager: React.FC<KeywordManagerProps> = ({
  keywords,
  onChange,
  maxKeywords = 10,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const validateKeyword = (keyword: string): string | null => {
    if (keyword.length < 2) {
      return '키워드는 최소 2자 이상이어야 합니다';
    }
    if (keyword.length > 20) {
      return '키워드는 최대 20자까지 가능합니다';
    }
    // 특수문자 제한 (공백, 영문, 한글, 숫자만 허용)
    if (!/^[a-zA-Z0-9가-힣\s]+$/.test(keyword)) {
      return '특수문자는 사용할 수 없습니다';
    }
    if (keywords.includes(keyword)) {
      return '이미 등록된 키워드입니다';
    }
    if (keywords.length >= maxKeywords) {
      return `최대 ${maxKeywords}개까지 등록 가능합니다`;
    }
    return null;
  };

  const handleAddKeyword = () => {
    const trimmedValue = inputValue.trim();

    if (!trimmedValue) {
      setError('키워드를 입력하세요');
      return;
    }

    const validationError = validateKeyword(trimmedValue);
    if (validationError) {
      setError(validationError);
      return;
    }

    // 키워드 추가
    onChange([...keywords, trimmedValue]);
    setInputValue('');
    setError('');
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    onChange(keywords.filter(k => k !== keywordToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (error) setError('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  return (
    <Container>
      <Header>
        <Title>관심 키워드 알림</Title>
        <Description>
          특정 키워드가 포함된 뉴스만 알림을 받습니다
        </Description>
      </Header>

      <InputGroup>
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="키워드 입력 (예: 삼성전자, AI, 부동산)"
          maxLength={20}
          disabled={disabled || keywords.length >= maxKeywords}
        />
        <AddButton
          onClick={handleAddKeyword}
          disabled={disabled || keywords.length >= maxKeywords || !inputValue.trim()}
        >
          추가
        </AddButton>
      </InputGroup>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <KeywordListHeader>
        등록된 키워드 (<span>{keywords.length}</span>/{maxKeywords})
      </KeywordListHeader>

      <KeywordTags>
        {keywords.length === 0 ? (
          <EmptyMessage>
            등록된 키워드가 없습니다
            <br />
            <small>키워드를 입력하고 추가 버튼을 눌러주세요</small>
          </EmptyMessage>
        ) : (
          keywords.map((keyword, index) => (
            <KeywordTag key={`${keyword}-${index}`}>
              {keyword}
              <RemoveButton
                onClick={() => handleRemoveKeyword(keyword)}
                disabled={disabled}
                aria-label={`${keyword} 삭제`}
              >
                ×
              </RemoveButton>
            </KeywordTag>
          ))
        )}
      </KeywordTags>

      <HelpText>
        💡 팁: 키워드는 뉴스 제목과 본문에서 검색됩니다. 너무 일반적인 단어보다는 구체적인 키워드를 사용하세요.
      </HelpText>
    </Container>
  );
};

export default KeywordManager;
