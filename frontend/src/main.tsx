import React from 'react';
import ReactDOM from 'react-dom/client';
import { LoginGate } from './components/common/LoginGate';
import { MainPage } from './pages/MainPage';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LoginGate>
      <MainPage />
    </LoginGate>
  </React.StrictMode>,
);
