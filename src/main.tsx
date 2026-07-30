import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Base-relative: on a project GitHub Pages site the app lives under
    // `/<repo>/`, and an absolute `/sandbox-sw.js` would 404 with the page's own
    // index.html — which the browser rejects as a worker.
    const swUrl = `${import.meta.env.BASE_URL}sandbox-sw.js`.replace(/\/{2,}/g, '/');
    navigator.serviceWorker.register(swUrl).then(registration => {
      console.log('Sandbox SW registered: ', registration);
    }).catch(registrationError => {
      console.log('Sandbox SW registration failed: ', registrationError);
    });
  });
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
