import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './auth/AuthContext.jsx'
import { CartProvider } from './contexts/CartContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'
import { WishlistProvider } from './contexts/WishlistContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <WishlistProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </WishlistProvider>
      </NotificationProvider>
    </AuthProvider>
  </StrictMode>,
)
