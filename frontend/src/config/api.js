// API Configuration
// Automatically uses localhost in development and production URL in production

const API_BASE_URL = process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000'
    : 'https://dons-website.onrender.com');

export const API_ENDPOINTS = {
  portfolio: `${API_BASE_URL}/api/portfolio`,
  portfolioHistory: `${API_BASE_URL}/api/portfolio/history`,
  portfolioTrades: `${API_BASE_URL}/api/portfolio/trades`,
  portfolioSync: `${API_BASE_URL}/api/portfolio/sync`,
};

export default API_ENDPOINTS;
