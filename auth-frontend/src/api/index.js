import axios from "axios";

// In production (Vercel), REACT_APP_API_URL must point to your Render backend
// In development, proxy in package.json handles it
const BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api/v1`
  : "/api/v1";

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await API.post("/auth/refresh-token");
        const newToken = data.data?.accessToken;
        if (newToken) {
          localStorage.setItem("accessToken", newToken);
          API.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        }
        processQueue(null, newToken);
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => API.post("/auth/register", data),
  login: (data) => API.post("/auth/login", data),
  logout: () => API.post("/auth/logout"),
  verifyEmail: (token) => API.get(`/auth/verify-email?token=${token}`),
  resendVerification: (email) => API.post("/auth/resend-verification", { email }),
  forgotPassword: (email) => API.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => API.post(`/auth/reset-password?token=${token}`, { password }),
  getMe: () => API.get("/auth/me"),
};

export default API;
