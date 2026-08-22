const nodemailer = require("nodemailer");

const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for port 465
    family: 4,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

const FROM = process.env.MAIL_FROM || '"Grievance.io" <noreply@grievance.io>';

const sendMail = async (to, subject, html) => {
  try {
    const transporter = createTransport();
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[Mailer] Sent "${subject}" → ${to}`);
    return { success: true };
  } catch (error) {
    console.error("[Mailer] Error:", error.message);
    return { success: false, message: error.message };
  }
};

const sendPasswordResetEmail = async (email, name, otp) => {
  const html = `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px">
            <h2 style="color:#111;margin-bottom:8px">Password Reset OTP</h2>
            <p style="color:#555">Hello ${name || "User"},</p>
            <p style="color:#555">Use the OTP below to reset your password. It is valid for <strong>10 minutes</strong>.</p>
            <div style="font-size:2.5rem;letter-spacing:10px;font-weight:bold;color:#111;margin:24px 0;text-align:center;background:#f5f5f7;border-radius:12px;padding:16px">
                ${otp}
            </div>
            <p style="color:#888;font-size:13px">If you did not request a password reset, you can safely ignore this email.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#bbb;font-size:12px">Grievance.io — University Redressal System</p>
        </div>
    `;
  return sendMail(email, "Password Reset OTP – Grievance.io", html);
};

const sendResolutionEmail = async (
  studentEmail,
  studentName,
  caseId,
  subject,
  remark,
) => {
  const html = `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px">
            <h2 style="color:#111;margin-bottom:8px">Your Grievance Has Been Resolved</h2>
            <p style="color:#555">Dear ${studentName},</p>
            <p style="color:#555">Your grievance has been successfully resolved.</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0;font-size:14px">
                <tr>
                    <td style="padding:10px 12px;background:#f9f9f9;color:#555;font-weight:bold;width:40%">Case ID</td>
                    <td style="padding:10px 12px;background:#f9f9f9">${caseId}</td>
                </tr>
                <tr>
                    <td style="padding:10px 12px;color:#555;font-weight:bold">Subject</td>
                    <td style="padding:10px 12px">${subject}</td>
                </tr>
                <tr>
                    <td style="padding:10px 12px;background:#f9f9f9;color:#555;font-weight:bold">Resolution Note</td>
                    <td style="padding:10px 12px;background:#f9f9f9">${remark || "Your case has been resolved. Thank you for your patience."}</td>
                </tr>
            </table>
            <p style="color:#888;font-size:13px">Thank you for using Grievance.io.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#bbb;font-size:12px">Grievance.io — University Redressal System</p>
        </div>
    `;
  return sendMail(
    studentEmail,
    `Case #${caseId} Resolved – Grievance.io`,
    html,
  );
};

module.exports = { sendMail, sendPasswordResetEmail, sendResolutionEmail };
