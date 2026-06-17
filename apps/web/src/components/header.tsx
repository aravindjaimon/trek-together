import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@trek-together/ui/components/button";

import { signOut, useSession } from "@/lib/auth-client";

import { ModeToggle } from "./mode-toggle";

const NAV = [
  { to: "/plan", label: "Plan" },
  { to: "/explore", label: "Explore" },
  { to: "/routes", label: "My Routes" },
] as const;

export default function Header() {
  const { data: session } = useSession();
  const navigate = useNavigate();

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-4 py-2">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-lg font-semibold">
            Trek Together
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-muted-foreground hover:text-foreground [&.active]:text-foreground [&.active]:font-medium"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {session.user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/login" });
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
      <hr />
    </div>
  );
}
