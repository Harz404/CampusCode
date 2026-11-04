import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PasswordSecurity() {
    const { changePassword, logoutEverywhere } = useAuth();
    const navigate = useNavigate();
    const [current, setCurrent] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const submit = async event => {
        event.preventDefault();
        if (busy) return;
        if (password !== confirmation) { setError("New passwords do not match."); return; }
        setBusy(true); setError("");
        const result = await changePassword(current, password);
        setBusy(false);
        if (result.success) navigate("/login", { replace: true, state: { notice: "Password changed. All previous sessions have been revoked; sign in with your new password." } });
        else setError(result.error);
    };
    const revokeAll = async () => {
        if (busy) return;
        setBusy(true); setError("");
        const result = await logoutEverywhere();
        setBusy(false);
        if (result.success) navigate("/login", { replace: true, state: { notice: "You have been signed out on all devices." } });
        else setError(result.error);
    };
    return <Card>
        <CardHeader><CardTitle>Password & Security</CardTitle></CardHeader>
        <CardContent className="space-y-6">
            {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
            <form onSubmit={submit} className="space-y-4">
                <label className="block text-sm">Current password<Input type="password" autoComplete="current-password" required disabled={busy} value={current} onChange={event => setCurrent(event.target.value)} /></label>
                <label className="block text-sm">New password<Input type="password" autoComplete="new-password" minLength={8} required disabled={busy} value={password} onChange={event => setPassword(event.target.value)} /></label>
                <label className="block text-sm">Confirm new password<Input type="password" autoComplete="new-password" minLength={8} required disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
                <p className="text-xs text-[var(--muted-foreground)]">Use at least 8 characters, up to 72 UTF-8 bytes. Changing your password signs out every device.</p>
                <Button type="submit" disabled={busy}>Update Password</Button>
            </form>
            <div className="border-t border-[var(--border)] pt-4 space-y-2">
                <p className="text-sm">Revoke every active session, including this device.</p>
                <Button variant="outline" disabled={busy} onClick={revokeAll}>Sign Out Everywhere</Button>
            </div>
        </CardContent>
    </Card>;
}
