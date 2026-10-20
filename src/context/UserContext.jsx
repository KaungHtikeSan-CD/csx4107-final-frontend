import { createContext, useCallback, useEffect, useState } from "react";
import { request } from "../lib/api";
export const UserContext = createContext(null);
const KEY = "coursespace_session";
export function UserProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(KEY) || "");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [sessionError, setSessionError] = useState("");
  const clear = useCallback(() => {
    sessionStorage.removeItem(KEY);
    setToken("");
    setUser(null);
  }, []);
  useEffect(() => {
    let active = true;
    if (!token) return;
    request("/api/user", { token })
      .then(({ user }) => {
        if (active) setUser(user);
      })
      .catch((error) => {
        if (active) {
          clear();
          setSessionError(error.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, clear]);
  async function login(login, password) {
    const data = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    });
    sessionStorage.setItem(KEY, data.token);
    setUser(data.user);
    setToken(data.token);
    setSessionError("");
  }
  async function logout() {
    try {
      await request("/api/auth/logout", { token, method: "POST" });
    } finally {
      clear();
    }
  }
  const api = useCallback(
    async (path, options = {}) => {
      try {
        return await request(path, { ...options, token });
      } catch (error) {
        if (error.status === 401) {
          clear();
          setSessionError("Your session has expired. Please sign in again.");
        }
        throw error;
      }
    },
    [token, clear],
  );
  return (
    <UserContext.Provider
      value={{ user, loading, login, logout, api, sessionError }}
    >
      {children}
    </UserContext.Provider>
  );
}
