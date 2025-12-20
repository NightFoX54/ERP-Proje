import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Service Worker cache temizleme (geliştirme için)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
  
  // Cache temizleme
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

