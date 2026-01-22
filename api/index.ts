import type { VercelRequest, VercelResponse } from "@vercel/node";

let cachedApp: ((req: any, res: any) => any) | null = null;
let cachedReady: Promise<any> | null = null;

async function loadServer() {
  if (cachedApp) {
    return { app: cachedApp, ready: cachedReady ?? Promise.resolve() };
  }

  if (process.env.NODE_ENV === "production") {
    const mod: any = await import("../dist/index.cjs");
    cachedApp = mod.default ?? mod.app ?? mod;
    cachedReady = mod.ready ?? Promise.resolve();
    return { app: cachedApp, ready: cachedReady };
  }

  const mod: any = await import("../server/index");
  cachedApp = mod.default ?? mod.app ?? mod;
  cachedReady = mod.ready ?? Promise.resolve();
  return { app: cachedApp, ready: cachedReady };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  const { app, ready } = await loadServer();
  await ready;
  return app(req as any, res as any);
}
