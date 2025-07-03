import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster 
          position="top-center"
          reverseOrder={false}
          gutter={8}
          containerClassName=""
          containerStyle={{}}
          toastOptions={{
            // إعدادات افتراضية للإشعارات
            className: '',
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
              fontFamily: 'Cairo, sans-serif',
              fontSize: '14px',
              borderRadius: '8px',
              padding: '12px 16px',
            },
            // إعدادات الإشعارات المختلفة
            success: {
              duration: 3000,
              style: {
                background: '#22c55e',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#22c55e',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#ef4444',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
            loading: {
              style: {
                background: '#3b82f6',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#3b82f6',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)