import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";
import { Input } from "@trek-together/ui/components/input";
import { Label } from "@trek-together/ui/components/label";
import { useState } from "react";
import { toast } from "sonner";

import { signIn, signUp } from "@/lib/auth-client";

import { BrandMark } from "./brand-mark";

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
    <div className="mx-auto flex max-w-sm flex-col px-4 py-16">
      <div className="flex flex-col items-center text-center">
        <BrandMark className="size-9" />
        <h1 className="mt-4 text-xl font-bold tracking-tight">
          {isRegister ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground text-pretty">
          {isRegister
            ? "Save routes, share them by link, and pick up where you left off."
            : "Sign in to reach your saved routes and shared links."}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-7 space-y-4 rounded-lg border border-border bg-card p-6"
      >
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
        <Button type="submit" className="h-10 w-full text-sm" disabled={busy}>
          {busy ? "Just a moment…" : isRegister ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
