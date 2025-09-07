import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Global error handlers for browser extension errors
window.addEventListener('error', (event) => {
  // Filter out browser extension errors
  if (event.error?.message?.includes('editorId') ||
      event.error?.message?.includes('chrome-extension') ||
      event.error?.message?.includes('moz-extension') ||
      event.filename?.includes('chrome-extension') ||
      event.filename?.includes('moz-extension')) {
    console.warn('Browser extension error detected - ignoring:', event.error?.message);
    event.preventDefault();
    return false;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  // Filter out browser extension promise rejections
  if (event.reason?.message?.includes('editorId') ||
      event.reason?.message?.includes('chrome-extension') ||
      event.reason?.message?.includes('moz-extension')) {
    console.warn('Browser extension promise rejection detected - ignoring:', event.reason?.message);
    event.preventDefault();
    return false;
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
