import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { Route } from "./+types/root";
import "./app.css";
import "~/lib/axios-interceptors";

const queryClient = new QueryClient();

export async function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin;
  return Response.json({ origin });
}

export const meta: Route.MetaFunction = ({ data }) => {
  const loaderData = data as unknown as { origin: string } | null;
  const origin = loaderData?.origin || "";
  return [
    { title: "TCE Preview" },
    {
      name: "description",
      content: "Preview and manage TCE educational assets",
    },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "TCE Preview" },
    { property: "og:url", content: origin },
    { property: "og:title", content: "TCE Preview" },
    {
      property: "og:description",
      content: "Preview and manage TCE educational assets",
    },
    { property: "og:image", content: `${origin}/og-image.png` },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
  ];
};

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="flex max-w-lg flex-col items-center gap-3">
        <h1 className="text-4xl font-bold text-foreground">{message}</h1>
        <p className="text-base text-muted">{details}</p>
        {stack && (
          <pre className="mt-4 max-h-64 w-full overflow-auto rounded-lg border border-border/40 bg-muted/5 p-4 text-left text-xs text-muted">
            <code>{stack}</code>
          </pre>
        )}
        <a
          href="/"
          className="mt-4 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Go Home
        </a>
      </div>
    </main>
  );
}
