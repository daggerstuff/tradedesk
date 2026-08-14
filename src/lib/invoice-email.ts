import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy');

interface Attachment {
  filename: string;
  content: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: Attachment[];
}

export async function sendEmailWithAttachments({ to, subject, html, from, attachments }: SendEmailParams) {
  return resend.emails.send({
    from: from || 'TradeDesk <noreply@timewarper.me>',
    to,
    subject,
    html,
    attachments,
  });
}

export function invoiceEmailHtml(invoiceNumber: string, amount: string, dueDate: string, customerName: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 24px; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #4f46e5; font-size: 24px; margin: 0;">TradeDesk</h1>
      </div>

      <h2 style="font-size: 22px; margin: 0 0 16px; color: #111827;">New Invoice</h2>

      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Hi ${customerName || 'there'},
      </p>

      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        You have a new invoice attached. Here's the summary:
      </p>

      <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Invoice #</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Due</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Due Date</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #111827;">${dueDate}</td>
          </tr>
        </table>
      </div>

      <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        A PDF copy of this invoice is attached to this email.
      </p>

      <p style="color: #9ca3af; font-size: 13px; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
        Sent via TradeDesk — Business Management for Contractors
      </p>
    </div>
  `;
}
