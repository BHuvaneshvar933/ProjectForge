import nodemailer from "nodemailer";

export const sendPasswordResetEmail = async (to, resetToken) => {
  if (!process.env.CLIENT_ORIGIN) {
    throw new Error("CLIENT_ORIGIN environment variable is not defined");
  }

  const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password/${resetToken}`;

  const message = {
    from: `"ProjectForge" <${process.env.EMAIL_USER || "noreply@projectforge.com"}>`,
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

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      // Use Nodemailer with Gmail SMTP and an App Password (never expires)
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        connectionTimeout: 8000, // Fail fast after 8 seconds
        socketTimeout: 8000,
      });

      await transporter.sendMail(message);
      console.log("✉️ Email sent successfully via Gmail SMTP");
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Missing EMAIL_USER and EMAIL_PASSWORD in .env for production emails");
      }
      
      // Fallback to Ethereal only in development
      console.warn("⚠️ No email credentials found in .env. Falling back to Ethereal Email.");
      
      // Wrap createTestAccount in a timeout because Ethereal frequently hangs on cloud providers
      const testAccount = await Promise.race([
        nodemailer.createTestAccount(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Ethereal API timed out (Render blocking)")), 8000))
      ]);
      
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
        connectionTimeout: 8000,
        socketTimeout: 8000,
      });

      const info = await transporter.sendMail(message);
      console.log("✉️ Ethereal Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
