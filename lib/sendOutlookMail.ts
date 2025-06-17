import nodemailer from "nodemailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendOutlookMail(options: SendMailOptions) {
  const transporter = nodemailer.createTransport({
    host: "smtp.office365.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.OUTLOOK_USER,
      pass: process.env.OUTLOOK_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.OUTLOOK_USER,
    ...options,
  });
}
