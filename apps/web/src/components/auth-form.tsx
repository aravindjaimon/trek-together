import { Link, Navigate, useNavigate } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";
import { Input } from "@trek-together/ui/components/input";
import { Label } from "@trek-together/ui/components/label";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { signIn, signUp, useSession } from "@/lib/auth-client";

import { BrandMark } from "./brand-mark";

/** Shared register/login form (T7.2). On success, routes to the planner. */
export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  // Already signed in? No reason to be on an auth screen.
  if (!isPending && session) {
    return <Navigate to="/plan" />;
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_1fr]">
      <AuthPanel isRegister={isRegister} />

      <div className="flex flex-col justify-center px-5 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          {/* Brand shows here only on small screens (panel is hidden there). */}
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <BrandMark className="size-6" />
            <span className="text-[15px] font-semibold tracking-tight">
              Trek<span className="text-primary">Together</span>
            </span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-balance">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-pretty">
            {isRegister
              ? "Save routes, share them by link, and pick up planning where you left off."
              : "Sign in to reach your saved routes and shared links."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {isRegister && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Alex Rivera"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@trailmail.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder={isRegister ? "At least 8 characters" : "••••••••"}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {isRegister && (
                <p className="text-xs text-muted-foreground">Use 8 or more characters.</p>
              )}
            </div>
            <Button type="submit" className="h-10 w-full text-sm" disabled={busy}>
              {busy ? "Just a moment…" : isRegister ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
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

          <Link
            to="/explore"
            className="mt-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Just looking? Explore public routes
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Committed terrain panel — a drenched welcome moment (legitimate for onboarding).
 * Stays deep-forest in both themes; the route line draws itself in on mount.
 */
function AuthPanel({ isRegister }: { isRegister: boolean }) {
  return (
    <div
      className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12"
      style={{
        background:
          "radial-gradient(120% 120% at 15% 10%, oklch(0.32 0.06 165) 0%, oklch(0.2 0.03 168) 45%, oklch(0.16 0.02 170) 100%)",
      }}
    >
      {/* Contour + route motif */}
      <TerrainArt />
      {/* Scrim keeps the headline legible over the art. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, oklch(0.16 0.02 170 / 0.92) 0%, oklch(0.16 0.02 170 / 0.5) 34%, transparent 62%)",
        }}
      />

      <Link to="/" className="relative flex w-fit items-center gap-2 text-[oklch(0.96_0.02_150)]">
        <BrandMark className="size-7" />
        <span className="text-base font-semibold tracking-tight">
          Trek<span className="text-[oklch(0.8_0.13_150)]">Together</span>
        </span>
      </Link>

      <div className="relative max-w-md">
        <h2 className="text-3xl font-bold tracking-tight text-balance text-[oklch(0.97_0.01_150)]">
          {isRegister ? "Every trail, graded before you go." : "Pick up where the trail left off."}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-pretty text-[oklch(0.82_0.02_150)]">
          Draw a line on the map and Trek Together reads the real elevation along it — ascent,
          descent, a walking-time estimate, and an honest difficulty grade.
        </p>
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[oklch(0.8_0.02_150)]">
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[oklch(0.7_0.17_50)]" />
            Real elevation
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[oklch(0.7_0.17_50)]" />
            Honest time
          </span>
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[oklch(0.7_0.17_50)]" />
            Shenandoah grade
          </span>
        </div>
      </div>
    </div>
  );
}

function TerrainArt() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
      viewBox="0 0 400 600"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {/* Concentric contour rings */}
      {[210, 168, 126, 84].map((r, i) => (
        <circle
          key={r}
          cx="320"
          cy="150"
          r={r}
          stroke="oklch(0.8 0.13 150)"
          strokeOpacity={0.1 + i * 0.03}
          strokeWidth="1.25"
        />
      ))}
      {/* Route drawing across the terrain */}
      <polyline
        points="20,470 90,430 140,455 200,380 250,405 310,320 360,360"
        stroke="oklch(0.72 0.17 52)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-trail-draw"
        style={{ "--trail-len": "900" } as React.CSSProperties}
      />
      <circle cx="20" cy="470" r="5" fill="oklch(0.72 0.17 52)" />
      <circle cx="360" cy="360" r="5" fill="oklch(0.72 0.17 52)" />
    </svg>
  );
}
