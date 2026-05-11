import { useLoaderData, data, redirect } from "react-router";
import axios from "axios";
import { Button, Spinner } from "@heroui/react";
import { redirectToLogin } from "~/lib/auth";
import { buildSetCookieHeaders } from "~/lib/auth-cookies";
import { env } from "~/lib/env";
import type { Route } from "./+types/auth.callback";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return data({ error: "Missing authorization code" }, { status: 400 });
  }

  try {
    const response = await axios.post<OAuthTokenResponse>(
      `${env.api_proxy_target}/api/v1/api/user/oauth/token`,
      {
        code,
        clientId: "TCE-TEST-APP",
        redirectUri: `${url.origin}/auth/callback`,
        grantType: "authorization_code",
      },
    );

    const headers = buildSetCookieHeaders({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      expiresIn: response.data.expiresIn,
    });

    return redirect("/", { headers });
  } catch (err) {
    const message = axios.isAxiosError(err)
      ? err.response?.data?.message || "Token exchange failed"
      : "Something went wrong. Please try again.";

    return data({ error: message }, { status: 500 });
  }
}

export default function AuthCallback() {
  const loaderData = useLoaderData<typeof loader>();
  const error = loaderData && "error" in loaderData ? loaderData.error : null;

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          TCE Preview
        </span>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border/40 px-8 py-6">
          <p className="text-sm text-danger">{error}</p>
          <Button variant="secondary" onPress={redirectToLogin}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <span className="text-lg font-semibold tracking-tight text-foreground">
        TCE Preview
      </span>
      <div className="flex items-center gap-2 text-sm text-muted">
        <Spinner size="sm" />
        Logging you in...
      </div>
    </div>
  );
}
