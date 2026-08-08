import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  return resend.emails.send({
    from: from || 'TradeDesk <noreply@timewarper.me>',
    to,
    subject,
    html,
  });
}

export function magicLinkEmail(name: string, link: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #1a1a1a; font-size: 24px;">Sign in to TradeDesk</h1>
      <p>Hi ${name || 'there'},</p>
      <p>Click the button below to sign in to your TradeDesk account. This link expires in 15 minutes.</p>
      <a href="${link}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Sign in to TradeDesk
      </a>
      <p style="color: #666; font-size: 14px;">If you didn't request this link, you can safely ignore this email.</p>
    </div>
  `;
}

export function invoiceReminderEmail(name: string, invoiceNumber: string, amount: string, dueDate: string, payLink?: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #1a1a1a; font-size: 24px;">Invoice Reminder</h1>
      <p>Hi ${name},</p>
      <p>This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong> is due on <strong>${dueDate}</strong>.</p>
      ${payLink ? `<a href="${payLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Pay Now</a>` : ''}
      <p style="color: #666; font-size: 14px;">If you've already paid, please disregard this reminder.</p>
    </div>
  `;
}

export function complianceReminderEmail(name: string, docTitle: string, expiryDate: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #1a1a1a; font-size: 24px;">Compliance Reminder</h1>
      <p>Hi ${name},</p>
      <p>Your <strong>${docTitle}</strong> is expiring on <strong>${expiryDate}</strong>.</p>
      <p>Please renew it before it expires to stay compliant.</p>
      <a href="https://tradedesk.timewarper.me/compliance" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">View Compliance Docs</a>
    </div>
  `;
}
