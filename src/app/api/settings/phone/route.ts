import { NextResponse } from "next/server";
import { z } from "zod";
import { fail, fromZod, tooMany } from "@/lib/auth/respond";
import { currentSession } from "@/lib/auth/session";
import { transaction } from "@/lib/auth/store";
import { clientIp, consume } from "@/lib/auth/rate-limit";
import {
  CODE_TTL_MS,
  MAX_RESENDS,
  RESEND_COOLDOWN_MS,
  checkCode,
  generateCode,
  hashCode,
  newChallengeId,
} from "@/lib/auth/codes";
import { channelConfigured, normalisePhone, sendCodeSms } from "@/lib/auth/sms";
import { codeField } from "@/lib/auth/schema";

/**
 * Proving a phone number, before it can send anything.
 *
 * The same code mechanics as email verification — hashed at rest, constant-time
 * compared, 10-minute expiry, capped attempts — because a number nobody proved
 * they control is a number outreach must never leave from.
 */

const startSchema = z.object({
  action: z.literal("start"),
  channel: z.enum(["sms", "whatsapp"]),
  phone: z.string().trim().min(5).max(24),
});

const confirmSchema = z.object({
  action: z.literal("confirm"),
  challengeId: z.string().min(1),
  code: codeField,
});

const bodySchema = z.union([startSchema, confirmSchema]);

export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return fail(401, "Sign in to continue.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fromZod(parsed.error);
  const body = parsed.data;

  if (body.action === "start") {
    const phone = normalisePhone(body.phone);
    if (!phone) {
      return fail(
        400,
        "Use the full international format, starting with + and your country code.",
        "phone",
      );
    }

    for (const [action, id] of [
      ["code:ip", clientIp(request)],
      ["resend:email", phone],
    ] as const) {
      const limit = await consume(action, id);
      if (!limit.allowed) return tooMany(limit.retryAfterSeconds);
    }

    const code = generateCode();
    const challengeId = newChallengeId();

    const cooling = await transaction((db) => {
      // One live challenge per number, and a cooldown so the endpoint can't be
      // used to text someone repeatedly.
      const existing = db.challenges.find((c) => c.purpose === "phone" && c.email === phone);
      if (existing && Date.now() - existing.lastSentAt < RESEND_COOLDOWN_MS) {
        return Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000);
      }
      if (existing && existing.resends >= MAX_RESENDS) return -1;

      db.challenges = db.challenges.filter((c) => !(c.purpose === "phone" && c.email === phone));
      db.challenges.push({
        id: challengeId,
        email: phone,
        purpose: "phone",
        channel: body.channel,
        userId: session.sub,
        codeHash: hashCode(code, phone),
        expiresAt: Date.now() + CODE_TTL_MS,
        attempts: 0,
        resends: (existing?.resends ?? 0) + (existing ? 1 : 0),
        lastSentAt: Date.now(),
      });
      return 0;
    });

    if (cooling === -1) return fail(429, "Too many codes sent to that number. Try again in an hour.");
    if (cooling > 0) return fail(429, `Wait ${cooling}s before requesting another code.`);

    try {
      await sendCodeSms({ to: phone, code, channel: body.channel });
    } catch {
      return fail(502, "We couldn't send that code. Check the number and try again.");
    }

    return NextResponse.json({
      challengeId,
      phone,
      // The UI says so plainly rather than leaving the user waiting for a text
      // that is only ever going to appear in a server log.
      delivered: channelConfigured(body.channel),
    });
  }

  const limit = await consume("code:ip", clientIp(request));
  if (!limit.allowed) return tooMany(limit.retryAfterSeconds);

  const outcome = await transaction((db) => {
    const challenge = db.challenges.find(
      (c) => c.id === body.challengeId && c.purpose === "phone",
    );
    if (!challenge || challenge.userId !== session.sub) return { kind: "missing" as const };

    const result = checkCode(challenge, body.code);
    if (!result.ok) return { kind: result.reason, remaining: result.remaining };

    const user = db.users.find((u) => u.id === session.sub);
    if (!user) return { kind: "missing" as const };

    const now = new Date().toISOString();
    const channel = challenge.channel ?? "sms";
    user.connections = {
      ...user.connections,
      [channel]: {
        address: challenge.email,
        connectedAt: now,
        verifiedAt: now,
        warmupStartedAt: user.connections?.[channel]?.warmupStartedAt ?? now,
      },
    };
    db.challenges = db.challenges.filter((c) => c.id !== challenge.id);
    return { kind: "verified" as const, channel, phone: challenge.email };
  });

  switch (outcome.kind) {
    case "missing":
      return fail(400, "This verification has expired. Start again.", "code");
    case "expired":
      return fail(410, "That code has expired. Send a new one.", "code");
    case "too-many-attempts":
      return fail(429, "Too many incorrect codes. Send a new one to continue.", "code");
    case "incorrect":
      return fail(
        400,
        outcome.remaining === 1
          ? "That code isn't right. 1 attempt left."
          : `That code isn't right. ${outcome.remaining} attempts left.`,
        "code",
      );
    case "verified":
      return NextResponse.json({ ok: true, channel: outcome.channel, phone: outcome.phone });
  }
}
