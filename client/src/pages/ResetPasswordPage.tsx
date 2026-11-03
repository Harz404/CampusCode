import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordPage() {
  const [done, setDone] = useState(false);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[var(--primary)] via-purple-600 to-cyan-500 items-center justify-center p-12">
        <div className="text-white max-w-md">
          <h1 className="text-4xl font-bold mb-4">Set New Password</h1>
          <p className="text-lg opacity-80">
            Choose a strong password to secure your CampusCode account.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {!done ? (
            <Card>
              <CardContent className="p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 mb-6">
                  <Lock className="h-6 w-6 text-[var(--primary)]" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Set new password</h2>
                <p className="text-[var(--muted-foreground)] text-sm mb-6">
                  Must be at least 8 characters.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">New Password</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]">Confirm Password</label>
                    <Input type="password" placeholder="••••••••" />
                  </div>

                  <div className="space-y-1.5 text-xs text-[var(--muted-foreground)]">
                    <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> At least 8 characters</p>
                    <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Contains a number</p>
                    <p className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Contains a special character</p>
                  </div>

                  <Button className="w-full cursor-pointer" size="lg" onClick={() => setDone(true)}>
                    Reset Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mx-auto mb-6">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Password reset successful</h2>
                <p className="text-[var(--muted-foreground)] text-sm mb-6">
                  Your password has been reset. You can now log in with your new credentials.
                </p>
                <Link to="/login">
                  <Button className="w-full cursor-pointer">Back to Login</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;

