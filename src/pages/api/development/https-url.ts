import type { APIRoute } from "astro";

import { readDevelopmentHttpsUrl } from "@/server/development/https-tunnel";

export const GET: APIRoute = async () => {
  if (!import.meta.env.DEV) {
    return new Response(null, { status: 404 });
  }

  return Response.json(
    { url: await readDevelopmentHttpsUrl() },
    { headers: { "cache-control": "no-store" } }
  );
};
