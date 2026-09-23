import { Component, type ErrorInfo, type ReactNode } from 'react';
import { buttonClass } from './buttonClass';

interface State {
  error: Error | null;
}

/** Chặn màn hình trắng: mọi lỗi render đều có đường thoát. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Chạm UI error', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="container-page flex min-h-screen flex-col items-start justify-center gap-4 py-16">
        <h1 className="text-3xl font-bold">Trang này gặp lỗi</h1>
        <p className="max-w-lg text-muted">Dữ liệu đơn và bản nháp vẫn được giữ trên thiết bị. Tải lại trang để tiếp tục, hoặc quay về trang chủ.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={buttonClass('primary')} onClick={() => window.location.reload()}>
            Tải lại trang
          </button>
          <a className={buttonClass('secondary')} href="/">
            Về trang chủ
          </a>
        </div>
      </main>
    );
  }
}
