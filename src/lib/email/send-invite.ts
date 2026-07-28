type SendInviteEmailArgs = {
  to: string;
  name: string;
  role: string;
  inviteUrl: string;
};

type SendResetEmailArgs = {
  to: string;
  name?: string | null;
  resetUrl: string;
};

function portalShell(args: {
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footnote?: string;
}) {
  const { heading, bodyHtml, ctaLabel, ctaUrl, footnote } = args;
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8ecf1;">
            <tr>
              <td style="background:#1a2744;padding:28px 32px;text-align:center;">
                <p style="margin:0;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#c5d0e0;">Neev Spaces</p>
                <h1 style="margin:10px 0 0;font-size:26px;line-height:1.2;color:#ffffff;font-weight:normal;">Management Portal</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 28px;">
                <h2 style="margin:0 0 12px;font-size:22px;color:#1a2744;font-weight:normal;">${heading}</h2>
                ${bodyHtml}
                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px auto 8px;">
                  <tr>
                    <td style="border-radius:10px;background:#1a2744;">
                      <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                        ${ctaLabel}
                      </a>
                    </td>
                  </tr>
                </table>
                ${
                  footnote
                    ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#64748b;">${footnote}</p>`
                    : ""
                }
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:18px 32px;border-top:1px solid #e8ecf1;text-align:center;">
                <p style="margin:0;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;">Neev Spaces · Management Portal</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function inviteEmailHtml(args: SendInviteEmailArgs) {
  const { name, role, inviteUrl } = args;
  return portalShell({
    heading: "You've been invited",
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
        Hi ${name || "there"}, you have been invited to the <strong style="color:#1a2744;">Neev Management Portal</strong> as a <strong>${role}</strong>.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
        Click the button below to accept the invitation and set your password.
      </p>
    `,
    ctaLabel: "Accept invitation &amp; set password",
    ctaUrl: inviteUrl,
    footnote:
      "If you were not expecting this invite, you can safely ignore this email.",
  });
}

function resetEmailHtml(args: SendResetEmailArgs) {
  const { name, resetUrl } = args;
  return portalShell({
    heading: "Reset your password",
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#475569;">
        Hi ${name || "there"}, we received a request to reset the password for your <strong style="color:#1a2744;">Neev Management Portal</strong> account.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
        Click the button below to choose a new password. This link expires in about an hour.
      </p>
    `,
    ctaLabel: "Reset password",
    ctaUrl: resetUrl,
    footnote:
      "If you did not request a password reset, you can safely ignore this email. Your password will stay the same.",
  });
}

export function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function sendViaResend(args: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY is not set. Add it to .env.local (or configure Supabase Auth SMTP).",
    };
  }

  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "Neev Spaces <noreply@neevspaces.net>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;
      return {
        ok: false,
        error:
          body?.message ||
          `Resend error ${res.status}. Check API key and verified domain.`,
      };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send email.",
    };
  }
}

/**
 * Send invite email via Resend API.
 * Requires RESEND_API_KEY + verified domain sender (RESEND_FROM_EMAIL).
 */
export async function sendInviteEmail(
  args: SendInviteEmailArgs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return sendViaResend({
    to: args.to,
    subject: "You're invited to Neev Management Portal",
    html: inviteEmailHtml(args),
  });
}

/**
 * Send password-reset email via Resend (same path as welcome invites).
 * No raw "copy this link" block — button only.
 */
export async function sendResetPasswordEmail(
  args: SendResetEmailArgs,
): Promise<{ ok: true } | { ok: false; error: string }> {
  return sendViaResend({
    to: args.to,
    subject: "Reset your Neev Management Portal password",
    html: resetEmailHtml(args),
  });
}
