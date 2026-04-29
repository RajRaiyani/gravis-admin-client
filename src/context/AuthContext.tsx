/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, type ReactNode } from "react";

import type { AuthUser } from "@/types/auth.type";
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUserJson,
  setStoredAuth,
} from "@/utils/authStorage";

function getInitialAuthState(): { user: AuthUser | null; token: string | null } {
  if (typeof window === "undefined") {
    return { user: null, token: null };
  }
  const token = getStoredToken();
  if (!token) return { user: null, token: null };
  const raw = getStoredUserJson();
  let user: AuthUser | null = null;
  if (raw) {
    try {
      user = JSON.parse(raw) as AuthUser;
    } catch {
      user = null;
    }
  }
  return { user, token };
}

export interface AuthContextType {
  authUser: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (AuthUser: AuthUser, token: string, expiresAt: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const initialAuth = getInitialAuthState();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(initialAuth.user);
  const [token, setToken] = useState<string | null>(initialAuth.token);

  const isLoggedIn = !!token;

  function login(AuthUser: AuthUser, token: string, expiresAt: string) {
    setStoredAuth(JSON.stringify(AuthUser), token, expiresAt);
    setAuthUser(AuthUser);
    setToken(token);
  }

  function logout() {
    clearStoredAuth();
    setAuthUser(null);
    setToken(null);
  }

  const value: AuthContextType = {
    authUser,
    token,
    isLoggedIn,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
