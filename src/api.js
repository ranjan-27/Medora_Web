// Central API base configuration used by frontend components.
// Set VITE_API_URL in project root `.env` to override (e.g. http://localhost:5000)
// Ensure API base has no trailing slash to avoid double-slash URLs
const rawApiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = rawApiBase.replace(/\/$/, '');
export const API = `${API_BASE}/api`;

export default API;
