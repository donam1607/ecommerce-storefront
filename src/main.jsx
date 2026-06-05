import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { wakeUpBackend } from './utils/api.js'

// Wake up Render backend on app start (prevents cold-start timeout for users)
wakeUpBackend();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
