import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { USE_HASH_ROUTER } from './lib/appUrl';

// Bản HTML một file có thể mở thẳng vào một trang (ví dụ /v2) qua biến VITE_START_ROUTE lúc build.
const startRoute = import.meta.env.VITE_START_ROUTE as string | undefined;
if (USE_HASH_ROUTER && startRoute && !window.location.hash) window.location.hash = startRoute;

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
