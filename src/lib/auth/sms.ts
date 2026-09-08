/**
 * Verification codes over SMS and WhatsApp, via Twilio.
 *
 * Twilio's REST API takes form-encoded bodies and HTTP basic auth. WhatsApp is
 * the same endpoint with `whatsapp:` prefixed on both numbers — which is why
 * one function covers both channels.
 *
 * Without credentials the code goes to the server log, exactly as email does,
 * so the flow stays testable without ever showing the code in the browser.
 */

export type SmsChannel = "sms" | "whatsapp";

export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_SMS_FROM || process.env.TWILIO_WHATSAPP_FROM),
  );
}

export function channelConfigured(channel: SmsChannel): boolean {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return false;
  return Boolean(channel === "sms" ? process.env.TWILIO_SMS_FROM : process.env.TWILIO_WHATSAPP_FROM);
}

/**
 * E.164: a leading + and 8-15 digits. Anything else is rejected before it
 * reaches Twilio, so the user gets a useful message rather than a 400.
 */
export function normalisePhone(input: string): string | null {
  const trimmed = input.replace(/[\s()\-.]/g, "");
  return /^\+[1-9]\d{7,14}$/.test(trimmed) ? trimmed : null;
}

/** Masks all but the last two digits, for confirmation text. */
export function maskPhone(phone: string): string {
  return phone.length <= 4 ? phone : `${phone.slice(0, 3)}${"•".repeat(Math.max(0, phone.length - 5))}${phone.slice(-2)}`;
}

export async function sendCodeSms({
  to,
  code,
  channel,
}: {
  to: string;
  code: string;
  channel: SmsChannel;
}): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = channel === "sms" ? process.env.TWILIO_SMS_FROM : process.env.TWILIO_WHATSAPP_FROM;

  const message = `${code} is your Piasowo verification code. It expires in 10 minutes.`;

  if (!sid || !token || !from) {
    console.info(
      `\n[piasowo] Piasowo verification code (${channel})\n[piasowo] to: ${to}\n` +
        `[piasowo] code: ${code}\n[piasowo] (set TWILIO_* to send for real)\n`,
    );
    return;
  }

  const prefix = channel === "whatsapp" ? "whatsapp:" : "";
  // Overridable so the request shape can be tested against a local stub.
  const baseUrl = process.env.TWILIO_BASE_URL ?? "https://api.twilio.com";
  const response = await fetch(
    `${baseUrl}/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: `${prefix}${to}`,
        From: `${prefix}${from}`,
        Body: message,
      }),
      signal: AbortSignal.timeout(20_000),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`[piasowo] Twilio ${channel} send failed`, response.status, detail.slice(0, 300));
    throw new Error("Could not send the verification code.");
  }
}
