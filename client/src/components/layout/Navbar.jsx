import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Search, Bell, Menu, X, Moon, Sun, ChevronDown, LayoutDashboard, LogIn, UserPlus, Lightbulb, Star, } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { SearchBar } from "@/components/shared/SearchBar";
import { NotificationCenter } from "@/components/shared/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/lib/user-store";
export function Navbar() {
    const location = useLocation();
    const pathname = location.pathname;
    const { theme, setTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const { notifications } = useUserData();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const displayName = user?.name || "Student Developer";
    const navLinks = [
        { href: "/#how-it-works", label: "How It Works", icon: Lightbulb },
        { href: "/#developers", label: "Developers", icon: Code2 },
        { href: "/#stories", label: "Success Stories", icon: Star },
    ];
    const isDashboard = pathname.startsWith("/dashboard") ||
        pathname.startsWith("/projects") ||
        pathname.startsWith("/contracts") ||
        pathname.startsWith("/messages") ||
        pathname.startsWith("/earnings") ||
        pathname.startsWith("/settings") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/proposals") ||
        pathname.startsWith("/sell") ||
        pathname.startsWith("/portfolio") ||
        pathname.startsWith("/reviews") ||
        pathname.startsWith("/tasks") ||
        pathname.startsWith("/marketplace") ||
        pathname.startsWith("/solutions");
    if (isDashboard)
        return null;
    return (<>
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
                <Code2 className="h-5 w-5"/>
              </div>
              <span className="text-xl font-bold tracking-tight hidden sm:block">
                Campus<span className="text-[var(--primary)]">Code</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (<a key={link.href} href={link.href} className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors">
                  {link.label}
                </a>))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="text-[var(--muted-foreground)] cursor-pointer">
                <Search className="h-5 w-5"/>
              </Button>

              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="text-[var(--muted-foreground)] cursor-pointer">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"/>
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"/>
              </Button>

              {isAuthenticated && user ? (<>
                  <Link to="/dashboard" className="hidden sm:inline-flex">
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs font-medium cursor-pointer">
                      <LayoutDashboard className="h-3.5 w-3.5"/>
                      Dashboard
                    </Button>
                  </Link>

                  <div className="relative">
                    <Button variant="ghost" size="icon" onClick={() => {
                setNotifOpen(!notifOpen);
                setUserMenuOpen(false);
            }} className="text-[var(--muted-foreground)] relative cursor-pointer">
                      <Bell className="h-5 w-5"/>
                      {unreadCount > 0 && (<span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {unreadCount}
                        </span>)}
                    </Button>
                    <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)}/>
                  </div>

                  <div className="relative">
                    <button onClick={() => {
                setUserMenuOpen(!userMenuOpen);
                setNotifOpen(false);
            }} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-[var(--muted)] transition-colors cursor-pointer">
                      <Avatar fallback={displayName.slice(0, 2).toUpperCase()} size="sm"/>
                      <ChevronDown className="h-3.5 w-3.5 text-[var(--muted-foreground)] hidden sm:block"/>
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (<motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }} className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg z-50">
                          <div className="p-3 border-b border-[var(--border)]">
                            <p className="font-semibold text-sm">{displayName}</p>
                            <p className="text-xs text-[var(--muted-foreground)] capitalize">
                              {user.role}
                            </p>
                          </div>
                          <div className="p-1">
                            {[
                    { label: "Dashboard", href: "/dashboard" },
                    { label: "Marketplace", href: "/marketplace" },
                    { label: "Solutions", href: "/solutions" },
                    { label: "Projects", href: "/projects" },
                    { label: "Settings", href: "/settings" },
                ].map((item) => (<Link key={item.href} to={item.href} onClick={() => setUserMenuOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-[var(--muted)] transition-colors">
                                {item.label}
                              </Link>))}
                          </div>
                          <div className="p-1 border-t border-[var(--border)]">
                            <button onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                }} className="w-full text-left px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer">
                              Sign out
                            </button>
                          </div>
                        </motion.div>)}
                    </AnimatePresence>
                  </div>
                </>) : (<div className="hidden sm:flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" className="cursor-pointer">
                      <LogIn className="h-4 w-4 mr-1.5"/> Sign in
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm" className="cursor-pointer">
                      <UserPlus className="h-4 w-4 mr-1.5"/> Sign up
                    </Button>
                  </Link>
                </div>)}

              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-[var(--muted-foreground)] cursor-pointer">
                {mobileOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden border-t border-[var(--border)] overflow-hidden">
              <div className="p-4 space-y-2">
                {navLinks.map((link) => (<a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[var(--muted)]">
                    <link.icon className="h-4 w-4 text-[var(--muted-foreground)]"/>
                    {link.label}
                  </a>))}

                {isAuthenticated && user ? (<div className="pt-2 border-t border-[var(--border)] space-y-1">
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-[var(--primary)]/10 text-[var(--primary)]">
                      <LayoutDashboard className="h-4 w-4"/>
                      Dashboard
                    </Link>
                  </div>) : (<div className="pt-2 border-t border-[var(--border)] flex gap-2">
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1">
                      <Button size="sm" className="w-full text-xs">
                        Sign Up
                      </Button>
                    </Link>
                  </div>)}
              </div>
            </motion.div>)}
        </AnimatePresence>
      </nav>

      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)}/>
    </>);
}
