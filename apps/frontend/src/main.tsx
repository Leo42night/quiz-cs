import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './Close.tsx'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from "@/components/ui/sonner"
import { MainProvider } from './context/MainContext.tsx'
import { checkAndMigrateStorage } from './lib/storageManage.ts'

checkAndMigrateStorage();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MainProvider>
      <GoogleOAuthProvider clientId="520465797065-v47v1p1n63d2dvg96nhst0t6cpi67i0k.apps.googleusercontent.com">
        <App />
        <Toaster />
      </GoogleOAuthProvider>
    </MainProvider>
  </StrictMode>,
)
