const https = require("https");

// Send email via Resend API (no SMTP, no port issues)
const sendEmail = ({ to, subject, html }) => {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      from: `ScalableApp <onboarding@resend.dev>`,
      to,
      subject,
      html,
    });

    const options = {
      hostname: "api.resend.com",
      path: "/emails",
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Resend API error: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
};

// ─── Send Verification Email ────────────────────────────────────────────────────
const sendVerificationEmail = async (user, token) => {
  const verifyURL = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #080c14; color: #e8edf5;">
        <div style="background: #111827; border: 1px solid #1e2d45; border-radius: 12px; padding: 40px;">
          <div style="margin-bottom: 24px;">
            <span style="background: #0d1424; border: 1px solid #00d4ff; color: #00d4ff; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-family: monospace;">SB</span>
            <span style="margin-left: 10px; font-size: 15px; font-weight: 600;">ScalableApp</span>
          </div>
          <h2 style="color: #e8edf5; margin-bottom: 8px;">Welcome, ${user.name}! 👋</h2>
          <p style="color: #7a8fa8; font-size: 15px; margin-bottom: 32px;">
            Please verify your email address to activate your account.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyURL}"
               style="background: #00d4ff; color: #080c14; padding: 14px 32px;
                      text-decoration: none; border-radius: 8px; font-size: 15px;
                      font-weight: 700; display: inline-block;">
              Verify Email →
            </a>
          </div>
          <p style="color: #3d5268; font-size: 13px; margin-top: 32px;">
            This link expires in <strong style="color: #7a8fa8;">24 hours</strong>. 
            If you did not create an account, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #1e2d45; margin: 24px 0;" />
          <p style="color: #3d5268; font-size: 12px; word-break: break-all;">
            Or copy: <a href="${verifyURL}" style="color: #00d4ff;">${verifyURL}</a>
          </p>
        </div>
      </div>
    `,
  });
};

// ─── Send Password Reset Email ──────────────────────────────────────────────────
const sendPasswordResetEmail = async (user, token) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #080c14; color: #e8edf5;">
        <div style="background: #111827; border: 1px solid #1e2d45; border-radius: 12px; padding: 40px;">
          <div style="margin-bottom: 24px;">
            <span style="background: #0d1424; border: 1px solid #00d4ff; color: #00d4ff; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-family: monospace;">SB</span>
            <span style="margin-left: 10px; font-size: 15px; font-weight: 600;">ScalableApp</span>
          </div>
          <h2 style="color: #e8edf5; margin-bottom: 8px;">Reset Your Password 🔒</h2>
          <p style="color: #7a8fa8; font-size: 15px; margin-bottom: 32px;">
            Hi ${user.name}, we received a request to reset your password.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetURL}"
               style="background: #f87171; color: #fff; padding: 14px 32px;
                      text-decoration: none; border-radius: 8px; font-size: 15px;
                      font-weight: 700; display: inline-block;">
              Reset Password →
            </a>
          </div>
          <p style="color: #3d5268; font-size: 13px; margin-top: 32px;">
            This link expires in <strong style="color: #7a8fa8;">1 hour</strong>. 
            If you did not request this, please ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #1e2d45; margin: 24px 0;" />
          <p style="color: #3d5268; font-size: 12px; word-break: break-all;">
            Or copy: <a href="${resetURL}" style="color: #f87171;">${resetURL}</a>
          </p>
        </div>
      </div>
    `,
  });
};

// ─── Send Welcome Email ─────────────────────────────────────────────────────────
const sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: "Welcome to ScalableApp! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #080c14; color: #e8edf5;">
        <div style="background: #111827; border: 1px solid #1e2d45; border-radius: 12px; padding: 40px;">
          <div style="margin-bottom: 24px;">
            <span style="background: #0d1424; border: 1px solid #00d4ff; color: #00d4ff; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-family: monospace;">SB</span>
            <span style="margin-left: 10px; font-size: 15px; font-weight: 600;">ScalableApp</span>
          </div>
          <h2 style="color: #e8edf5; margin-bottom: 8px;">You're all set, ${user.name}! 🎉</h2>
          <p style="color: #7a8fa8; font-size: 15px; margin-bottom: 32px;">
            Your email has been verified. You can now log in and start using the app.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.CLIENT_URL}/login"
               style="background: #10b981; color: #fff; padding: 14px 32px;
                      text-decoration: none; border-radius: 8px; font-size: 15px;
                      font-weight: 700; display: inline-block;">
              Go to Login →
            </a>
          </div>
        </div>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };
