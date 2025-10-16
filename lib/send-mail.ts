import nodemailer from "nodemailer";

export interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendOutlookMail(options: SendMailOptions) {
  const transporter = nodemailer.createTransport({
    host: "smart.iagentesmtp.com.br",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    ...options,
  });
}
