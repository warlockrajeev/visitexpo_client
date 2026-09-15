/**
 * @file apiConfig.js
 * @description Central API configuration with automatic production domain fallback.
 */

export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname.includes('visitexpo.in')) {
    return 'https://api.visitexpo.in/api';
  }
  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();
export default API_URL;
