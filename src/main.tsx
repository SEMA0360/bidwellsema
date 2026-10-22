import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import PageErrorBoundary from './components/PageErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PageErrorBoundary>
      <App />
    </PageErrorBoundary>
  </StrictMode>
);
