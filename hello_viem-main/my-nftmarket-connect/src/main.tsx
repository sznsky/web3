import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 这里可包裹 <AppKitProvider>，如需全局钱包上下文 */}
    <App />
  </StrictMode>,
)
