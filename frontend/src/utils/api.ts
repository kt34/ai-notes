import { config } from '../config';

interface ApiRequestOptions extends RequestInit {
  token?: string | null;
  skipAuthRedirect?: boolean;
}

export class TokenExpiredError extends Error {
  constructor() {
    super('Token expired');
    this.name = 'TokenExpiredError';
  }
}

export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}) {
  const { token, skipAuthRedirect = false, ...fetchOptions } = options;
  
  // Prepare headers
  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Make the request
  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    ...fetchOptions,
    headers
  });

  // Handle 401 Unauthorized errors
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));
    console.log(errorData);
    const errorMessage = errorData.detail || 'Unauthorized';
    
    // Check if the error is due to token expiration
    if (errorMessage.includes('token is expired') || 
        errorMessage.includes('invalid JWT') ||
        errorMessage.includes('Could not validate credentials')) {
      
      if (!skipAuthRedirect) {
        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Redirect to login
        window.location.href = '/login';
      }
      
      throw new TokenExpiredError();
    }

    throw new Error(errorMessage || 'Something went wrong, please try again');
  }

  // Handle other error responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Request failed');
  }

  // Return successful response
  return response.json();
} 