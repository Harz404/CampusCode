import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    return (<div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[var(--primary)] via-purple-600 to-cyan-500 items-center justify-center p-12">
        <div className="text-white max-w-md">
          <h1 className="text-4xl font-bold mb-4">Reset Your Password</h1>
          <p className="text-lg opacity-80">
            Enter your email and we'll send you instructions to get back into your account.
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-8">
            <ArrowLeft className="h-4 w-4"/> Back to Login
          </Link>

          {!sent ? (<Card>
              <CardContent className="p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 mb-6">
                  <Mail className="h-6 w-6 text-[var(--primary)]"/>
                </div>
                <h2 className="text-2xl font-bold mb-2">Forgot Password?</h2>
                <p className="text-[var(--muted-foreground)] text-sm mb-6">
                  No worries, enter your email and we'll send you reset instructions.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Email Address</label>
                    <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}/>
                  </div>
                  <Button className="w-full cursor-pointer" size="lg" onClick={() => setSent(true)}>
                    Send Reset Link
                  </Button>
                </div>

                <p className="text-center text-sm text-[var(--muted-foreground)] mt-6">
                  Remember your password?{" "}
                  <Link to="/login" className="text-[var(--primary)] font-medium hover:underline">
                    Log in
                  </Link>
                </p>
              </CardContent>
            </Card>) : (<Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400"/>
                </div>
                <h2 className="text-2xl font-bold mb-2">Check your email</h2>
                <p className="text-[var(--muted-foreground)] text-sm mb-2">
                  We sent a password reset link to
                </p>
                <p className="font-semibold mb-6">{email}</p>
                <Button variant="outline" className="w-full cursor-pointer" onClick={() => setSent(false)}>
                  Resend Email
                </Button>
              </CardContent>
            </Card>)}
        </motion.div>
      </div>
    </div>);
}
export default ForgotPasswordPage;
