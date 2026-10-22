import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

import useIdleLogout from "@/hooks/useIdleLogout";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getCsrfToken } from "@/api/csrf";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  usertype: string;
  orgName: string; // Optional field for organization name
}
interface police {
  id: string;
  name: string;
  email: string;
  role: string;
  usertype: string;
  checkpost?: string | null;
  checkpostid: number | string | null;
  locationid: number | null;
  pol_reg_id: string;
}

interface admin {
  id: string;
  name: string;
  email: string;
  role: string;
  usertype: string;
}

type AccountType = "user" | "police" | "admin";

interface AuthContextType {
  user: User | police | admin | null;
  login: (email: string, password: string, captcha: string) => Promise<any>;
  Policelogin: (
    email: string,
    password: string,
    captcha: string,
  ) => Promise<any>;
  AdminLogin: (
    userid: string,
    password: string,
    captcha: string,
  ) => Promise<any>;

  logout: () => Promise<void>;
  isLoading: boolean;
  accessToken: string | null;
  // Kept for compatibility; the refresh token now lives only in an
  // httpOnly cookie and is never readable by scripts.
  refreshToken: null;
}

// Build the user object each part of the app expects from a login or
// refresh response.
const toSessionUser = (type: AccountType, regUser: any) => {
  if (type === "police") {
    return {
      id: regUser.id,
      name: regUser.name || regUser.email.split("@")[0],
      email: regUser.email,
      role: regUser.role,
      usertype: regUser.usertype,

      // ✅ NULL-safe
      checkpost: regUser.checkpostDetails?.location ?? null,
      checkpostid: regUser.checkpostDetails?.locationid ?? null,
      locationid: regUser.checkpostDetails?.locationid ?? null,

      pol_reg_id: regUser.reg_id,
    };
  }

  if (type === "admin") {
    return {
      id: regUser.id,
      name: regUser.email,
      email: regUser.email,
      role: regUser.role,
      usertype: regUser.usertype,
    };
  }

  return {
    id: regUser.id,
    name: regUser.name || regUser.email.split("@")[0],
    email: regUser.email,
    role: regUser.role,
    usertype: regUser.usertype,
    orgName: regUser.orgName,
  };
};

// Seconds until a JWT expires (0 when it cannot be read).
const secondsUntilExpiry = (token: string) => {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return Math.max(payload.exp - Date.now() / 1000, 0);
  } catch {
    return 0;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate(); // ✅ Move useNavigate here
  const [user, setUser] = useState<User | police | admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // The access token is held in memory only (never in browser storage).
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSession = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    setUser(null);
    setAccessToken(null);
  }, []);

  const postWithCsrf = async (path: string, body: object) => {
    const csrfToken = await getCsrfToken();
    return axios.post(`${API_BASE_URL}/api/auth/${path}`, body, {
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
      },
    });
  };

  const startSession = useCallback((data: any, type: AccountType) => {
    const sessionUser = toSessionUser(type, data.user);
    setUser(sessionUser);
    setAccessToken(data.tokens.accessToken);
    return sessionUser;
  }, []);

  // Exchange the httpOnly refresh cookie for a new access token.
  const refreshSession = useCallback(async () => {
    try {
      const response = await postWithCsrf("refresh-token", {});
      const data = response.data?.data;
      startSession(data, data.accountType);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, [startSession, clearSession]);

  // Restore the session after a page reload.
  useEffect(() => {
    refreshSession().finally(() => setIsLoading(false));
  }, [refreshSession]);

  // Renew the access token shortly before it expires.
  useEffect(() => {
    if (!accessToken) return;

    const delay = Math.max(secondsUntilExpiry(accessToken) - 60, 5) * 1000;
    refreshTimer.current = setTimeout(async () => {
      if (!(await refreshSession())) {
        navigate("/", { replace: true });
      }
    }, delay);

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, [accessToken, refreshSession, navigate]);

  const signIn = async (
    path: string,
    body: object,
    type: AccountType,
    errorLabel: string,
  ) => {
    setIsLoading(true);
    try {
      const response = await postWithCsrf(path, body);
      const result = response.data;

      if (result.success === false) {
        throw new Error(result.message || "Login failed");
      }

      if (type === "admin" && result.data.user.role !== "admin") {
        throw new Error("Unauthorized admin access");
      }

      startSession(result.data, type);
      return result;
    } catch (error: any) {
      console.error(errorLabel, error.response?.data?.message || error.message);
      throw error; // 🔥 pass real message to UI
    } finally {
      setIsLoading(false);
    }
  };

  const login = (email: string, password: string, captcha: string) =>
    signIn("login", { email, password, captcha }, "user", "Login error:");

  const Policelogin = (email: string, password: string, captcha: string) =>
    signIn(
      "Policelogin",
      { email, password, captcha },
      "police",
      "Police login error:",
    );

  const AdminLogin = (userid: string, password: string, captcha: string) =>
    signIn(
      "Adminlogin",
      { userid, password, captcha },
      "admin",
      "Admin login error:",
    );

  const logout = useCallback(async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/logout`,
        {},
        {
          withCredentials: true,
          headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {},
        },
      );
    } catch (error) {
      console.error("Logout API request failed");
    } finally {
      clearSession();
      navigate("/", { replace: true });
    }
  }, [accessToken, clearSession, navigate]);

  useIdleLogout(logout, Boolean(accessToken));

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        Policelogin,
        AdminLogin,
        logout,
        isLoading,
        accessToken,
        refreshToken: null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
