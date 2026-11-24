import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { AccountProvider } from './account'
import './index.css'

// The offline copy (docs/presentation/site) is opened from disk, where only hash URLs work
const Router = import.meta.env.VITE_OFFLINE ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <AccountProvider>
        <App />
      </AccountProvider>
    </Router>
  </React.StrictMode>,
)
