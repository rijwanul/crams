// API configuration for different environments
const API_CONFIG = {
  // Use environment variable if available, otherwise fallback to localhost for development
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: '/api/auth',
    COURSES: '/api/courses',
    REGISTRATION: '/api/registration',
    ANALYTICS: '/api/analytics',
    NOTIFICATIONS: '/api/notifications',
    USERS: '/api/users'
  }
};

// Helper function to build full API URLs
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export individual endpoints for convenience
export const API_URLS = {
  LOGIN: getApiUrl(API_CONFIG.ENDPOINTS.AUTH + '/login'),
  SIGNUP: getApiUrl(API_CONFIG.ENDPOINTS.AUTH + '/signup'),
  COURSES: getApiUrl(API_CONFIG.ENDPOINTS.COURSES),
  REGISTRATION: getApiUrl(API_CONFIG.ENDPOINTS.REGISTRATION),
  REGISTRATION_STUDENT: getApiUrl(API_CONFIG.ENDPOINTS.REGISTRATION + '/student'),
  ANALYTICS: getApiUrl(API_CONFIG.ENDPOINTS.ANALYTICS),
  NOTIFICATIONS: getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS),
  USERS: getApiUrl(API_CONFIG.ENDPOINTS.USERS)
};

export default API_CONFIG;
