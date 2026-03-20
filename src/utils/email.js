const nodemailer = require("nodemailer");

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false, // TLS (STARTTLS) on port 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use Gmail App Password
    },
  });
};

// ─── Send Verification Email ────────────────────────────────────────────────────
const sendVerificationEmail = async (user, token) => {
  const transporter = createTransporter();
  const verifyURL = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"ScalableApp" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: "Verify Your Email Address",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome, ${user.name}! 👋</h2>
        <p style="color: #555; font-size: 16px;">
          Thank you for registering. Please verify your email address to activate your account.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyURL}"
             style="background-color: #4F46E5; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
            Verify Email
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          This link expires in <strong>24 hours</strong>. If you did not create an account, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px;">
          Or copy this link: <a href="${verifyURL}" style="color: #4F46E5;">${verifyURL}</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ─── Send Password Reset Email ──────────────────────────────────────────────────
const sendPasswordResetEmail = async (user, token) => {
  const transporter = createTransporter();
  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"ScalableApp" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Reset Your Password 🔒</h2>
        <p style="color: #555; font-size: 16px;">
          Hi ${user.name}, we received a request to reset your password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetURL}"
             style="background-color: #DC2626; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          This link expires in <strong>1 hour</strong>. If you did not request this, please ignore this email. Your password will remain unchanged.
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #aaa; font-size: 12px;">
          Or copy this link: <a href="${resetURL}" style="color: #DC2626;">${resetURL}</a>
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ─── Send Welcome Email (after verification) ───────────────────────────────────
const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"ScalableApp" <${process.env.EMAIL_FROM}>`,
    to: user.email,
    subject: "Welcome to ScalableApp! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">You're all set, ${user.name}! 🎉</h2>
        <p style="color: #555; font-size: 16px;">
          Your email has been verified successfully. You can now log in and start using the app.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/login"
             style="background-color: #16A34A; color: white; padding: 12px 30px;
                    text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
            Go to Login
          </a>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail };
