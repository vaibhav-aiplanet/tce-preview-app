export function redirectToLogin() {
  const params = new URLSearchParams();
  params.set("client", "TCE-TEST-APP");
  params.set("redirectUri", `${window.location.origin}/auth/callback`);
  window.location.href = `${import.meta.env.VITE_LOGIN_BASE_URL}/#/login/?${params.toString()}`;
}
