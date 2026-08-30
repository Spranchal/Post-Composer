export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API routes always return JSON. If an HTML page arrives, the frontend is
// pointing at a static site or unavailable backend rather than this API.
export async function readApiJson(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`The backend at ${API_URL} is unavailable or is not the Post Composer API. Start the backend and refresh the app.`);
  }
  return response.json();
}
