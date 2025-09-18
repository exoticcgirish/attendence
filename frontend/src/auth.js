import axios from "axios";
import "./index.css";

const API_URL = "http://localhost:8000";

const login = async (username, password) => {
  // FastAPI's OAuth2 expects form data, not JSON
  const params = new URLSearchParams();
  params.append("username", username);
  params.append("password", password);

  const response = await axios.post(`${API_URL}/token`, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (response.data.access_token) {
    localStorage.setItem("token", response.data.access_token);
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem("token");
};

const getToken = () => {
  return localStorage.getItem("token");
};

const isLoggedIn = () => {
  return !!getToken();
};

const authHeader = () => {
  const token = getToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  } else {
    return {};
  }
};

export { login, logout, isLoggedIn, authHeader, getToken };
