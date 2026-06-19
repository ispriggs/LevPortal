import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

// Sync Supabase session into the store on every auth event.
// onAuthStateChange fires once immediately with the current session
// (or null), so this also handles the initial page load / PWA reopen.
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSession(session)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
