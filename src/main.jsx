import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { ensureCryptoRandomUUID } from './utils/uuid.js';
import './index.css';

// 1. Asegurar disponibilidad de crypto.randomUUID en contextos no seguros (HTTP LAN / iPhone Safari)
ensureCryptoRandomUUID();

// 2. Captura global de excepciones no controladas antes o durante el montaje
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('[LinkeoGes Global Error]', event.error?.message || event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[LinkeoGes Unhandled Rejection]', event.reason?.message || event.reason);
  });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
