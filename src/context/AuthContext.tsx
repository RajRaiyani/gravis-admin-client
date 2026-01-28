/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, type ReactNode } from "react";

import type { AuthUser } from "@/types/auth.type";
import Cookies from "js-cookie";

export interface AuthContextType {
  authUser: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (AuthUser: AuthUser, token: string, expiresAt: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const defaultAuthUser = JSON.parse(Cookies.get("user") || "null");
const defaultAccessToken = Cookies.get("token") || null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(defaultAuthUser);
  const [token, setToken] = useState<string | null>(defaultAccessToken);

  const isLoggedIn = !!token;

  function login(AuthUser: AuthUser, token: string, expiresAt: string) {
    Cookies.set("user", JSON.stringify(AuthUser), {
      expires: new Date(expiresAt),
    });
    Cookies.set("token", token, { expires: new Date(expiresAt) });
    setAuthUser(AuthUser);
    setToken(token);
  }

  function logout() {
    Cookies.remove("user");
    Cookies.remove("token");
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
