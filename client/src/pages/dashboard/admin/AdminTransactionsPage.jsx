import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { formatCurrency, formatRelativeTime } from "../../../lib/utils";
export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    useEffect(() => {
        apiFetch("/api/admin/transactions")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
            if (data && data.transactions)
                setTransactions(data.transactions);
        })
            .catch(() => { });
    }, []);
    const totalVolume = transactions.reduce((s, t) => s + t.amount, 0);
    const completed = transactions.filter((t) => t.status === "completed").length;
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Transactions</h1>
        <p className="text-[var(--muted-foreground)] mb-6">Platform financial overview</p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        {[
            { label: "Total Volume", value: formatCurrency(totalVolume), icon: DollarSign, color: "text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30" },
            { label: "Transactions", value: transactions.length, icon: TrendingUp, color: "text-blue-500 bg-blue-100 dark:bg-blue-900/30" },
            { label: "Completed", value: completed, icon: ArrowDownRight, color: "text-purple-500 bg-purple-100 dark:bg-purple-900/30" },
            { label: "Platform Earnings (10%)", value: formatCurrency(totalVolume * 0.1), icon: DollarSign, color: "text-amber-500 bg-amber-100 dark:bg-amber-900/30" },
        ].map((stat) => (<Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} mb-2`}>
                <stat.icon className="h-4.5 w-4.5"/>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{stat.label}</p>
            </CardContent>
          </Card>))}
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">ID</th>
                  <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Type</th>
                  <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Description</th>
                  <th className="py-3 px-4 text-right font-medium text-[var(--muted-foreground)]">Amount</th>
                  <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Status</th>
                  <th className="py-3 px-4 text-left font-medium text-[var(--muted-foreground)]">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (<tr key={tx.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted)]/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs">{tx.id}</td>
                    <td className="py-3 px-4">
                      <Badge variant={tx.type === "payment" ? "success" :
                tx.type === "payout" ? "default" :
                    tx.type === "commission" ? "warning" : "destructive"} className="capitalize">
                        {tx.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[var(--muted-foreground)]">{tx.description}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-semibold ${tx.type === "commission" || tx.type === "refund" ? "text-red-500" : "text-emerald-600"}`}>
                        {tx.type === "commission" || tx.type === "refund" ? "-" : "+"}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={tx.status === "completed" ? "success" : "warning"} className="text-[10px]">
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-[var(--muted-foreground)]">{formatRelativeTime(tx.createdAt)}</td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>);
}
