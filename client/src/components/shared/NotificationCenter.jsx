import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, MessageSquare, DollarSign, FileText, Star, Zap, ShoppingBag, AlertCircle, X, } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
const typeIcons = {
    proposal: FileText,
    contract: FileText,
    payment: DollarSign,
    review: Star,
    message: MessageSquare,
    system: AlertCircle,
    match: Zap,
    purchase: ShoppingBag,
};
const typeColors = {
    proposal: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
    contract: "text-purple-500 bg-purple-100 dark:bg-purple-900/30",
    payment: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30",
    review: "text-amber-500 bg-amber-100 dark:bg-amber-900/30",
    message: "text-sky-500 bg-sky-100 dark:bg-sky-900/30",
    system: "text-gray-500 bg-gray-100 dark:bg-gray-800/30",
    match: "text-orange-500 bg-orange-100 dark:bg-orange-900/30",
    purchase: "text-pink-500 bg-pink-100 dark:bg-pink-900/30",
};
export function NotificationCenter({ isOpen, onClose }) {
    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const markRead = (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    };
    const markAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    };
    return (<AnimatePresence>
      {isOpen && (<>
          <div className="fixed inset-0 z-40" onClick={onClose}/>
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 top-full mt-2 z-50 w-96 max-h-[480px] rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (<Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">{unreadCount}</Badge>)}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (<Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={markAllRead}>
                    <Check className="h-3 w-3"/> Mark all read
                  </Button>)}
                <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--muted)] transition-colors cursor-pointer">
                  <X className="h-4 w-4 text-[var(--muted-foreground)]"/>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (<div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30"/>
                  No notifications yet
                </div>) : (notifications.map((notif) => {
                const Icon = typeIcons[notif.type] || AlertCircle;
                return (<Link key={notif.id} to={notif.link || "#"} onClick={() => { markRead(notif.id); onClose(); }} className={`flex items-start gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--muted)]/50 ${!notif.isRead ? "bg-[var(--primary)]/5" : ""}`}>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5 ${typeColors[notif.type]}`}>
                        <Icon className="h-4 w-4"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={`text-sm truncate ${!notif.isRead ? "font-semibold" : "font-medium"}`}>{notif.title}</p>
                          {!notif.isRead && <span className="h-2 w-2 rounded-full bg-[var(--primary)] shrink-0"/>}
                        </div>
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-[var(--muted-foreground)] mt-1">{formatRelativeTime(notif.createdAt)}</p>
                      </div>
                    </Link>);
            }))}
            </div>
          </motion.div>
        </>)}
    </AnimatePresence>);
}
