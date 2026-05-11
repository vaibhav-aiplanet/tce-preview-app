import { PassThrough } from "node:stream";

import { createReadableStreamFromReadable } from "@react-router/node";
import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";
import type {
  AppLoadContext,
  EntryContext,
  ServerInstrumentation,
} from "react-router";
import { ServerRouter } from "react-router";

export const streamTimeout = 5_000;

export const instrumentations: ServerInstrumentation[] = [
  {
    handler: (h) => {
      h.instrument({
        request: async (next, { request }) => {
          const start = performance.now();
          const result = await next();
          const ms = (performance.now() - start).toFixed(0);
          const tag = result.status === "error" ? "ERR" : "ok";
          console.log(`[req ${tag}] ${request.method} ${request.url} ${ms}ms`);
        },
      });
    },
    route: (r) => {
      if (!r.path?.startsWith("_api/")) return;
      r.instrument({
        loader: async (next, info) => {
          const start = performance.now();
          const result = await next();
          const ms = (performance.now() - start).toFixed(0);
          const tag = result.status === "error" ? "ERR" : "ok";
          console.log(`[loader ${tag}] ${info.pattern} ${ms}ms`);
        },
        action: async (next, info) => {
          const start = performance.now();
          const result = await next();
          const ms = (performance.now() - start).toFixed(0);
          const tag = result.status === "error" ? "ERR" : "ok";
          console.log(`[action ${tag}] ${info.pattern} ${ms}ms`);
        },
      });
    },
  },
];

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
) {
  if (request.method.toUpperCase() === "HEAD") {
    return new Response(null, {
      status: responseStatusCode,
      headers: responseHeaders,
    });
  }

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    let userAgent = request.headers.get("user-agent");

    let readyOption: keyof RenderToPipeableStreamOptions =
      (userAgent && isbot(userAgent)) || routerContext.isSpaMode
        ? "onAllReady"
        : "onShellReady";

    let timeoutId: ReturnType<typeof setTimeout> | undefined = setTimeout(
      () => abort(),
      streamTimeout + 1000,
    );

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough({
            final(callback) {
              clearTimeout(timeoutId);
              timeoutId = undefined;
              callback();
            },
          });
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          pipe(body);

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );
  });
}
