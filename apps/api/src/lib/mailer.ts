import { Resend } from "resend";
import { env } from "@/config/env";

// Lazy-init so we don't crash at startup if the key is missing
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}

// ─── Core send function ───────────────────────────────────────────────────────

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.log("[mailer] RESEND_API_KEY not set — skipping email to", opts.to);
    return false;
  }
  try {
    const { error } = await client.emails.send({
      from: env.EMAIL_FROM,
      to:   opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) {
      console.error("[mailer] ❌ Resend error:", error);
      return false;
    }
    console.log("[mailer] ✅ Email sent to", opts.to);
    return true;
  } catch (err) {
    console.error("[mailer] ❌ Failed to send email:", err);
    return false;
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────

const BASE_STYLE = `
  body { margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0; }
  table { border-collapse:collapse; }
  a { text-decoration:none; }
`;

function emailShell(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>AgentVerse AI</title>
  <style>${BASE_STYLE}</style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0a0f1a;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" role="presentation"
        style="max-width:520px;width:100%;background:#0d1424;border:1px solid rgba(186,230,255,0.12);">

        <!-- Header -->
        <tr>
          <td style="padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <p style="margin:0;font-size:13px;font-weight:700;color:#bae6ff;letter-spacing:4px;text-transform:uppercase;">
              AGENTVERSE AI
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px;">${body}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">
              AgentVerse AI &mdash; One Platform. Unlimited AI Agents.<br/>
              If you didn't request this email, you can safely ignore it.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export function buildOtpEmail(opts: { name: string; otp: string }): string {
  const firstName = opts.name.split(" ")[0];

  // Render each digit as an individual box
  const digitBoxes = opts.otp.split("").map(d => `
    <td style="padding:0 4px;">
      <div style="
        display:inline-block;
        width:44px;height:56px;line-height:56px;
        background:rgba(186,230,255,0.08);
        border:1px solid rgba(186,230,255,0.30);
        border-radius:6px;
        text-align:center;
        font-size:30px;font-weight:700;
        font-family:'Courier New',monospace;
        color:#bae6ff;
      ">${d}</div>
    </td>`).join("");

  const body = `
    <p style="margin:0 0 6px;font-size:21px;font-weight:700;color:#fff;">
      Your verification code
    </p>
    <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Hi ${firstName}, enter the code below to verify your email and activate your AgentVerse AI account.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 28px;">
      <tr>${digitBoxes}</tr>
    </table>

    <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.40);text-align:center;">
      This code expires in <strong style="color:rgba(255,255,255,0.60);">10 minutes</strong>.
    </p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.25);text-align:center;">
      Do not share this code with anyone.
    </p>
  `;
  return emailShell(body);
}

// ─── Password reset ───────────────────────────────────────────────────────────

export function buildPasswordResetEmail(opts: { name: string; resetUrl: string }): string {
  const firstName = opts.name.split(" ")[0];
  const body = `
    <p style="margin:0 0 6px;font-size:21px;font-weight:700;color:#fff;">Reset your password</p>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Hi ${firstName}, click the button below to set a new password.
      This link expires in <strong style="color:rgba(255,255,255,0.70);">2 hours</strong>.
    </p>
    <a href="${opts.resetUrl}"
      style="display:inline-block;background:rgba(186,230,255,0.10);border:1px solid rgba(186,230,255,0.30);
             color:#bae6ff;padding:12px 28px;font-size:13px;letter-spacing:1px;border-radius:2px;">
      Reset Password &rarr;
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.25);">
      Or copy this link into your browser:<br/>
      <span style="color:rgba(186,230,255,0.40);word-break:break-all;">${opts.resetUrl}</span>
    </p>
  `;
  return emailShell(body);
}

// ─── Payment receipt ──────────────────────────────────────────────────────────

export function buildWelcomeEmail(opts: {
  name: string;
  planName: string;
  amount: number;
  paymentId: string;
  orderId: string;
  date: string;
}): string {
  const firstName = opts.name.split(" ")[0];
  const rows = [
    ["Date",       opts.date],
    ["Amount Paid", `Rs. ${opts.amount.toLocaleString("en-IN")}`],
    ["Payment ID",  opts.paymentId],
    ["Order ID",    opts.orderId],
  ].map(([label, value], i) => `
    <tr style="background:${i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"};">
      <td style="padding:11px 14px;font-size:13px;color:rgba(255,255,255,0.50);">${label}</td>
      <td style="padding:11px 14px;font-size:13px;color:#e2e8f0;text-align:right;font-family:monospace;">${value}</td>
    </tr>`).join("");

  const body = `
    <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#fff;">
      Welcome aboard, ${firstName}!
    </p>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.6;">
      Your <strong style="color:#bae6ff;">${opts.planName}</strong> subscription is now active.
      You have full access to your AI agent catalog.
    </p>

    <!-- Plan badge -->
    <div style="background:rgba(186,230,255,0.06);border:1px solid rgba(186,230,255,0.15);
                padding:18px 22px;margin-bottom:24px;border-radius:2px;">
      <p style="margin:0 0 3px;font-size:10px;color:rgba(255,255,255,0.35);
                text-transform:uppercase;letter-spacing:2px;">Active Plan</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#bae6ff;">${opts.planName}</p>
    </div>

    <!-- Receipt -->
    <p style="margin:0 0 10px;font-size:11px;color:rgba(255,255,255,0.35);
              text-transform:uppercase;letter-spacing:2px;">Payment Receipt</p>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="border:1px solid rgba(255,255,255,0.08);margin-bottom:24px;">
      ${rows}
    </table>

    <a href="${env.APP_URL}/dashboard"
      style="display:inline-block;background:rgba(186,230,255,0.10);border:1px solid rgba(186,230,255,0.30);
             color:#bae6ff;padding:12px 28px;font-size:13px;letter-spacing:1px;border-radius:2px;">
      Go to Dashboard &rarr;
    </a>
  `;
  return emailShell(body);
}

// ─── Legacy — kept for backward compat ───────────────────────────────────────

export function buildVerificationEmail(opts: { name: string; verifyUrl: string }): string {
  return buildPasswordResetEmail({ name: opts.name, resetUrl: opts.verifyUrl });
}
