import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import DebugLogPage from './DebugLogPage.tsx';
import PersonalIoTPage from './PersonalIoTPage.tsx';
import './index.css';

const path = window.location.pathname;
const RootComponent =
  path === '/super-admin-debug' ? DebugLogPage : path === '/iot-personal' ? PersonalIoTPage : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootComponent />
  </StrictMode>,
);
