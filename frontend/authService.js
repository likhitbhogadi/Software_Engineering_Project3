import axios from 'axios';

const AUTH_BASE = '/api/auth';

/**
 * Login user
 * POST /api/auth/login
 */
export async function loginUser(email, password) {
  const res = await axios.post(`${AUTH_BASE}/login`, { email, password });
  return res.data; // { token, user: { id, name, email, role } }
}

/**
 * Register user
 * POST /api/auth/register
 */
export async function registerUser(name, email, password, role) {
  const res = await axios.post(`${AUTH_BASE}/register`, { name, email, password, role });
  return res.data;
}
