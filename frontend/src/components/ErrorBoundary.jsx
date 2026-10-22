import React from 'react'
import { AlertCircleIcon } from './Icons'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              background: 'var(--color-bg-surface, #ffffff)',
              border: '1px solid var(--color-border-default, #e2e8f0)',
              borderRadius: 16,
              padding: 28,
              textAlign: 'center',
              boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.08))',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <AlertCircleIcon width={24} height={24} />
            </div>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                marginBottom: 8,
                color: 'var(--color-text-primary, #0f172a)',
              }}
            >
              Đã xảy ra sự cố hiển thị giao diện
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: 'var(--color-text-tertiary, #64748b)',
                lineHeight: 1.5,
                marginBottom: 20,
              }}
            >
              {this.state.error?.message ||
                'Có lỗi ngoài ý muốn khi kết xuất dữ liệu trang. Vui lòng thử tải lại trang.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.handleReload}
              style={{ width: '100%' }}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
