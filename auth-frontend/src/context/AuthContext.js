import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    // 8 second timeout — stops infinite loading
    const timeout = setTimeout(() => {
      setUser(null);
      setLoading(false);
    }, 8000);

    try {
      const { data } = await authAPI.getMe();
      clearTimeout(timeout);
      setUser(data.data?.user || null);
    } catch {
      clearTimeout(timeout);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    const userData = data.data?.user;
    const token = data.data?.accessToken;
    if (token) localStorage.setItem("accessToken", token);
    setUser(userData);
    return data;
  };

  const logout = async () => {
    try { await authAPI.logout(); } catch {}
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  const updateUser = (updatedUser) => setUser(updatedUser);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;