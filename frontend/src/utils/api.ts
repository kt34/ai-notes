import { config } from '../config';

interface ApiRequestOptions extends RequestInit {
  token?: string | null;
  skipAuthRedirect?: boolean;
  isFormData?: boolean;
}

export class TokenExpiredError extends Error {
  constructor() {
    super('Token expired');
    this.name = 'TokenExpiredError';
  }
}

export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}) {
  const { token, skipAuthRedirect = false, isFormData = false, ...fetchOptions } = options;
  
  // Prepare headers
  const headers = new Headers(fetchOptions.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  // Convert body to JSON string if it's not FormData
  let body = fetchOptions.body;
  if (body && typeof body === 'object' && !isFormData) {
    body = JSON.stringify(body);
  }

  // Make the request
  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    ...fetchOptions,
    headers,
    body
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

  if (response.status === 204) { // Handle no content response
    return { success: true };
  }

  // Handle other error responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Request failed');
  }
  
  // Return successful response
  try {
    return await response.json();
  } catch (e) {
    // Handle cases where response is OK but body is empty
    return { success: true };
  }
} 