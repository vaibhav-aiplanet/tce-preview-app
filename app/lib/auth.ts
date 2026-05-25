import { useRouteLoaderData } from "react-router";
import { env } from "./env";
import type { AuthedUser } from "./server-auth";

export type UserRole = "CONTENT_ADMIN" | "CONTENT_REVIEWER";

export const ALLOWED_ROLES: UserRole[] = ["CONTENT_ADMIN", "CONTENT_REVIEWER"];

type RootLoaderData = { origin: string; user: AuthedUser | null };

export function useUser(): AuthedUser | null {
  const data = useRouteLoaderData("root") as RootLoaderData | undefined;
  return data?.user ?? null;
}

export function useUserRole(): UserRole | null {
  const user = useUser();
  const role = user?.role;
  if (role === "CONTENT_ADMIN" || role === "CONTENT_REVIEWER") return role;
  return null;
}

export function redirectToLogin() {
  const params = new URLSearchParams();
  params.set("client", "TCE-TEST-APP");
  params.set("redirectUri", `${window.location.origin}/auth/callback`);
  window.location.href = `${env.login_url}/#/login/?${params.toString()}`;
}

export async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // best-effort: cookies may not clear if server unreachable; still redirect
  }
  // Land on the LMS login page with:
  //   - skipSso=true   -> LMS does NOT silently SSO the existing session
  //                        straight back into TCE (no interstitial loop)
  //   - client + redirectUri -> when the user manually re-submits the login
  //                        form, the LMS authenticate handler reads these
  //                        and bounces back to TCE with a fresh auth code,
  //                        so the user lands in TCE after re-logging in.
  // The LMS session itself is left intact.
  const params = new URLSearchParams();
  params.set("client", "TCE-TEST-APP");
  params.set("redirectUri", `${window.location.origin}/auth/callback`);
  params.set("skipSso", "true");
  window.location.href = `${env.login_url}/#/login/?${params.toString()}`;
}
