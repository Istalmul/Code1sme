/**
 * Verification email delivery.
 *
 * With RESEND_API_KEY set the code is emailed. Without it the code is printed
 * to the server log so the flow stays testable in development — it is never
 * returned to the browser, which would defeat the point of verifying.
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

export async function sendCodeEmail({ to, code, purpose }: CodeEmail): Promise<void> {
  const { subject, line } = COPY[purpose];
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(
      `\n[piasowo] ${subject}\n[piasowo] to: ${to}\n[piasowo] code: ${code}\n` +
        `[piasowo] (set RESEND_API_KEY to send real email)\n`,
    );
    return;
  }

  const body = {
    from: process.env.EMAIL_FROM ?? "Piasowo <no-reply@piasowo.com>",
    to: [to],
    subject,
    text: `${line}\n\n${code}\n\nThis code expires in 10 minutes. If you did not request it, you can ignore this email.`,
  };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Surfaced as a generic failure to the user; the detail stays server-side.
    console.error("[piasowo] email delivery failed", response.status, await response.text());
    throw new Error("Could not send verification email.");
  }
}
