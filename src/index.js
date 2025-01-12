import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import ReactGA from 'react-ga';

// Initialize Google Analytics with the tracking ID from the environment variable
ReactGA.initialize(process.env.REACT_APP_GA_TRACKING_ID);

// Log page views
const logPageView = () => {
    ReactGA.set({ page: window.location.pathname });
    ReactGA.pageview(window.location.pathname);
};

// Call logPageView on every route change
logPageView();

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById('root')
);
