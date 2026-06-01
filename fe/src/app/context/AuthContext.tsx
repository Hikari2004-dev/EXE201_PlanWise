import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserInfo, AuthResponse, RegisterRequest, LoginRequest } from "../types/auth.types";

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (credentials: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loginWithToken: (token: string, refreshToken: string) => Promise<void>;
  fetchWithAuth: (path: string, options?: RequestInit) => Promise<Response>;
  refreshProfile: () => Promise<void>;
  handleRefreshToken?: (refresh: string) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API Base URL config: default to localhost:8080 or environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogoutState = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setIsAuthenticated(false);
  };

  const handleRefreshToken = async (refresh: string): Promise<string | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (response.ok) {
        const data: AuthResponse = await response.json();
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        setUser(data.user);
        setIsAuthenticated(true);
        return data.accessToken;
      } else {
        handleLogoutState();
        return null;
      }
    } catch (err) {
      console.error("Token refresh error:", err);
      handleLogoutState();
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      const refresh = localStorage.getItem("refreshToken");

      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setIsAuthenticated(true);
          } else if (response.status === 401 && refresh) {
            await handleRefreshToken(refresh);
          } else {
            handleLogoutState();
          }
        } catch (err) {
          console.error("Auth init error:", err);
          if (refresh) {
            await handleRefreshToken(refresh);
          } else {
            handleLogoutState();
          }
        }
      } else if (refresh) {
        await handleRefreshToken(refresh);
      } else {
        handleLogoutState();
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        const authData = data as AuthResponse;
        localStorage.setItem("accessToken", authData.accessToken);
        localStorage.setItem("refreshToken", authData.refreshToken);
        setUser(authData.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(data.message || "Đăng nhập thất bại");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối đến máy chủ");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (credentials: RegisterRequest) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.status === 201 || response.ok) {
        const authData = data as AuthResponse;
        localStorage.setItem("accessToken", authData.accessToken);
        localStorage.setItem("refreshToken", authData.refreshToken);
        setUser(authData.user);
        setIsAuthenticated(true);
      } else {
        throw new Error(data.message || "Đăng ký thất bại");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối đến máy chủ");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Logout error on server:", err);
    } finally {
      handleLogoutState();
      setLoading(false);
    }
  };

  const loginWithToken = async (token: string, refreshToken: string) => {
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("refreshToken", refreshToken);
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error("Không thể tải thông tin người dùng từ token");
      }
    } catch (err: any) {
      handleLogoutState();
      setError(err.message || "Lỗi đăng nhập OAuth2");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchWithAuth = async (path: string, options: RequestInit = {}): Promise<Response> => {
    let token = localStorage.getItem("accessToken");

    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const fetchOptions = { ...options, headers };
    let response = await fetch(`${API_BASE_URL}${path}`, fetchOptions);

    if (response.status === 401) {
      const refresh = localStorage.getItem("refreshToken");
      if (refresh) {
        const newToken = await handleRefreshToken(refresh);
        if (newToken) {
          headers.set("Authorization", `Bearer ${newToken}`);
          response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
        }
      }
    }

    return response;
  };

  const refreshProfile = async () => {
    try {
      const response = await fetchWithAuth("/api/v1/auth/me");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (err) {
      console.error("Refresh profile error:", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        loginWithToken,
        fetchWithAuth,
        refreshProfile,
        handleRefreshToken: handleRefreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
