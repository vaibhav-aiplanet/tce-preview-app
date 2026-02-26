import axios from "axios";
import { env } from "./env";

export function redirectToLogin() {
  const params = new URLSearchParams();
  params.set("client", "TCE-TEST-APP");
  params.set("redirectUri", `${window.location.origin}/auth/callback`);
  window.location.href = `${env.login_url}/#/login/?${params.toString()}`;
}

export function logout() {
  sessionStorage.clear();
  redirectToLogin();
}

async function validateToken(): Promise<TokenValidateResponse> {
  const token = sessionStorage.getItem("token");
  const response = await axios.get<TokenValidateResponse>(
    `${env.api_url}/v1/api/user/oauth/token/validate`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  sessionStorage.setItem("profile", JSON.stringify(response.data.userInfo));
  return response.data;
}

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = sessionStorage.getItem("refreshToken");
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post<TokenRefreshResponse>(
    `${env.api_url}/v1/api/user/oauth/token/refresh`,
    { refresh_token: refreshToken },
  );

  sessionStorage.setItem("token", response.data.access_token);
  return response.data.access_token;
}

/**
 * Validates the stored access token on app load.
 * If invalid, attempts a refresh. If refresh fails, redirects to login.
 * Returns the validated user info on success.
 */
export async function ensureAuthenticated(): Promise<TokenValidateResponse> {
  const token = sessionStorage.getItem("token");
  if (!token) {
    redirectToLogin();
    // Return a never-resolving promise since we're navigating away
    return new Promise(() => {});
  }

  try {
    return await validateToken();
  } catch {
    // Token invalid — try refreshing
    try {
      await refreshAccessToken();
      return await validateToken();
    } catch {
      logout();
      return new Promise(() => {});
    }
  }
}
