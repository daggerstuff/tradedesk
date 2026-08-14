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

export function welcomeEmail(name: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #1a1a1a; font-size: 24px;">Welcome to TradeDesk!</h1>
      <p>Hi ${name || 'there'},</p>
      <p>Your account is ready. Here's how to get started:</p>
      <ul style="padding-left: 20px; line-height: 1.8;">
        <li>Add your first customer</li>
        <li>Create and send an invoice</li>
        <li>Set up invoice reminders to get paid faster</li>
        <li>Track compliance documents</li>
      </ul>
      <a href="https://tradedesk.timewarper.me/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Go to Dashboard
      </a>
      <p style="color: #666; font-size: 14px;">Questions? Reply to this email — we're happy to help.</p>
    </div>
  `;
}

export function inviteEmail(inviteLink: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #1a1a1a; font-size: 24px;">You've been invited to TradeDesk</h1>
      <p>Someone invited you to join their team on TradeDesk. Click below to accept:</p>
      <a href="${inviteLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Join Team
      </a>
      <p style="color: #666; font-size: 14px;">If you don't have an account yet, you'll create one during signup.</p>
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

export function leadWelcomeEmail(name: string): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="text-align:center;margin-bottom:24px"><h1 style="color:#4f46e5;margin:0">TradeDesk</h1></div><div style="background:#f9fafb;border-radius:8px;padding:24px"><h2 style="margin-top:0;color:#111827">Hi ${name}!</h2><p>Thanks for your interest in TradeDesk. We're building the simplest business management tool for contractors.</p><p>Here's what you can do right now:</p><ul style="padding-left:20px;line-height:1.8"><li><strong>Send invoices</strong> and get paid online</li><li><strong>Automate reminders</strong> so you stop chasing payments</li><li><strong>Track expenses</strong> and maximize tax deductions</li><li><strong>Stay compliant</strong> with automated expiry alerts</li></ul><div style="text-align:center;margin:24px 0"><a href="${process.env.NEXT_PUBLIC_APP_URL}/signup" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Create Your Free Account</a></div><p style="color:#6b7280;font-size:14px">Questions? Just reply to this email.</p></div></body></html>`;
}

export function leadDripEmail(name: string, day: number): string {
  const content: Record<number, { title: string; body: string; cta: string }> = {
    2: { title: 'How contractors get paid 3x faster', body: 'TradeDesk users average 16 days to get paid vs. the industry average of 45. Automated reminders that feel personal, not robotic.', cta: 'See how it works' },
    5: { title: 'Tax deductions contractors miss', body: 'Vehicle mileage, home office, tools, insurance — most contractors leave $3,000-$8,000 on the table. TradeDesk tracks it all.', cta: 'Start tracking expenses' },
    9: { title: 'Your compliance deadlines are coming', body: 'Miss a license renewal and you could be unable to pull permits. TradeDesk alerts you 30 days before anything expires.', cta: 'Try compliance tracking' },
  };
  const c = content[day] || content[2];
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px"><div style="text-align:center;margin-bottom:24px"><h1 style="color:#4f46e5;margin:0">TradeDesk</h1></div><div style="background:#f9fafb;border-radius:8px;padding:24px"><h2 style="margin-top:0;color:#111827">${c.title}</h2><p>Hi ${name},</p><p>${c.body}</p><div style="text-align:center;margin:24px 0"><a href="${process.env.NEXT_PUBLIC_APP_URL}/signup" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">${c.cta}</a></div><p style="color:#6b7280;font-size:14px"><a href="${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe" style="color:#6b7280">Unsubscribe</a></p></div></body></html>`;
}

export function referralRewardEarnedEmail(
  referrerName: string,
  refereeName: string,
  rewardMonths: number,
  refereeDiscount: number,
  dashboardUrl: string
): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 50%; width: 64px; height: 64px; align-items: center; justify-content: center;">
          <span style="font-size: 28px;">🎁</span>
        </div>
      </div>
      <h1 style="color: #1a1a1a; font-size: 24px; text-align: center;">You Earned a Reward!</h1>
      <p>Hi ${referrerName},</p>
      <p><strong>${refereeName}</strong> just subscribed using your referral code! 🎉</p>
      <div style="background: #faf5ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #7c3aed; font-weight: 600;">YOUR REWARD</p>
        <p style="margin: 0; font-size: 28px; font-weight: 800; color: #5b21b6;">${rewardMonths} free month${rewardMonths > 1 ? 's' : ''} added to your account</p>
      </div>
      <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #166534; font-weight: 600;">THEIR REWARD</p>
        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #15803d;">${refereeDiscount}% off their first 3 months</p>
      </div>
      <p style="color: #666; font-size: 14px;">Your free months will be automatically applied to your next billing cycle.</p>
      <a href="${dashboardUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">View Dashboard</a>
      <p style="color: #666; font-size: 12px; text-align: center;">Keep sharing to earn more free months!</p>
    </div>
  `;
}

export function referralSignupEmail(
  refereeName: string,
  referrerName: string,
  discountPercent: number,
  signupUrl: string
): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; width: 64px; height: 64px;">
          <span style="font-size: 28px;">🎉</span>
        </div>
      </div>
      <h1 style="color: #1a1a1a; font-size: 24px; text-align: center;">Welcome to TradeDesk!</h1>
      <p>Hi ${refereeName},</p>
      <p><strong>${referrerName}</strong> invited you to join TradeDesk. As a thank you, you get a special welcome offer:</p>
      <div style="background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0 0 8px; font-size: 14px; color: #166534; font-weight: 600;">YOUR WELCOME OFFER</p>
        <p style="margin: 0; font-size: 28px; font-weight: 800; color: #15803d;">${discountPercent}% off your first 3 months</p>
      </div>
      <p>Use this link to create your account and claim your discount:</p>
      <a href="${signupUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">Claim Your Discount</a>
      <p style="color: #666; font-size: 14px;">This offer is only available through referral links.</p>
    </div>
  `;
}

export function referralPendingRewardEmail(
  referrerName: string,
  refereeName: string,
  dashboardUrl: string
): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
      <h1 style="color: #1a1a1a; font-size: 24px;">Referral Update</h1>
      <p>Hi ${referrerName},</p>
      <p><strong>${refereeName}</strong> just signed up using your referral code! They're now exploring TradeDesk.</p>
      <p>When they subscribe to a paid plan, you'll automatically earn a free month and they'll get 20% off their first 3 months.</p>
      <a href="${dashboardUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">View Referrals</a>
      <p style="color: #666; font-size: 12px; text-align: center;">You'll receive another email when they subscribe.</p>
    </div>
  `;
}