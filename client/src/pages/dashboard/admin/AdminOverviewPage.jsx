import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Package, Lightbulb, DollarSign, TrendingUp, ShieldCheck, AlertTriangle, UserPlus, Star, Activity, } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Avatar } from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { formatCurrency } from "../../../lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, } from "recharts";
const monthlyData = [
    { month: "Jan", users: 120, products: 15, revenue: 45000 },
    { month: "Feb", users: 180, products: 22, revenue: 62000 },
    { month: "Mar", users: 250, products: 30, revenue: 85000 },
    { month: "Apr", users: 380, products: 42, revenue: 112000 },
    { month: "May", users: 520, products: 55, revenue: 148000 },
    { month: "Jun", users: 700, products: 68, revenue: 195000 },
];
export default function AdminOverviewPage() {
    const [students, setStudents] = useState([]);
    const [products, setProducts] = useState([]);
    const [platformStats, setPlatformStats] = useState({
        totalStudents: 0,
        totalProducts: 0,
        solutionsBuilt: 0,
        totalEarnings: 0,
        totalProjects: 0,
        activeContracts: 0,
    });
    useEffect(() => {
        fetch("/api/admin/stats")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
            if (data && data.stats) {
                setPlatformStats(data.stats);
            }
        })
            .catch(() => { });
        fetch("/api/admin/users")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
            if (data && data.users) {
                setStudents(data.users);
            }
        })
            .catch(() => { });
        fetch("/api/products")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
            if (data && data.products) {
                setProducts(data.products);
            }
        })
            .catch(() => { });
    }, []);
    const stats = [
        { label: "Total Students", value: platformStats.totalStudents, icon: Users, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30", change: "+12%" },
        { label: "Total Products", value: platformStats.totalProducts, icon: Package, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30", change: "+8%" },
        { label: "Solutions Built", value: platformStats.solutionsBuilt, icon: Lightbulb, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30", change: "+15%" },
        { label: "Total Earnings", value: formatCurrency(platformStats.totalEarnings), icon: DollarSign, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30", change: "+22%" },
        { label: "Total Projects", value: platformStats.totalProjects, icon: Activity, color: "text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30", change: "+6%" },
        { label: "Active Contracts", value: platformStats.activeContracts, icon: TrendingUp, color: "text-rose-500 bg-rose-100 dark:bg-rose-900/30", change: "+3%" },
    ];
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-[var(--muted-foreground)]">Platform overview and management</p>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => (<Card key={stat.label} className="card-hover">
            <CardContent className="p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} mb-3`}>
                <stat.icon className="h-4.5 w-4.5"/>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
                <span className="text-xs text-emerald-600 font-medium">{stat.change}</span>
              </div>
            </CardContent>
          </Card>))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader><CardTitle>User Growth</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)"/>
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)"/>
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.5rem" }}/>
                    <Area type="monotone" dataKey="users" stroke="var(--primary)" fill="url(#userGrad)" strokeWidth={2}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)"/>
                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `₹${v / 1000}K`}/>
                    <Tooltip formatter={(value) => [formatCurrency(Number(value) || 0), "Revenue"]} contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "0.5rem" }}/>
                    <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500"/> Pending Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
            { label: "Products pending review", count: 5, action: "Review", path: "/admin/products" },
            { label: "Dispute resolution", count: 2, action: "Resolve", path: "/admin/requests" },
            { label: "User verification", count: 8, action: "Verify", path: "/admin/users" },
            { label: "Payout requests", count: 3, action: "Process", path: "/admin/transactions" },
        ].map((item) => (<div key={item.label} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{item.label}</span>
                    <Badge variant="warning">{item.count}</Badge>
                  </div>
                  <Link to={item.path}>
                    <Button variant="outline" size="sm">{item.action}</Button>
                  </Link>
                </div>))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-blue-500"/> Recent Users</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {students.slice(0, 5).map((student) => (<div key={student.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--muted)] transition-colors">
                  <Avatar name={student.name} size="sm"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{student.name}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{student.studentProfile?.college || student.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {student.isVerified ? (<Badge variant="success" className="text-[10px]"><ShieldCheck className="h-3 w-3"/></Badge>) : (<Badge variant="secondary" className="text-[10px]">Pending</Badge>)}
                    <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400"/>
                      {student.studentProfile?.rating || 4.9}
                    </span>
                  </div>
                </div>))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="py-3 text-left text-[var(--muted-foreground)] font-medium">Product</th>
                    <th className="py-3 text-left text-[var(--muted-foreground)] font-medium">Seller</th>
                    <th className="py-3 text-right text-[var(--muted-foreground)] font-medium">Price</th>
                    <th className="py-3 text-right text-[var(--muted-foreground)] font-medium">Sales</th>
                    <th className="py-3 text-right text-[var(--muted-foreground)] font-medium">Rating</th>
                    <th className="py-3 text-right text-[var(--muted-foreground)] font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {products.slice(0, 6).map((p) => (<tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="py-3 font-medium">{p.name}</td>
                      <td className="py-3 text-[var(--muted-foreground)]">{p.seller?.name || "—"}</td>
                      <td className="py-3 text-right">{p.isFree ? "Free" : formatCurrency(p.price)}</td>
                      <td className="py-3 text-right">{p.salesCount}</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400"/>{p.rating}</span>
                      </td>
                      <td className="py-3 text-right">
                        <Badge variant={p.status === "published" ? "success" : "warning"} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>);
}
