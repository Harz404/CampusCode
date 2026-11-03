import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, StudentProfile } from "@/types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    college?: string;
    degree?: string;
    graduationYear?: number;
    skills?: string[];
    bio?: string;
    organization?: string;
    website?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  demoLogin: (role?: "student" | "client" | "admin") => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: {
    name?: string;
    avatar?: string;
    studentProfile?: Partial<StudentProfile>;
    organization?: string;
    website?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  demoLogin: async () => ({ success: false }),
  logout: () => {},
  updateProfile: async () => ({ success: false }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("campuscode_jwt"));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user session on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem("campuscode_jwt");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setToken(storedToken);
        } else {
          // Token invalid or expired
          localStorage.removeItem("campuscode_jwt");
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error("[Auth] Session restoration error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      localStorage.setItem("campuscode_jwt", data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("[Auth] Login error:", error);
      return { success: false, error: "Network error during login" };
    }
  }, []);

  const register = useCallback(async (formData: any) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      localStorage.setItem("campuscode_jwt", data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("[Auth] Registration error:", error);
      return { success: false, error: "Network error during registration" };
    }
  }, []);

  const demoLogin = useCallback(async (role: "student" | "client" | "admin" = "student") => {
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || "Demo login failed" };
      }

      localStorage.setItem("campuscode_jwt", data.token);
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      console.error("[Auth] Demo login error:", error);
      return { success: false, error: "Network error during demo login" };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("campuscode_jwt");
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (updates: any) => {
      if (!token) return { success: false, error: "Not authenticated" };

      try {
        const res = await fetch("/api/auth/profile", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        if (!res.ok) {
          const err = await res.json();
          return { success: false, error: err.error || "Failed to update profile" };
        }

        const updatedUser = await res.json();
        setUser(updatedUser);
        return { success: true };
      } catch (error) {
        console.error("[Auth] Update profile error:", error);
        return { success: false, error: "Network error" };
      }
    },
    [token]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        demoLogin,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

