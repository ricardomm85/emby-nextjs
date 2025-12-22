"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AuthCredentials } from "@/lib/types";

interface AuthContextType {
  credentials: AuthCredentials | null;
  isLoading: boolean;
  login: (host: string, token: string, userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEYS = {
  host: "emby_host",
  token: "emby_token",
  userId: "emby_user_id",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [credentials, setCredentials] = useState<AuthCredentials | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const host = localStorage.getItem(STORAGE_KEYS.host);
    const token = localStorage.getItem(STORAGE_KEYS.token);
    const userId = localStorage.getItem(STORAGE_KEYS.userId);

    if (host && token && userId) {
      setCredentials({ host, token, userId });
    }
    setIsLoading(false);
  }, []);

  const login = (host: string, token: string, userId: string) => {
    localStorage.setItem(STORAGE_KEYS.host, host);
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.userId, userId);
    setCredentials({ host, token, userId });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.host);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.userId);
    setCredentials(null);
  };

  return (
    <AuthContext.Provider value={{ credentials, isLoading, login, logout }}>
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
