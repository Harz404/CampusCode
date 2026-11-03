import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Ban, CheckCircle2, Check } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Avatar } from "../../../components/ui/avatar";
import { Input } from "../../../components/ui/input";
import { formatDate } from "../../../lib/utils";
import type { User } from "../../../types";

export default function AdminUsersPage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.users) setUserList(data.users);
      })
      .catch(() => {});
  }, []);

  const handleVerifyUser = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: true }),
      });
    } catch {}

    setUserList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isVerified: true } : u))
    );
    setActionNotice("Student developer verified successfully!");
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleToggleSuspend = async (userId: string) => {
    const userToUpdate = userList.find((u) => u.id === userId);
    const nextState = !userToUpdate?.isVerified;

    try {
      await fetch(`/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: nextState }),
      });
    } catch {}

    setUserList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isVerified: nextState } : u))
    );
    setActionNotice("User status updated.");
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filtered = userList.filter(
    (u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">User Management & Verification</h1>
        <p className="text-[var(--muted-foreground)]">Verify student credentials, manage developer profiles, and moderate accounts</p>
      </motion.div>

      {actionNotice && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
          <Check className="h-4 w-4" /> {actionNotice}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
        <Input placeholder="Search users by name or email..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30 text-xs text-[var(--muted-foreground)]">
                  <th className="py-3 px-4 text-left font-semibold">User</th>
                  <th className="py-3 px-4 text-left font-semibold">Role</th>
                  <th className="py-3 px-4 text-left font-semibold">Verification</th>
                  <th className="py-3 px-4 text-left font-semibold">College / Org</th>
                  <th className="py-3 px-4 text-left font-semibold">Joined</th>
                  <th className="py-3 px-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} size="sm" />
                        <div>
                          <p className="font-semibold text-xs text-[var(--foreground)]">{user.name}</p>
                          <p className="text-[11px] text-[var(--muted-foreground)]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="capitalize text-[10px]">{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      {user.isVerified ? (
                        <Badge variant="success" className="text-[10px]"><ShieldCheck className="h-3 w-3 mr-1" />Verified</Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px]">Pending Verification</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-[var(--muted-foreground)]">{user.studentProfile?.college || user.clientProfile?.organization || "—"}</td>
                    <td className="py-3 px-4 text-xs text-[var(--muted-foreground)]">{formatDate(user.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Link to={`/portfolio/${user.studentProfile?.portfolioUrl || user.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs h-7">View</Button>
                        </Link>
                        {!user.isVerified ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyUser(user.id)}
                            className="text-xs h-7 text-emerald-600 border-emerald-300 dark:border-emerald-900/50 hover:bg-emerald-50 cursor-pointer"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Verify Badge
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleSuspend(user.id)}
                            className="text-xs h-7 text-red-500 hover:bg-red-50 cursor-pointer"
                            title="Toggle suspension"
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" /> Revoke
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

