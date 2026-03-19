import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';

// Replace with your Clerk Publishable Key
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn('Missing REACT_APP_CLERK_PUBLISHABLE_KEY in .env');
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY || 'pk_test_placeholder'}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
