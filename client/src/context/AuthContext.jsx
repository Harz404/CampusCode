import { apiFetch, apiJson } from "@/lib/api";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
const AuthContext = createContext({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => ({ success: false }),
    register: async () => ({ success: false }),
    changePassword: async () => ({ success: false }),
    logoutEverywhere: async () => ({ success: false }),
    logout: () => { },
    updateProfile: async () => ({ success: false }),
});
export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => localStorage.getItem("campuscode_jwt"));
    const [user, setUser] = useState(null);
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
                const res = await apiFetch("/api/auth/profile", {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                    },
                });
                if (res.ok) {
                    const userData = await res.json();
                    if (localStorage.getItem("campuscode_jwt") !== storedToken) return;
                    setUser(userData);
                    setToken(storedToken);
                }
                else if (res.status === 401 && localStorage.getItem("campuscode_jwt") === storedToken) {
                    // Token invalid or expired
                    localStorage.removeItem("campuscode_jwt");
                    setToken(null);
                    setUser(null);
                }
            }
            catch (error) {
                console.error("[Auth] Session restoration error:", error);
            }
            finally {
                setIsLoading(false);
            }
        }
        initAuth();
    }, []);
    const login = useCallback(async (email, password) => {
        try {
            const res = await apiFetch("/api/auth/login", {
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
        }
        catch (error) {
            console.error("[Auth] Login error:", error);
            return { success: false, error: "Network error during login" };
        }
    }, []);
    const register = useCallback(async (formData) => {
        try {
            const res = await apiFetch("/api/auth/register", {
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
        }
        catch (error) {
            console.error("[Auth] Registration error:", error);
            return { success: false, error: "Network error during registration" };
        }
    }, []);
    const [sessionError, setSessionError] = useState("");
    const clearSession = useCallback(() => {
        localStorage.removeItem("campuscode_jwt"); setToken(null); setUser(null);
    }, []);
    useEffect(() => {
        const expired = event => {
            if (event.detail === localStorage.getItem("campuscode_jwt")) clearSession();
        };
        const changed = event => {
            if (event.key === "campuscode_jwt") { setToken(null); setUser(null); }
        };
        window.addEventListener("campuscode:session-expired", expired);
        window.addEventListener("storage", changed);
        return () => { window.removeEventListener("campuscode:session-expired", expired); window.removeEventListener("storage", changed); };
    }, [clearSession]);
    const revokeSession = useCallback(async (everywhere = false) => {
        const savedToken = localStorage.getItem("campuscode_jwt");
        if (!savedToken) { clearSession(); return { success: true }; }
        setSessionError("");
        try {
            const res = await apiFetch(everywhere ? "/api/auth/logout-all" : "/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${savedToken}` } });
            if (!res.ok && res.status !== 401) throw new Error("Could not sign out securely. Please check your connection and try again.");
            if (savedToken === localStorage.getItem("campuscode_jwt")) clearSession();
            return { success: true };
        } catch (error) { setSessionError(error.message); return { success: false, error: error.message }; }
    }, [clearSession]);
    const logout = useCallback(() => revokeSession(false), [revokeSession]);
    const logoutEverywhere = useCallback(() => revokeSession(true), [revokeSession]);
    const changePassword = useCallback(async (currentPassword, newPassword) => {
        try {
            await apiJson("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) });
            clearSession(); return { success: true };
        } catch (error) { return { success: false, error: error.message }; }
    }, [clearSession]);
    const updateProfile = useCallback(async (updates) => {
        if (!token)
            return { success: false, error: "Not authenticated" };
        try {
            const res = await apiFetch("/api/auth/profile", {
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
        }
        catch (error) {
            console.error("[Auth] Update profile error:", error);
            return { success: false, error: "Network error" };
        }
    }, [token]);
    return (<AuthContext.Provider value={{
            user,
            token,
            isAuthenticated: !!user && !!token,
            isLoading,
            login,
            register,
            changePassword,
            logoutEverywhere,
            logout,
            updateProfile,
        }}>
      {sessionError && <div role="alert" className="fixed top-0 inset-x-0 z-[100] bg-[var(--card)] border-b border-red-500 p-3 text-red-500 text-sm">{sessionError}<button onClick={() => setSessionError("")} className="ml-3 underline">Dismiss</button></div>}
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    return useContext(AuthContext);
}
