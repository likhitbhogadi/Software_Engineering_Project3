import axios from 'axios';

const READ_BASE = '/api/patients';

/**
 * Fetch aggregated patient profile by patientId.
 * GET /api/patients/:id
 *
 * @param {string} patientId
 * @param {string} token - JWT token (DOCTOR role required)
 */
export async function getPatient(patientId, token) {
  const res = await axios.get(`${READ_BASE}/${patientId}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  });
  return res.data;
}

/**
 * List all patients (paginated).
 * GET /api/patients?page=1&limit=20
 */
export async function listPatients(token, page = 1, limit = 20) {
  const res = await axios.get(`${READ_BASE}?page=${page}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10000,
  });
  return res.data;
}
