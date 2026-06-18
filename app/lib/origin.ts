/**
 * We run behind a TLS-terminating reverse proxy and serve with
 * @react-router/serve, which does not enable Express "trust proxy". So the
 * request reaching the Node server is plain http, and `request.url` carries
 * that internal http:// scheme even when the browser reached us over https.
 *
 * Rebuild the public-facing origin from the proxy's X-Forwarded-* headers
 * (which the proxy sets), falling back to the request itself when there is no
 * proxy (e.g. local dev), so the scheme always reflects reality.
 */
export function getRequestOrigin(request: Request): string {
  const url = new URL(request.url);
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    url.protocol.replace(":", "");
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    request.headers.get("host") ||
    url.host;
  return `${proto}://${host}`;
}

/**
 * Browser-side origin, mirroring getRequestOrigin so the OAuth redirectUri the
 * client sends always matches the one the server computes. In production the
 * page is served over https, so window.location.origin is already https; we
 * only force-upgrade as a safeguard. localhost stays on http for local dev.
 */
export function getClientOrigin(): string {
  const { origin, protocol, host, hostname } = window.location;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocal || protocol === "https:") return origin;
  return `https://${host}`;
}
