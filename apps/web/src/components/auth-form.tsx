import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";
import { Input } from "@trek-together/ui/components/input";
import { Label } from "@trek-together/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";

import { signIn, signUp } from "@/lib/auth-client";

/** Shared register/login form (T7.2). On success, routes to the planner. */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const result = isRegister
      ? await signUp.email({ name, email, password })
      : await signIn.email({ email, password });
    setBusy(false);

    if (result.error) {
      toast.error(result.error.message ?? "Authentication failed");
      return;
    }
    toast.success(isRegister ? "Account created" : "Welcome back");
    navigate({ to: "/plan" });
  }

  return (
    <div className="container mx-auto flex max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold tracking-tight">
        {isRegister ? "Create your account" : "Sign in"}
      </h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {isRegister && (
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "…" : isRegister ? "Create account" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link to="/login" className="text-foreground underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link to="/register" className="text-foreground underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
