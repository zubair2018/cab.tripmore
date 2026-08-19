import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'
import './styles/base.css'
import './styles/site.css'
import './styles/booking-dialog.css'

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
