export type ApiError = { error: string; field?: string };

/**
 * Thin wrapper so every form handles failure the same way: a message, and
 * optionally the field it belongs to.
 */
export async function post<T>(
  path: string,
  body: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string; field?: string }> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = (await response.json().catch(() => ({}))) as T & ApiError;
    if (!response.ok) {
      return {
        ok: false,
        error: payload.error ?? "Something went wrong. Please try again.",
        field: payload.field,
      };
    }
    return { ok: true, data: payload };
  } catch {
    return { ok: false, error: "Couldn't reach Piasowo. Check your connection and try again." };
  }
}
