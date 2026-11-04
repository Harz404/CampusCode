import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet as WalletIcon, TrendingUp, Clock, Check, Loader2, X, Smartphone, Building2, AlertCircle, Filter, } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input, Label } from "../../components/ui/input";
import { formatCurrency, formatRelativeTime } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { useUserData } from "../../lib/user-store";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
export default function EarningsPage() {
    const { user } = useAuth();
    const { stats, contracts } = useUserData();
    const totalEarned = stats.totalEarnings || 0;
    const pendingAmount = contracts
        .filter((c) => c.status === "active")
        .reduce((sum, c) => sum + (c.studentEarnings || 0), 0);
    const [availableBalance, setAvailableBalance] = useState(Math.max(0, totalEarned - pendingAmount));
    const [transactionList, setTransactionList] = useState([]);
    const [filterType, setFilterType] = useState("all");
    // Payout Modal State
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [payoutMethod, setPayoutMethod] = useState("upi");
    const [upiId, setUpiId] = useState(user?.studentProfile?.linkedin ? "student@upi" : "developer@okaxis");
    const [accountNumber, setAccountNumber] = useState("");
    const [ifscCode, setIfscCode] = useState("");
    const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
    const [withdrawSuccess, setWithdrawSuccess] = useState(false);
    const [withdrawError, setWithdrawError] = useState("");
    useEffect(() => {
        fetch("/api/payments/transactions")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
            if (data && data.transactions) {
                setTransactionList(data.transactions);
            }
        })
            .catch(() => { });
    }, []);
    const earningsChartData = [
        { month: "Jan", earnings: 4500 },
        { month: "Feb", earnings: 12000 },
        { month: "Mar", earnings: 19500 },
        { month: "Apr", earnings: 28000 },
        { month: "May", earnings: 34000 },
        { month: "Jun", earnings: 39000 },
        { month: "Jul", earnings: 42000 },
        { month: "Aug", earnings: totalEarned },
    ];
    const handleWithdrawSubmit = async (e) => {
        e.preventDefault();
        const amount = Number(withdrawAmount);
        if (isNaN(amount) || amount <= 0) {
            setWithdrawError("Please enter a valid amount to withdraw.");
            return;
        }
        if (amount > availableBalance) {
            setWithdrawError(`Amount exceeds your available balance (${formatCurrency(availableBalance)}).`);
            return;
        }
        if (payoutMethod === "upi" && !upiId.trim()) {
            setWithdrawError("Please enter your UPI ID.");
            return;
        }
        if (payoutMethod === "bank" && (!accountNumber.trim() || !ifscCode.trim())) {
            setWithdrawError("Please enter your Bank Account Number and IFSC Code.");
            return;
        }
        setIsProcessingWithdraw(true);
        setWithdrawError("");
        try {
            const res = await fetch("/api/payments/payout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount,
                    method: payoutMethod,
                    details: payoutMethod === "upi" ? { upiId } : { accountNumber, ifscCode },
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Payout request failed");
            }
            setAvailableBalance((prev) => prev - amount);
            const newTx = {
                id: `tx_${Date.now()}`,
                userId: user?.id || "u1",
                amount,
                type: "payout",
                status: "completed",
                description: `Payout to ${payoutMethod === "upi" ? `UPI (${upiId})` : `Bank (••••${accountNumber.slice(-4)})`}`,
                createdAt: new Date().toISOString(),
            };
            setTransactionList((prev) => [newTx, ...prev]);
            setWithdrawSuccess(true);
        }
        catch (err) {
            setWithdrawError(err instanceof Error ? err.message : "Payout failed. Please try again.");
        }
        finally {
            setIsProcessingWithdraw(false);
        }
    };
    const filteredTransactions = transactionList.filter((tx) => {
        if (filterType === "all")
            return true;
        if (filterType === "payout")
            return tx.type === "payout";
        if (filterType === "payment")
            return tx.type === "payment";
        return true;
    });
    return (<div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold mb-1">Earnings & Wallet</h1>
        <p className="text-[var(--muted-foreground)]">Track your software sales, milestone payouts, and withdrawal balances.</p>
      </motion.div>

      {/* Wallet Cards */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3 opacity-90">
              <WalletIcon className="h-5 w-5"/>
              <span className="text-sm font-medium">Available Balance</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(availableBalance)}</p>
            <Button size="sm" disabled={availableBalance === 0} onClick={() => {
            setWithdrawSuccess(false);
            setWithdrawAmount("");
            setWithdrawError("");
            setIsWithdrawOpen(true);
        }} className="mt-4 bg-white/20 hover:bg-white/30 text-white border-0 disabled:opacity-50 font-semibold cursor-pointer">
              Withdraw Funds
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3 text-[var(--muted-foreground)]">
              <Clock className="h-5 w-5 text-amber-500"/>
              <span className="text-sm font-medium">Pending Escrow</span>
            </div>
            <p className="text-3xl font-bold text-[var(--foreground)]">{formatCurrency(pendingAmount)}</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-2">Held securely in milestone escrow</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3 text-[var(--muted-foreground)]">
              <TrendingUp className="h-5 w-5 text-emerald-500"/>
              <span className="text-sm font-medium">Total Earned</span>
            </div>
            <p className="text-3xl font-bold text-[var(--foreground)]">{formatCurrency(totalEarned)}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">90% net creator royalty</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Earnings Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={earningsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)"/>
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => `₹${v}`}/>
                  <Tooltip formatter={(value) => [formatCurrency(Number(value) || 0), "Earnings"]} contentStyle={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            fontSize: "0.875rem",
        }}/>
                  <Area type="monotone" dataKey="earnings" stroke="var(--primary)" strokeWidth={2} fill="url(#earnGrad)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions History Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold">Transaction History</h2>
            <p className="text-xs text-[var(--muted-foreground)]">Complete record of your marketplace sales, milestone releases, and payouts</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[var(--muted-foreground)]"/>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="text-xs rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 custom-select cursor-pointer">
              <option value="all">All Transactions</option>
              <option value="payment">Earnings & Sales</option>
              <option value="payout">Withdrawals</option>
            </select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/40 text-xs font-semibold text-[var(--muted-foreground)]">
                    <th className="py-3 px-4 text-left">Transaction ID</th>
                    <th className="py-3 px-4 text-left">Type</th>
                    <th className="py-3 px-4 text-left">Description</th>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredTransactions.map((tx) => {
            const isCredit = tx.type === "payment";
            return (<tr key={tx.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs text-[var(--muted-foreground)]">
                          {tx.id}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={isCredit ? "success" : "secondary"} className="text-[10px] uppercase font-bold">
                            {tx.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs font-medium">
                          {tx.description}
                        </td>
                        <td className="py-3 px-4 text-xs text-[var(--muted-foreground)]">
                          {formatRelativeTime(tx.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-xs">
                          <span className={isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}>
                            {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="success" className="text-[10px]">
                            {tx.status}
                          </Badge>
                        </td>
                      </tr>);
        })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* WITHDRAW MODAL */}
      <AnimatePresence>
        {isWithdrawOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <h3 className="text-lg font-bold">Withdraw Funds</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Available: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(availableBalance)}</strong>
                  </p>
                </div>
                <button onClick={() => setIsWithdrawOpen(false)} className="p-1 rounded hover:bg-[var(--muted)] cursor-pointer">
                  <X className="h-4 w-4"/>
                </button>
              </div>

              {withdrawSuccess ? (<div className="text-center py-6 space-y-4">
                  <div className="h-14 w-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-7 w-7"/>
                  </div>
                  <h4 className="text-lg font-bold">Payout Requested!</h4>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Your withdrawal of <strong className="text-[var(--foreground)]">{formatCurrency(Number(withdrawAmount))}</strong> has been initiated to your {payoutMethod.toUpperCase()} destination.
                  </p>
                  <Button className="w-full" onClick={() => setIsWithdrawOpen(false)}>
                    Done
                  </Button>
                </div>) : (<form onSubmit={handleWithdrawSubmit} className="space-y-4">
                  {withdrawError && (<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0"/>
                      <span>{withdrawError}</span>
                    </div>)}

                  <div>
                    <Label className="text-xs font-semibold mb-1 block">Withdrawal Amount (₹) *</Label>
                    <Input type="number" min="100" max={availableBalance} placeholder="e.g. 5000" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required/>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold block">Payout Method</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setPayoutMethod("upi")} className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${payoutMethod === "upi"
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                    : "border-[var(--border)] text-[var(--muted-foreground)]"}`}>
                        <Smartphone className="h-4 w-4"/>
                        <span className="text-xs">UPI ID / VPA</span>
                      </button>
                      <button type="button" onClick={() => setPayoutMethod("bank")} className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 ${payoutMethod === "bank"
                    ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] font-semibold"
                    : "border-[var(--border)] text-[var(--muted-foreground)]"}`}>
                        <Building2 className="h-4 w-4"/>
                        <span className="text-xs">Bank Transfer</span>
                      </button>
                    </div>
                  </div>

                  {payoutMethod === "upi" ? (<div>
                      <Label className="text-xs font-semibold mb-1 block">UPI ID *</Label>
                      <Input placeholder="yourname@okhdfcbank" value={upiId} onChange={(e) => setUpiId(e.target.value)} required/>
                    </div>) : (<div className="space-y-3">
                      <div>
                        <Label className="text-xs font-semibold mb-1 block">Bank Account Number *</Label>
                        <Input placeholder="0123456789012" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required/>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold mb-1 block">IFSC Code *</Label>
                        <Input placeholder="HDFC0001234" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required/>
                      </div>
                    </div>)}

                  <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
                    <Button type="button" variant="outline" onClick={() => setIsWithdrawOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isProcessingWithdraw} className="cursor-pointer">
                      {isProcessingWithdraw ? (<>
                          <Loader2 className="h-4 w-4 animate-spin mr-1.5"/> Processing...
                        </>) : ("Confirm Withdrawal")}
                    </Button>
                  </div>
                </form>)}
            </motion.div>
          </div>)}
      </AnimatePresence>
    </div>);
}
