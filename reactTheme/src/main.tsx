import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import './styles/index.css'
import App from './app/App'
import AppProviders from './app/providers'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)

// Remove the boot preloader once React has committed its first paint.
const removeBootPreloader = () => {
  const loader = document.getElementById('app-preloader')

  if (!loader) {
    return
  }

  loader.style.opacity = '0'
  setTimeout(() => loader.remove(), 300)
}

requestAnimationFrame(() => requestAnimationFrame(removeBootPreloader))
