import React from 'react'
import ReactDOM from 'react-dom/client'
import { AuthGate } from './features/auth/components/AuthGate'
import { LegalPage } from './features/legal/LegalPage'
import './index.css'

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const legalDocument = path === '/privacidade'
  ? 'privacy'
  : path === '/termos'
    ? 'terms'
    : null

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {legalDocument ? <LegalPage document={legalDocument} /> : <AuthGate />}
  </React.StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch((error: unknown) => {
        console.error('Falha ao registrar o service worker:', error)
      })
  })
}
