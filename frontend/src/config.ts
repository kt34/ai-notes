export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
}; 