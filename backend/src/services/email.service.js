import nodemailer from "nodemailer";

export const sendPasswordResetEmail = async (to, resetToken) => {
  let transporter;

  if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
    // Use Real SMTP credentials if provided
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Fallback to Ethereal Email for testing
    console.warn("⚠️ No SMTP credentials found in .env. Falling back to Ethereal Email for testing.");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password/${resetToken}`;

  const message = {
    from: `"ProjectForge" <noreply@projectforge.com>`,
    to,
    subject: "Password Reset Request",
    text: `You requested a password reset. Please click the following link to reset your password: \n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Please click the button below to reset your password.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  const info = await transporter.sendMail(message);

  if (!process.env.SMTP_EMAIL) {
    console.log("✉️ Ethereal Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
};
