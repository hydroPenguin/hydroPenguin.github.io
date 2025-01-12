import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ReactGA from 'react-ga';

// Initialize Google Analytics with your tracking ID
ReactGA.initialize('G-HGSEM1GYC7'); // Replace with your actual tracking ID

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
