import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(
      process.env.PUBLIC_URL + '/sw.js'
    ).then(() => console.log('SW registered'))
     .catch(e => console.log('SW error:', e));
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
