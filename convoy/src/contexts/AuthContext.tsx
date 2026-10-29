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

// Decoded JWT payload (null when it cannot be read). Used only to read our
// own claims; the server still verifies every token's signature.
const tokenPayload = (token: string) => {
  try {
    return JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
  } catch {
    return null;
  }
};

// Seconds until a JWT expires (0 when it cannot be read).
const secondsUntilExpiry = (token: string) => {
  const payload = tokenPayload(token);
  return payload ? Math.max(payload.exp - Date.now() / 1000, 0) : 0;
};

// One-time value sent with each login attempt. The server echoes it inside
// the signed access token, so a replayed (old) login response is rejected.
const newLoginNonce = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

// Auth endpoints handle their own 401s; any other API 401 ends the session.
const SESSION_ENDPOINTS =
  /\/api\/auth\/(login|Policelogin|Adminlogin|refresh-token|logout|session|captcha|csrf-token)\b/;

const isSessionRejection = (url: string, status: number) =>
  status === 401 &&
  url.startsWith(`${API_BASE_URL}/api/`) &&
  !SESSION_ENDPOINTS.test(url);

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

  // Ask the server whether a token is valid before trusting it. The user
  // shown in the app comes from this response, never from a login response.
  const verifySession = async (token: string, expectedType?: AccountType) => {
    const response = await axios.get(`${API_BASE_URL}/api/auth/session`, {
      withCredentials: true,
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = response.data?.data;

    if (!data?.user || (expectedType && data.accountType !== expectedType)) {
      throw new Error("Session could not be verified");
    }
    return data as { accountType: AccountType; user: any };
  };

  const startSession = useCallback(
    (token: string, verified: { accountType: AccountType; user: any }) => {
      const sessionUser = toSessionUser(verified.accountType, verified.user);
      setUser(sessionUser);
      setAccessToken(token);
      return sessionUser;
    },
    [],
  );

  // Exchange the httpOnly refresh cookie for a new access token.
  const refreshSession = useCallback(async () => {
    try {
      const response = await postWithCsrf("refresh-token", {});
      const token = response.data?.data?.tokens?.accessToken;
      startSession(token, await verifySession(token));
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
      const loginNonce = newLoginNonce();
      const response = await postWithCsrf(path, { ...body, loginNonce });
      const result = response.data;

      if (result.success === false) {
        throw new Error(result.message || "Login failed");
      }

      // Reject a response that was not issued for this login attempt
      const token = result.data?.tokens?.accessToken;
      const payload = token ? tokenPayload(token) : null;
      if (!payload || payload.ln !== loginNonce || payload.typ !== type) {
        throw new Error("Login could not be verified. Please try again.");
      }

      // The server must confirm the session before any page is shown
      const verified = await verifySession(token, type);

      if (type === "admin" && verified.user.role !== "admin") {
        throw new Error("Unauthorized admin access");
      }

      startSession(token, verified);
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

  // If the server rejects the token on any API call (revoked, expired or
  // replayed session), end the session at once instead of showing a page
  // without data.
  const sessionActive = useRef(false);
  sessionActive.current = Boolean(accessToken);

  useEffect(() => {
    const endRejectedSession = () => {
      if (!sessionActive.current) return;
      sessionActive.current = false;
      clearSession();
      navigate("/", { replace: true });
    };

    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const url = error.config?.url || "";
        if (isSessionRejection(url, error.response?.status)) {
          endRejectedSession();
        }
        return Promise.reject(error);
      },
    );

    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const response = await originalFetch(input, init);
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if (isSessionRejection(url, response.status)) {
        endRejectedSession();
      }
      return response;
    };

    return () => {
      axios.interceptors.response.eject(interceptor);
      window.fetch = originalFetch;
    };
  }, [clearSession, navigate]);

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
