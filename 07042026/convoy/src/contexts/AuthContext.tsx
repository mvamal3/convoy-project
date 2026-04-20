import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

  logout: () => void;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedAccessToken) setAccessToken(storedAccessToken);
    if (storedRefreshToken) setRefreshToken(storedRefreshToken);

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string, captcha: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        {
          email,
          password,
          captcha,
        },
        {
          withCredentials: true, // ✅ same as credentials: "include"
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      // ✅ Axios already parses JSON
      const result = response.data;
      //console.log("result", result);

      // ❌ Handle backend error properly (same logic)
      if (result.success === false) {
        throw new Error(result.message || "Login failed");
      }

      const regUser = result.data.user;
      const tokens = result.data.tokens;

      const newUser = {
        id: regUser.id,
        name: regUser.name || regUser.email.split("@")[0],
        email: regUser.email,
        role: regUser.role,
        usertype: regUser.usertype,
        orgName: regUser.orgName,
      };

      setUser(newUser);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);

      localStorage.setItem("user", JSON.stringify(newUser));
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);

      return result;
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
      throw error; // 🔥 pass real message to UI
    } finally {
      setIsLoading(false);
    }
  };

  const Policelogin = async (
    email: string,
    password: string,
    captcha: string,
  ) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/Policelogin`,
        {
          email,
          password,
          captcha,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = response.data;

      if (result.success === false) {
        throw new Error(result.message || "Login failed");
      }

      const regUser = result.data.user;
      const tokens = result.data.tokens;

      const Policeuser = {
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

      setUser(Policeuser);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);

      localStorage.setItem("user", JSON.stringify(Policeuser));
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);

      return result;
    } catch (error: any) {
      console.error(
        "Police login error:",
        error.response?.data || error.message,
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const AdminLogin = async (
    userid: string,
    password: string,
    captcha: string,
  ) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/Adminlogin`,
        {
          userid,
          password,
          captcha,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = response.data;

      if (result.success === false) {
        throw new Error(result.message || "Admin login failed");
      }

      const regUser = result.data.user;
      const tokens = result.data.tokens;

      if (regUser.role !== "admin") {
        throw new Error("Unauthorized admin access");
      }

      const adminUser = {
        id: regUser.id,
        name: regUser.email,
        email: regUser.email,
        role: regUser.role,
        usertype: regUser.usertype,
      };

      setUser(adminUser);
      setAccessToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);

      localStorage.setItem("user", JSON.stringify(adminUser));
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);

      return result;
    } catch (error: any) {
      console.error(
        "Admin login error:",
        error.response?.data || error.message,
      );
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/logout`,
        {},
        { withCredentials: true },
      );
    } catch (e) {}

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    localStorage.clear();
    sessionStorage.clear();

    navigate("/", { replace: true });
  };

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
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
