import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";

const criteria = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number",           test: (p: string) => /[0-9]/.test(p) },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  const passwordValid = criteria.every(c => c.test(password));
  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleGoogleSignUp = () => {
    window.location.href = "/oauth2/authorization/google";
  };

  const handleSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    if (!passwordValid || passwordMismatch) return;
    setError("");
    setBusy(true);
    try {
      const res = await registerUser({ email, password, username });
      const { id, email: e, username: u } = res.data;
      if (id && e && u) updateUser({ id, email: e, username: u });
      navigate("/", { replace: true });
    } catch (err) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      if (code === "EMAIL_ALREADY_EXISTS") {
        setError("An account with this email already exists.");
      } else if (code === "USERNAME_ALREADY_EXISTS") {
        setError("This username is already taken.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2">
      <div className="hidden md:block">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Sprout className="h-6 w-6" />
        </span>
        <h1 className="mt-6 font-display text-5xl font-semibold leading-tight tracking-tight">
          Plant your first
          <br />
          study seed.
        </h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Build decks, review cards, and let AI explain what you don't yet
          understand. Your garden starts here.
        </p>
      </div>

      <div className="card-shadow mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8">
        <h2 className="font-display text-2xl font-semibold">Create account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Free forever. No credit card needed.
        </p>

        <Button
          onClick={handleGoogleSignUp}
          variant="outline"
          className="mt-6 w-full"
          disabled={busy}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
          </svg>
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => { setPassword(e.target.value); setPasswordTouched(true); }}
            />
            {passwordTouched && (
              <ul className="mt-2 space-y-1">
                {criteria.map(c => {
                  const met = c.test(password);
                  return (
                    <li key={c.label} className={`flex items-center gap-1.5 text-xs ${met ? "text-green-600" : "text-muted-foreground"}`}>
                      {met ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                      {c.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            {passwordMismatch && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            type="submit"
            className="w-full"
            disabled={busy || !passwordValid || passwordMismatch}
          >
            {busy ? "Please wait…" : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
