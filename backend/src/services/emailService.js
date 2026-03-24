import { Resend } from "resend";
import { env } from "../config/env.js";

let resendClient = null;

function getResendClient() {
  if (!env.resendApiKey) {
    throw new Error("RESEND_API_KEY is missing");
  }

  if (!resendClient) {
    resendClient = new Resend(env.resendApiKey);
  }

  return resendClient;
}

export async function sendVerificationCodeEmail({ email, username, code }) {
  const resend = getResendClient();

  const result = await resend.emails.send({
    from: env.emailFrom,
    to: email,
    subject: `Your ScamShield Hub verification code: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #122014;">
        <h2>Verify your email</h2>
        <p>Hi ${username},</p>
        <p>Enter this verification code in ScamShield Hub to finish creating your account.</p>
        <div style="display:inline-block;padding:12px 16px;border-radius:16px;background:#eafff0;border:1px solid #79ff9f;font-size:28px;font-weight:800;letter-spacing:0.32em;color:#072210;">
          ${code}
        </div>
        <p>This code expires in 15 minutes.</p>
      </div>
    `,
  });

  if (result.error) {
    throw new Error(result.error.message || "Failed to send verification email");
  }

  return result.data;
}
