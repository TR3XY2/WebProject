import axios from "axios";

const API_BASE = "https://localhost:5001/api";

axios.defaults.withCredentials = true;

export async function register(email, password) {
  return await axios.post(`${API_BASE}/Auth/register`, { email, password });
}

export async function login(email, password) {
  return await axios.post(`${API_BASE}/Auth/login`, { email, password });
}

export async function logout() {
  return await axios.post(`${API_BASE}/Auth/logout`);
}

export async function getHistory() {
  const response = await axios.get(`${API_BASE}/NewtonRaphson/history`);
  return response.data;
}
