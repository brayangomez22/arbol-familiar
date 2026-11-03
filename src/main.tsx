import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import '@/styles/global.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { applyThemeVariables } from '@/styles/themeVariables';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element in index.html');

applyThemeVariables(document.documentElement);

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
