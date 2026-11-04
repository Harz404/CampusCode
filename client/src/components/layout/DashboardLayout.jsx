import React, { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Bell, Menu, X, Moon, Sun, LayoutDashboard, FolderKanban, CheckSquare, Store, Lightbulb, FileText, FileCheck, MessageSquare, Wallet, User, Star, Settings, PlusCircle, ShoppingBag, Users, Package, CreditCard, Tag, AlertTriangle, TrendingUp, LogOut, LogIn, UserPlus, } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { STUDENT_SIDEBAR_ITEMS, CLIENT_SIDEBAR_ITEMS, ADMIN_SIDEBAR_ITEMS } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/lib/user-store";
const iconMap = {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Store,
    Lightbulb,
    FileText,
    FileCheck,
    MessageSquare,
    Wallet,
    User,
    Star,
    Settings,
    PlusCircle,
    ShoppingBag,
    Users,
    Package,
    CreditCard,
    Tag,
    AlertTriangle,
    TrendingUp,
};
export function DashboardLayout({ children }) {
    const location = useLocation();
    const pathname = location.pathname;
    const { theme, setTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const { notifications } = useUserData();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const role = pathname.startsWith("/admin")
        ? "admin"
        : (user?.role || "student").toLowerCase();
    const isClient = role === "client";
    const sidebarItems = role === "admin"
        ? ADMIN_SIDEBAR_ITEMS
        : isClient
            ? CLIENT_SIDEBAR_ITEMS
            : STUDENT_SIDEBAR_ITEMS;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return (<div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 border-r border-[var(--border)] bg-[var(--sidebar-bg)] shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 h-16 px-6 border-b border-[var(--border)] shrink-0">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
              <Code2 className="h-4 w-4"/>
            </div>
            <span className="text-lg font-bold">
              Campus<span className="text-[var(--primary)]">Code</span>
            </span>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (<Link key={item.href} to={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"}`}>
                <Icon className="h-4.5 w-4.5 shrink-0"/>
                {item.label}
              </Link>);
        })}
        </nav>

        {/* User Card / Login CTA */}
        {isAuthenticated && user ? (<div className="p-3 border-t border-[var(--border)] space-y-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
              <Avatar fallback={user.name?.slice(0, 2).toUpperCase()} size="sm"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-[var(--muted-foreground)] truncate capitalize">
                  {user.role}
                </p>
              </div>
              <Link to="/settings" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] p-1">
                <Settings className="h-4 w-4"/>
              </Link>
            </div>
            <button onClick={() => logout()} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-colors cursor-pointer">
              <LogOut className="h-3.5 w-3.5"/>
              <span>Sign out</span>
            </button>
          </div>) : (<div className="p-3 border-t border-[var(--border)] space-y-2">
            <p className="text-xs text-[var(--muted-foreground)] px-1">
              Sign in to manage projects & earnings.
            </p>
            <div className="flex gap-2">
              <Link to="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" className="flex-1">
                <Button size="sm" className="w-full text-xs">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>)}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (<>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)}/>
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed left-0 top-0 bottom-0 z-50 w-64 border-r border-[var(--border)] bg-[var(--sidebar-bg)] lg:hidden flex flex-col">
              <div className="flex items-center justify-between h-16 px-6 border-b border-[var(--border)]">
                <Link to="/" className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
                    <Code2 className="h-4 w-4"/>
                  </div>
                  <span className="text-lg font-bold">
                    Campus<span className="text-[var(--primary)]">Code</span>
                  </span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5"/>
                </Button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {sidebarItems.map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard;
                const isActive = item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);
                return (<Link key={item.href} to={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"}`}>
                      <Icon className="h-4.5 w-4.5 shrink-0"/>
                      {item.label}
                    </Link>);
            })}
              </nav>

              {isAuthenticated && user ? (<div className="p-4 border-t border-[var(--border)] space-y-2">
                  <div className="flex items-center gap-3">
                    <Avatar fallback={user.name?.slice(0, 2).toUpperCase()} size="sm"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)] truncate capitalize">
                        {user.role}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => {
                    setSidebarOpen(false);
                    logout();
                }} className="w-full text-left text-xs text-red-500 py-1 cursor-pointer">
                    Sign out
                  </button>
                </div>) : (<div className="p-4 border-t border-[var(--border)] space-y-2">
                  <Link to="/login" onClick={() => setSidebarOpen(false)}>
                    <Button variant="outline" size="sm" className="w-full text-xs mb-2">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setSidebarOpen(false)}>
                    <Button size="sm" className="w-full text-xs">
                      Sign Up
                    </Button>
                  </Link>
                </div>)}
            </motion.aside>
          </>)}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--background)] shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden text-[var(--muted-foreground)] cursor-pointer" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5"/>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-[var(--muted-foreground)] cursor-pointer">
              <Sun className="h-4.5 w-4.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
              <Moon className="absolute h-4.5 w-4.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
            </Button>

            {isAuthenticated && user ? (<>
                <div className="relative">
                  <Button variant="ghost" size="icon" onClick={() => setNotifOpen(!notifOpen)} className="text-[var(--muted-foreground)] relative cursor-pointer">
                    <Bell className="h-4.5 w-4.5"/>
                    {unreadCount > 0 && (<span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-red-500"/>)}
                  </Button>
                  <AnimatePresence>
                    {notifOpen && (<motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} className="absolute right-0 mt-2 w-80 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg z-50 overflow-hidden">
                        <div className="p-4 border-b border-[var(--border)]">
                          <h3 className="font-semibold text-sm">Notifications</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length > 0 ? (notifications.map((n) => (<Link key={n.id} to={n.link || "#"} onClick={() => setNotifOpen(false)} className={`block p-3 border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)] transition-colors ${!n.isRead ? "bg-[var(--primary)]/5" : ""}`}>
                                <p className="text-sm font-medium">{n.title}</p>
                                <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                                  {n.message}
                                </p>
                              </Link>))) : (<div className="p-6 text-center text-xs text-[var(--muted-foreground)]">
                              No notifications yet
                            </div>)}
                        </div>
                      </motion.div>)}
                  </AnimatePresence>
                </div>

                <Link to="/settings" className="flex items-center gap-2 rounded-lg p-1 hover:bg-[var(--muted)] transition-colors">
                  <Avatar fallback={user.name?.slice(0, 2).toUpperCase()} size="sm"/>
                </Link>
              </>) : (<div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    <LogIn className="h-3.5 w-3.5 mr-1"/> Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="text-xs">
                    <UserPlus className="h-3.5 w-3.5 mr-1"/> Sign up
                  </Button>
                </Link>
              </div>)}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>);
}
export default DashboardLayout;
