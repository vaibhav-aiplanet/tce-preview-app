import { buildClearCookieHeaders } from "~/lib/auth-cookies";

export async function action() {
  return new Response(null, {
    status: 204,
    headers: buildClearCookieHeaders(),
  });
}
