import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { redirectToLogin } from "~/lib/auth";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("Missing authorization code");
      return;
    }

    const exchangeToken = async () => {
      try {
        const response = await axios.post<OAuthTokenResponse>(
          `${import.meta.env.VITE_API_URL}/v1/api/user/oauth/token`,
          {
            code,
            clientId: "TCE-TEST-APP",
            redirectUri: `${window.location.origin}/auth/callback`,
            grantType: "authorization_code",
          },
        );

        sessionStorage.setItem("token", response.data.accessToken);
        navigate("/");
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || "Token exchange failed");
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    };

    exchangeToken();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "12px",
        }}
      >
        <span style={{ color: "red" }}>{error}</span>
        <button
          onClick={redirectToLogin}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}
    >
      Logging in...
    </div>
  );
}
