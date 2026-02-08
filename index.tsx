
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Le shim est maintenant géré dans index.html pour plus de sécurité au démarrage.

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
