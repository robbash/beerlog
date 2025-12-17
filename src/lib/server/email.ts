import nodemailer from 'nodemailer';
import { Options } from 'nodemailer/lib/smtp-transport';

const options: Options = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT ? +process.env.SMTP_PORT : undefined,
  secure: (process.env.SMTP_SECURE ?? '').toLowerCase() !== 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export const transporter = nodemailer.createTransport(options);

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  from?: string,
  bcc?: string | string[],
) {
  from = from ?? process.env.SMTP_SENDER;

  return transporter.sendMail({
    from,
    envelope: { to, from },
    subject,
    text,
    bcc,
  });
}
