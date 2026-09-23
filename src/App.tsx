import { BrowserRouter, HashRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner, SiteHeader } from './components/Layout';
import { buttonClass } from './components/buttonClass';
import { USE_HASH_ROUTER } from './lib/appUrl';
import { AdminDetailPage } from './pages/AdminDetailPage';
import { AdminPage } from './pages/AdminPage';
import { ARLaunchPage } from './pages/ARLaunchPage';
import { DemoPage } from './pages/DemoPage';
import { LandingPage } from './pages/LandingPage';
import { LandingV2Page } from './pages/LandingV2Page';
import { LandingV3Page } from './pages/LandingV3Page';
import { LandingV4Page } from './pages/LandingV4Page';
import { LandingV5Page } from './pages/LandingV5Page';
import { LandingV6Page } from './pages/LandingV6Page';
import { LandingV7Page } from './pages/LandingV7Page';
import { OrderStatusPage } from './pages/OrderStatusPage';
import { OrderWizardPage } from './pages/OrderWizardPage';

// Trang AR tải riêng (three.js + MindAR nặng), không làm chậm landing.
const MemoryPage = lazy(() => import('./pages/MemoryPage').then((m) => ({ default: m.MemoryPage })));
const memoryPage = (
  <Suspense fallback={<div className="min-h-screen bg-paper" />}>
    <MemoryPage />
  </Suspense>
);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="container-page py-20">
        <h1 className="text-3xl font-bold">Không tìm thấy trang</h1>
        <p className="mt-2 text-muted">Đường dẫn này không tồn tại hoặc đã thay đổi.</p>
        <Link to="/" className={buttonClass('primary', 'mt-6')}>Về trang chủ</Link>
      </main>
    </>
  );
}

export function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <OfflineBanner />
      <Routes>
        {/* Trang chủ là bản V7 đã chốt. Landing đầu tiên giữ ở /v1 để so sánh. */}
        <Route path="/" element={<LandingV7Page />} />
        <Route path="/v1" element={<LandingPage />} />
        <Route path="/v2" element={<LandingV2Page />} />
        <Route path="/v3" element={<LandingV3Page />} />
        <Route path="/v4" element={<LandingV4Page />} />
        <Route path="/v5" element={<LandingV5Page />} />
        <Route path="/v6" element={<LandingV6Page />} />
        <Route path="/v7" element={<LandingV7Page />} />
        <Route path="/order" element={<OrderWizardPage />} />
        <Route path="/order/:id" element={<OrderStatusPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/:id" element={<AdminDetailPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/ar/:experienceId" element={<ARLaunchPage />} />
        <Route path="/memory" element={memoryPage} />
        <Route path="/memory/:code" element={memoryPage} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  const Router = USE_HASH_ROUTER ? HashRouter : BrowserRouter;
  return (
    <ErrorBoundary>
      <Router>
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}
