import axios from "axios";

const API_BASE = "https://localhost/api";

axios.defaults.withCredentials = true;

export async function register(email, password) {
  return await axios.post(
    `${API_BASE}/Auth/register`,
    { email, password },
    { withCredentials: true }
  );
}

export async function login(email, password) {
  return await axios.post(
    `${API_BASE}/Auth/login`,
    { email, password },
    { withCredentials: true }
  );
}

export async function logout() {
  return await axios.post(
    `${API_BASE}/Auth/logout`,
    {},
    { withCredentials: true }
  );
}

export async function getHistory() {
  return await axios.get(`${API_BASE}/NewtonRaphson/history`, {
    withCredentials: true,
  });
}
