import type { APIContext } from "astro";
import type { z } from "zod";

import { AppError, isAppError } from "./error";

type ApiHandler = (context: APIContext) => Promise<Response>;
const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

function forwardedProtocol(request: Request): "http:" | "https:" | null {
  const value = request.headers.get("x-forwarded-proto")?.split(",", 1)[0]?.trim().toLowerCase();

  if (value === "http" || value === "https") {
    return `${value}:`;
  }

  return null;
}

export function requestOrigin(request: Request): string {
  const url = new URL(request.url);
  const protocol = forwardedProtocol(request);

  if (protocol) {
    url.protocol = protocol;
  }

  return url.origin;
}

export function requestUsesHttps(request: Request): boolean {
  return new URL(requestOrigin(request)).protocol === "https:";
}

export function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json; charset=utf-8" },
    status
  });
}

export async function readJson<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();

  if (contentType !== "application/json") {
    throw new AppError(
      "Request body must use application/json",
      "UNSUPPORTED_MEDIA_TYPE",
      415
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new AppError("Request body must be valid JSON", "INVALID_JSON");
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    const fields: Record<string, string> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path.length > 0 ? issue.path.map(String).join(".") : "_root";
      fields[field] ??= issue.message;
    }

    throw new AppError(
      parsed.error.issues[0]?.message ?? "Invalid request",
      "INVALID_INPUT",
      400,
      fields
    );
  }

  return parsed.data;
}

function requireSameOrigin(request: Request): void {
  if (safeMethods.has(request.method.toUpperCase())) {
    return;
  }

  const expectedOrigin = requestOrigin(request);
  const suppliedOrigin = request.headers.get("origin");

  if (suppliedOrigin !== expectedOrigin) {
    throw new AppError("Mutation request origin is not allowed", "INVALID_ORIGIN", 403);
  }
}

export function api(handler: ApiHandler): ApiHandler {
  return async (context) => {
    try {
      requireSameOrigin(context.request);
      return await handler(context);
    } catch (error) {
      if (isAppError(error)) {
        return json(
          {
            error: {
              code: error.code,
              ...(error.fields ? { fields: error.fields } : {}),
              message: error.message
            }
          },
          error.status
        );
      }

      console.error("Unhandled API error", error);
      return json(
        { error: { code: "INTERNAL_ERROR", message: "Не удалось выполнить запрос" } },
        500
      );
    }
  };
}
