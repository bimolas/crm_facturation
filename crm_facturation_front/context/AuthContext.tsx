"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/utils/api";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId: number;
}

interface Company {
  id: number;
  name: string;
  ice: string;
  rc: string;
  taxId: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const profile = await api.get("/auth/profile");
          setUser(profile.user);
          setCompany(profile.company);
        } catch (error) {
          console.error("Failed to restore session", error);
          localStorage.removeItem("token");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: any) => {
    const response = await api.post("/auth/login", credentials);
    localStorage.setItem("token", response.access_token);
    setUser(response.user);
    setCompany(response.company);
    router.push("/dashboard");
  };

  const register = async (data: any) => {
    const response = await api.post("/auth/register", data);
    localStorage.setItem("token", response.access_token);
    setUser(response.user);
    setCompany(response.company);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCompany(null);
    router.push("/login");
  };

  // Protect /dashboard routes
  useEffect(() => {
    if (!isLoading && !user && pathname?.startsWith("/dashboard")) {
      router.push("/login");
    }
  }, [isLoading, user, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, company, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
