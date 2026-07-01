import nodemailer from "nodemailer";
import { env } from "@/config/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.log("[mailer] SMTP not configured — skipping email to", opts.to);
    return false;
  }
  try {
    await t.sendMail({
      from: `"AgentVerse AI" <${env.SMTP_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    console.log("[mailer] ✅ Email sent to", opts.to);
    return true;
  } catch (err) {
    console.error("[mailer] ❌ Failed to send email:", err);
    return false;
  }
}

export function buildWelcomeEmail(opts: {
  name: string;
  planName: string;
  amount: number;
  paymentId: string;
  orderId: string;
  date: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Welcome to AgentVerse AI</title>
</head>
<body style="margin:0;padding:0;background:#0a0f1a;font-family:'Segoe UI',Arial,sans-serif;color:#e2e8f0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0f1a;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#0d1424;border:1px solid rgba(186,230,255,0.12);border-radius:2px;">

        <!-- Header -->
        <tr>
          <td style="padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <p style="margin:0;font-size:18px;font-weight:700;color:#bae6ff;letter-spacing:3px;text-transform:uppercase;">AGENTVERSE AI</p>
            <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:1px;">One Platform. Unlimited AI Agents.</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#fff;">
              🎉 Welcome aboard, ${opts.name.split(" ")[0]}!
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">
              Thank you for subscribing to <strong style="color:#bae6ff;">${opts.planName}</strong> on AgentVerse AI.
              Your subscription is now active and you have full access to your agent catalog.
            </p>

            <!-- Plan badge -->
            <div style="background:rgba(186,230,255,0.06);border:1px solid rgba(186,230,255,0.15);padding:20px 24px;margin-bottom:28px;border-radius:2px;">
              <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:2px;">Active Plan</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#bae6ff;">${opts.planName}</p>
            </div>

            <!-- Receipt table -->
            <p style="margin:0 0 12px;font-size:12px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:2px;">Payment Receipt</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.08);border-radius:2px;overflow:hidden;">
              ${[
                ["Date", opts.date],
                ["Amount Paid", `₹${opts.amount.toLocaleString("en-IN")}`],
                ["Payment ID", opts.paymentId],
                ["Order ID", opts.orderId],
              ].map(([label, value], i) => `
              <tr style="background:${i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"};">
                <td style="padding:12px 16px;font-size:13px;color:rgba(255,255,255,0.5);">${label}</td>
                <td style="padding:12px 16px;font-size:13px;color:#e2e8f0;text-align:right;font-family:monospace;">${value}</td>
              </tr>`).join("")}
            </table>

            <p style="margin:28px 0 24px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.7;">
              You can now access all your AI agents from the dashboard. If you have any questions or need help getting started,
              just reply to this email — we're here to help.
            </p>

            <!-- CTA -->
            <a href="${env.APP_URL}/dashboard" style="display:inline-block;background:rgba(186,230,255,0.1);border:1px solid rgba(186,230,255,0.3);color:#bae6ff;text-decoration:none;padding:12px 28px;font-size:13px;letter-spacing:1px;">
              Go to Dashboard →
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.6;">
              AgentVerse AI · ${env.APP_URL}<br/>
              This is an automated receipt. Please keep it for your records.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
