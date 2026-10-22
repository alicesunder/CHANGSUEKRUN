// Mitr — rounded Thai display font for the hero headline (self-hosted, OFL)
import '@fontsource/mitr/thai-600.css';
import '@fontsource/mitr/thai-700.css';
import '@fontsource/mitr/latin-600.css';
import '@fontsource/mitr/latin-700.css';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
