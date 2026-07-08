import React from 'react';
import { createRoot } from 'react-dom/client';
import '@ve-design/react/css/default.css';
import './themes/vedesign-Agent-Theme.css';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
