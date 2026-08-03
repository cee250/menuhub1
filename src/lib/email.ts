import nodemailer from 'nodemailer';

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'menuhub00@gmail.com';

function getTransporter() {
  const password = process.env.SMTP_PASS || '';

  if (!password) {
    console.warn('⚠️ SMTP_PASS is empty. Emails will NOT be sent. Check your .env file.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || 'menuhub00@gmail.com',
      pass: password,
    },
  });
}

export async function sendNewRegistrationNotification(business: { 
  name: string; 
  slug: string; 
  email?: string | null; 
  whatsappNumber: string; 
  businessType?: string | null 
}) {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('📧 [DEV] Would send registration email to menuhub00@gmail.com for:', business.name);
      return { success: false, error: 'SMTP not configured' };
    }
    
    const adminUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/super-admin/login`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"MenuHub" <noreply@menuhub.app>',
      to: ADMIN_EMAIL,
      subject: `🚀 New Business Registration: ${business.name}`,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2563eb; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">New Business Registration</h1>
  </div>
  <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
    <p style="color: #475569; font-size: 16px;">A new business has registered on <strong>MenuHub</strong> and is awaiting activation.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Business</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${business.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Slug</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${business.slug}</td>
      </tr>
      ${business.email ? `<tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Email</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${business.email}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">WhatsApp</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${business.whatsappNumber}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-weight: 600;">Type</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${business.businessType || 'Not specified'}</td>
      </tr>
    </table>
    <div style="margin-top: 24px; text-align: center;">
      <a href="${adminUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Go to Admin Dashboard</a>
    </div>
    <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; text-align: center;">
      You can activate this business from the Super Admin panel.
    </p>
  </div>
</div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send registration notification email:', error);
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail(businessEmail: string, resetLink: string) {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log('📧 [DEV] Would send password reset email to:', businessEmail, resetLink);
      return { success: false, error: 'SMTP not configured' };
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"MenuHub" <noreply@menuhub.app>',
      to: businessEmail,
      subject: '🔑 Reset Your MenuHub Password',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: #2563eb; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
  </div>
  <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
    <p style="color: #475569; font-size: 16px;">We received a request to reset the password for your MenuHub account.</p>
    <div style="margin-top: 24px; text-align: center;">
      <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 16px;">Reset My Password</a>
    </div>
    <p style="color: #64748b; font-size: 14px; margin-top: 16px;">
      This link will expire in 1 hour. If you did not request this, please ignore this email.
    </p>
    <p style="color: #94a3b8; font-size: 12px; margin-top: 16px; text-align: center;">
      MenuHub — Digital Menus for Modern Businesses
    </p>
  </div>
</div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error };
  }
}