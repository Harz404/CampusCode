import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const location = useLocation();
    const publicBrowse = location.pathname === "/marketplace" || location.pathname.startsWith("/marketplace/") ||
        location.pathname === "/solutions" || (location.pathname.startsWith("/solutions/") && location.pathname !== "/solutions/post");
    if (publicBrowse) return <Outlet />;
    if (isLoading) return <p role="status" className="p-8">Loading your account…</p>;
    if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    if (location.pathname.startsWith("/admin") && user?.role !== "admin") return <Navigate to="/dashboard" replace />;
    return <Outlet />;
}
