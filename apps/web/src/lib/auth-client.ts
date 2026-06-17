import { env } from "@trek-together/env/web";
import { createAuthClient } from "better-auth/react";

/**
 * Better-Auth browser client (T7.1). Points at the server origin; the client
 * appends the default `/api/auth` base path. Cookies flow because the server
 * sets them and requests are same-site in dev / credentialed in prod.
 */
export const authClient = createAuthClient({
  baseURL: env.VITE_SERVER_URL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
