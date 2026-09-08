/**
 * OpenRouter transport.
 *
 * OpenRouter exposes an OpenAI-compatible chat-completions endpoint, so the
 * system prompt is a message rather than a top-level field. Everything above
 * this module is provider-agnostic: swapping to a first-party SDK means
 * reimplementing this one function.
 */

/** Overridable so the request shape can be tested against a local stub. */
const BASE_URL = process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const ENDPOINT = `${BASE_URL}/chat/completions`;

/** Configurable, because OpenRouter fronts many models behind one key. */
export const DEFAULT_MODEL = "anthropic/claude-opus-5";

export function aiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function activeModel(): string {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}

export class AiUnavailable extends Error {}

export async function complete({
  system,
  user,
  maxTokens = 1200,
}: {
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AiUnavailable("OPENROUTER_API_KEY is not set.");

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // OpenRouter attributes usage with these; both are optional.
      "HTTP-Referer": process.env.APP_ORIGIN ?? "http://localhost:3000",
      "X-Title": "Piasowo",
    },
    body: JSON.stringify({
      model: activeModel(),
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    // Without this a hung upstream would hold the route open indefinitely.
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new AiUnavailable(`OpenRouter returned ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new AiUnavailable("OpenRouter returned no content.");
  return text;
}

/**
 * Models wrap JSON in prose or fences often enough that parsing has to be
 * defensive; a failure here falls back rather than surfacing a crash.
 */
export function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new AiUnavailable("No JSON object in the model's reply.");
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
