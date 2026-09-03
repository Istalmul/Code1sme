import nodemailer from "nodemailer";

/**
 * Verification email delivery.
 *
 * Three transports, chosen by what is configured: SMTP (works with a Gmail
 * app password or any provider), Resend, or a console fallback for local
 * development. The code is never returned to the browser under any of them —
 * that would defeat the point of proving the address is reachable.
 */

type CodeEmail = { to: string; code: string; purpose: "signup" | "password-reset" };

const COPY = {
  signup: {
    subject: "Your Piasowo verification code",
    line: "Enter this code to finish creating your Piasowo account.",
  },
  "password-reset": {
    subject: "Your Piasowo password reset code",
    line: "Enter this code to choose a new password for your Piasowo account.",
  },
} as const;

export type Transport = "smtp" | "resend" | "console";

export function emailTransport(): Transport {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) return "smtp";
  if (process.env.RESEND_API_KEY) return "resend";
  return "console";
}

function sender(): string {
  return (
    process.env.EMAIL_FROM ??
    process.env.SMTP_USER ??
    "Piasowo <no-reply@piasowo.com>"
  );
}

/**
 * Plain text alongside HTML: some clients strip the markup, and a verification
 * code that only exists inside a styled table is a code the user cannot read.
 */
function body(code: string, line: string) {
  const text = `${line}\n\n${code}\n\nThis code expires in 10 minutes. If you didn't request it, you can ignore this email.`;
  const html = `<!doctype html><html><body style="margin:0;padding:32px;background:#f7f8fa;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#11161f">
<table role="presentation" style="max-width:440px;margin:0 auto;background:#fff;border:1px solid #dfe3e9;border-radius:12px">
<tr><td style="padding:28px">
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4a5566">${line}</p>
<p style="margin:0;font-size:32px;font-weight:600;letter-spacing:0.16em;font-variant-numeric:tabular-nums">${code}</p>
<p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#636c7b">This code expires in 10 minutes. If you didn't request it, you can ignore this email.</p>
</td></tr></table></body></html>`;
  return { text, html };
}

async function sendViaSmtp(to: string, subject: string, content: ReturnType<typeof body>) {
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASSWORD! },
    // Without these a stalled or misconfigured mail server holds the sign-up
    // request open indefinitely; the user sees a spinner that never resolves.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  await transporter.sendMail({ from: sender(), to, subject, ...content });
}

async function sendViaResend(to: string, subject: string, content: ReturnType<typeof body>) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: sender(), to: [to], subject, ...content }),
  });
  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
}

export async function sendCodeEmail({ to, code, purpose }: CodeEmail): Promise<void> {
  const { subject, line } = COPY[purpose];
  const content = body(code, line);
  const transport = emailTransport();

  if (transport === "console") {
    console.info(
      `\n[piasowo] ${subject}\n[piasowo] to: ${to}\n[piasowo] code: ${code}\n` +
        `[piasowo] (no email transport configured — set SMTP_HOST/SMTP_USER/SMTP_PASSWORD or RESEND_API_KEY to send for real)\n`,
    );
    return;
  }

  try {
    if (transport === "smtp") await sendViaSmtp(to, subject, content);
    else await sendViaResend(to, subject, content);
  } catch (cause) {
    // The detail stays server-side; the caller turns this into a generic
    // message so a bad credential can't be probed from the sign-up form.
    console.error(`[piasowo] ${transport} delivery failed`, cause);
    throw new Error("Could not send verification email.");
  }
}
