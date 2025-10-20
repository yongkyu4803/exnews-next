import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createLogger } from '@/utils/logger';

const logger = createLogger('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch React errors
 * Displays a fallback UI when an error occurs
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#ff4d4f' }}>
            문제가 발생했습니다
          </h1>
          <p style={{ color: '#595959', marginBottom: '24px', maxWidth: '500px' }}>
            죄송합니다. 예기치 않은 오류가 발생했습니다.
            <br />
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details
              style={{
                marginTop: '20px',
                padding: '16px',
                backgroundColor: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                maxWidth: '600px',
                textAlign: 'left',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '8px' }}>
                개발 모드: 오류 상세 정보
              </summary>
              <div style={{ marginTop: '12px' }}>
                <strong>Error:</strong>
                <pre
                  style={{
                    backgroundColor: '#f5f5f5',
                    padding: '8px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    fontSize: '12px',
                  }}
                >
                  {this.state.error.toString()}
                </pre>
              </div>
              {this.state.errorInfo && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Component Stack:</strong>
                  <pre
                    style={{
                      backgroundColor: '#f5f5f5',
                      padding: '8px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px',
                      maxHeight: '200px',
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </details>
          )}

          <div style={{ marginTop: '24px' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                backgroundColor: '#1890ff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '12px',
              }}
            >
              다시 시도
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '10px 24px',
                fontSize: '14px',
                backgroundColor: '#fff',
                color: '#1890ff',
                border: '1px solid #1890ff',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              홈으로 이동
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
