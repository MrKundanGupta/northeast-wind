import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  // Cloudflare exposes env vars through runtime bindings, not process.env.
  // Keystatic reads from process.env, so we bridge the two here.
  const runtime = (context.locals as any).runtime;
  if (runtime?.env) {
    for (const [key, value] of Object.entries(runtime.env)) {
      if (typeof value === "string") {
        process.env[key] = value;
      }
    }
  }
  return next();
});
