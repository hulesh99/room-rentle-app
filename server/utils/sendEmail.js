import nodemailer from 'nodemailer';

export const isEmailConfigured = () =>
  Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const getTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isEmailConfigured()) {
    console.warn(`[email] Skipping "${subject}" to ${to} — EMAIL_USER/EMAIL_PASS not configured`);
    return null;
  }

  const transporter = getTransporter();
  return transporter.sendMail({
    from: `"RoomRental" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

export default sendEmail;
