import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { SessionProvider } from './context/SessionContext.jsx'
import { StoreProvider } from './context/StoreContext.jsx'
import { BookingProvider } from './context/BookingContext.jsx'
import './index.css'

// PWA: registra el service worker (network-first; no interfiere con HMR)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <SessionProvider>
          <StoreProvider>
            <BookingProvider>
              <App />
            </BookingProvider>
          </StoreProvider>
        </SessionProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
