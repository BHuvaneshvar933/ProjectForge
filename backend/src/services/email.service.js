import nodemailer from "nodemailer";
import { google } from "googleapis";

const OAuth2 = google.auth.OAuth2;
// Triggering nodemon restart

export const sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password/${resetToken}`;

  const message = {
    from: `"ProjectForge" <${process.env.OAUTH_EMAIL || "noreply@projectforge.com"}>`,
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
    if (process.env.OAUTH_CLIENT_ID && process.env.OAUTH_REFRESH_TOKEN) {
      // Use OAuth2
      const oauth2Client = new OAuth2(
        process.env.OAUTH_CLIENT_ID,
        process.env.OAUTH_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.OAUTH_REFRESH_TOKEN,
      });

      const accessToken = await new Promise((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
          if (err) {
            reject("Failed to create access token: " + err);
          }
          resolve(token);
        });
      });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.OAUTH_EMAIL,
          accessToken,
          clientId: process.env.OAUTH_CLIENT_ID,
          clientSecret: process.env.OAUTH_CLIENT_SECRET,
          refreshToken: process.env.OAUTH_REFRESH_TOKEN,
        },
      });

      await transporter.sendMail(message);
      console.log("✉️ Email sent successfully via Gmail OAuth2");
    } else {
      // Fallback to Ethereal
      console.warn("⚠️ No OAuth credentials found in .env. Falling back to Ethereal Email.");
      const testAccount = await nodemailer.createTestAccount();
      const transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail(message);
      console.log("✉️ Ethereal Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
