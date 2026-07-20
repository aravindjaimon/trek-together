import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";

import { signOut, useSession } from "@/lib/auth-client";
import { persister, queryClient } from "@/utils/orpc";

import { BrandMark } from "./brand-mark";
import { ModeToggle } from "./mode-toggle";

const NAV = [
  { to: "/plan", label: "Plan" },
  { to: "/explore", label: "Explore" },
  { to: "/routes", label: "My Routes" },
] as const;

export default function Header() {
  const { data: session } = useSession();
  const navigate = useNavigate();
  // My Routes needs an account; guests see Plan + Explore only.
  const navItems = session ? NAV : NAV.filter((n) => n.to !== "/routes");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-sidebar/85 backdrop-blur-md supports-[backdrop-filter]:bg-sidebar/70">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-foreground"
          >
            <BrandMark className="size-6" />
            <span>
              Trek<span className="text-primary">Together</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="relative rounded-sm px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:text-primary [&.active>span]:scale-x-100"
              >
                {n.label}
                <span className="pointer-events-none absolute inset-x-2.5 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-200 ease-out" />
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {session ? (
            <div className="flex items-center gap-2.5">
              <span className="hidden max-w-[16ch] truncate text-sm text-muted-foreground md:inline">
                {session.user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  // Purge local caches even if the server sign-out fails —
                  // the local wipe IS the privacy guarantee (private routes must
                  // not outlive the session on a shared device, T10.13), so it
                  // must not be gated behind a network call that can reject.
                  try {
                    await signOut();
                  } finally {
                    queryClient.clear();
                    await persister.removeClient();
                    navigate({ to: "/login" });
                  }
                }}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Button size="sm" render={<Link to="/login">Sign in</Link>} />
          )}
        </div>
      </div>
      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 border-t border-border px-2 py-1 sm:hidden">
        {navItems.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex-1 rounded-sm px-2 py-1.5 text-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:bg-accent [&.active]:text-accent-foreground"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
