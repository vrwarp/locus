import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

// Register Sandbox Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sandbox-sw.js')
      .then(registration => {
        console.log('Sandbox ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(err => {
        console.log('Sandbox ServiceWorker registration failed: ', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
