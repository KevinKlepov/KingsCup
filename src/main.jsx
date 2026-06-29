import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import KingsCup from './KingsCup.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <KingsCup />
  </StrictMode>,
)
