import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER || 'revwinner2025@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Get the application URL from environment
function getAppUrl(): string {
  // Check for explicit APP_URL first
  if (process.env.APP_URL) {
    return process.env.APP_URL;
  }
  
  // Default to RevWinner production domain
  return 'https://revwinner.com';
}

// Create Gmail SMTP transporter
let transporter: nodemailer.Transporter | null = null;

if (GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendOTPEmail(email: string, code: string, firstName: string): Promise<void> {
  if (!transporter) {
    console.warn('Gmail SMTP not configured. OTP code:', code);
    console.log(`\n====== OTP EMAIL (DEV MODE) ======`);
    console.log(`To: ${email}`);
    console.log(`From: ${GMAIL_USER}`);
    console.log(`Name: ${firstName}`);
    console.log(`OTP Code: ${code}`);
    console.log(`==================================\n`);
    return;
  }

  const mailOptions = {
    from: `"Rev Winner" <${GMAIL_USER}>`,
    to: email,
    subject: 'Rev Winner - Email Verification Code',
    text: `Hello ${firstName},\n\nYour verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.\n\nBest regards,\nRev Winner Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Rev Winner</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1E3A8A;">Email Verification</h2>
          <p>Hello ${firstName},</p>
          <p>Your verification code is:</p>
          <div style="background-color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #C026D3; letter-spacing: 8px; margin: 0; font-size: 36px;">${code}</h1>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Best regards,<br>
            Rev Winner Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send verification email');
  }
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  if (!transporter) {
    console.log(`Welcome email would be sent to ${firstName} (${email})`);
    return;
  }

  const mailOptions = {
    from: `"Rev Winner" <${GMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Rev Winner!',
    text: `Hello ${firstName},\n\nWelcome to Rev Winner! Your trial has started.\n\nYou now have access to 3 sessions with 60 minutes each, including AI-powered sales conversations, smart BANT qualification, and meeting minutes generation.\n\nGet started now and transform your sales discovery calls!\n\nBest regards,\nRev Winner Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to Rev Winner!</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1E3A8A;">Your Trial Has Started 🎉</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for joining Rev Winner! Your account is now active and you have access to:</p>
          <ul style="line-height: 1.8;">
            <li>3 sessions with 60 minutes maximum each</li>
            <li>AI-powered sales conversation analysis</li>
            <li>Smart BANT qualification questions</li>
            <li>Real-time discovery insights</li>
            <li>Automated meeting minutes with PDF export</li>
            <li>Voice-to-text transcription</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${getAppUrl()}/sales-assistant" style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Start Your First Call
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">Your trial includes 3 sessions. Upgrade anytime for unlimited access.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Best regards,<br>
            Rev Winner Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
}

export async function sendTrialExpiringEmail(email: string, firstName: string, sessionsLeft: number): Promise<void> {
  if (!transporter) {
    console.log(`Trial expiring email would be sent to ${firstName} (${email}) - ${sessionsLeft} sessions left`);
    return;
  }

  const mailOptions = {
    from: `"Rev Winner" <${GMAIL_USER}>`,
    to: email,
    subject: `Rev Winner - ${sessionsLeft} ${sessionsLeft === 1 ? 'Session' : 'Sessions'} Remaining`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Rev Winner</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1E3A8A;">Your Trial is Almost Over</h2>
          <p>Hello ${firstName},</p>
          <p>You have <strong>${sessionsLeft} ${sessionsLeft === 1 ? 'session' : 'sessions'}</strong> remaining in your trial.</p>
          <p>Don't lose access to your AI-powered sales assistant! Upgrade now to get unlimited sessions.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${getAppUrl()}/subscribe" style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Upgrade Now
            </a>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Trial expiring email sent to ${email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending trial expiring email:', error);
  }
}

export async function sendPasswordResetEmail(email: string, resetToken: string, firstName: string): Promise<void> {
  const resetLink = `${getAppUrl()}/reset-password?token=${resetToken}`;
  
  if (!transporter) {
    console.log(`\n====== PASSWORD RESET EMAIL (DEV MODE) ======`);
    console.log(`To: ${email}`);
    console.log(`Name: ${firstName}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log(`==================================\n`);
    return;
  }

  const mailOptions = {
    from: `"Rev Winner" <${GMAIL_USER}>`,
    to: email,
    subject: 'Rev Winner - Password Reset Request',
    text: `Hello ${firstName},\n\nYou requested to reset your password. Click the link below to create a new password:\n\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nRev Winner Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Rev Winner</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1E3A8A;">Password Reset Request</h2>
          <p>Hello ${firstName},</p>
          <p>You requested to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Best regards,<br>
            Rev Winner Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendLeadNotificationEmail(
  to: string,
  leadData: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    message?: string;
    leadType: 'demo_request' | 'contact_form' | 'business_teams';
    totalSeats?: number;
    estimatedTimeline?: string;
  }
): Promise<void> {
  if (!transporter) {
    console.log(`\n====== LEAD NOTIFICATION (DEV MODE) ======`);
    console.log(`To: ${to}`);
    console.log(`Lead Type: ${leadData.leadType}`);
    console.log(`Name: ${leadData.name}`);
    console.log(`Email: ${leadData.email}`);
    console.log(`Company: ${leadData.company || 'N/A'}`);
    console.log(`Phone: ${leadData.phone || 'N/A'}`);
    console.log(`Message: ${leadData.message || 'N/A'}`);
    console.log(`Total Seats: ${leadData.totalSeats || 'N/A'}`);
    console.log(`Timeline: ${leadData.estimatedTimeline || 'N/A'}`);
    console.log(`==========================================\n`);
    return;
  }

  let subject: string;
  let html: string;

  if (leadData.leadType === 'demo_request') {
    subject = '🎯 New Demo Request - Rev Winner';
    html = formatDemoRequestEmail(leadData);
  } else if (leadData.leadType === 'business_teams') {
    subject = '🏢 New Business Teams Inquiry - Rev Winner';
    html = formatBusinessTeamsEmail(leadData);
  } else {
    subject = '📧 New Contact Form Submission - Rev Winner';
    html = formatContactFormEmail(leadData);
  }

  const mailOptions = {
    from: `"Rev Winner Leads" <${GMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Lead notification email sent to ${to} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending lead notification email:', error);
    throw new Error('Failed to send lead notification email');
  }
}

function formatDemoRequestEmail(data: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #c026d3 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 20px; }
          .label { font-weight: bold; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { margin-top: 5px; font-size: 16px; color: #111827; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🎯 New Demo Request</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Someone wants to see Rev Winner in action!</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name</div>
              <div class="value">${data.name}</div>
            </div>
            
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${data.email}" style="color: #c026d3;">${data.email}</a></div>
            </div>
            
            ${data.company ? `
            <div class="field">
              <div class="label">Company</div>
              <div class="value">${data.company}</div>
            </div>
            ` : ''}
            
            ${data.phone ? `
            <div class="field">
              <div class="label">Phone</div>
              <div class="value"><a href="tel:${data.phone}" style="color: #c026d3;">${data.phone}</a></div>
            </div>
            ` : ''}
            
            ${data.message ? `
            <div class="field">
              <div class="label">Message</div>
              <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
            
            <div class="footer">
              <p><strong>Action Required:</strong> Contact this lead within 24 hours</p>
              <p style="margin-top: 10px; font-size: 12px;">Submitted on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function formatContactFormEmail(data: {
  name: string;
  email: string;
  message?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 20px; }
          .label { font-weight: bold; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { margin-top: 5px; font-size: 16px; color: #111827; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">📧 New Contact Form Submission</h1>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name</div>
              <div class="value">${data.name}</div>
            </div>
            
            <div class="field">
              <div class="label">Email</div>
              <div class="value"><a href="mailto:${data.email}" style="color: #3b82f6;">${data.email}</a></div>
            </div>
            
            ${data.message ? `
            <div class="field">
              <div class="label">Message</div>
              <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
            
            <div class="footer">
              <p style="font-size: 12px;">Submitted on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function formatBusinessTeamsEmail(data: {
  name: string;
  email: string;
  phone?: string;
  totalSeats?: number;
  estimatedTimeline?: string;
  message?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #c026d3 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 20px; }
          .label { font-weight: bold; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
          .value { margin-top: 5px; font-size: 16px; color: #111827; }
          .highlight { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 28px;">🏢 New Business Teams Inquiry</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Enterprise opportunity - High priority!</p>
          </div>
          <div class="content">
            <div class="highlight">
              <p style="margin: 0; font-weight: bold; color: #92400e;">⚡ High-Value Lead - Contact ASAP</p>
              <p style="margin: 5px 0 0 0; font-size: 14px; color: #78350f;">Seats: ${data.totalSeats || 'Not specified'} | Timeline: ${data.estimatedTimeline || 'Not specified'}</p>
            </div>
            
            <div class="field">
              <div class="label">Contact Name</div>
              <div class="value">${data.name}</div>
            </div>
            
            <div class="field">
              <div class="label">Business Email</div>
              <div class="value"><a href="mailto:${data.email}" style="color: #7c3aed;">${data.email}</a></div>
            </div>
            
            ${data.phone ? `
            <div class="field">
              <div class="label">Phone Number</div>
              <div class="value"><a href="tel:${data.phone}" style="color: #7c3aed;">${data.phone}</a></div>
            </div>
            ` : ''}
            
            <div class="field">
              <div class="label">Total Number of Seats</div>
              <div class="value">${data.totalSeats || 'Not specified'}</div>
            </div>
            
            <div class="field">
              <div class="label">Estimated Timeline to Buy</div>
              <div class="value">${data.estimatedTimeline || 'Not specified'}</div>
            </div>
            
            ${data.message ? `
            <div class="field">
              <div class="label">Additional Message</div>
              <div class="value">${data.message.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
            
            <div class="footer">
              <p><strong>🎯 Priority Action:</strong> Contact this enterprise lead within 4 hours</p>
              <p style="margin-top: 10px; font-size: 12px;">Submitted on ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendLicenseAssignmentEmail(
  email: string,
  firstName: string,
  resetToken: string,
  organizationName: string
): Promise<void> {
  const setPasswordLink = `${getAppUrl()}/reset-password?token=${resetToken}`;
  
  if (!transporter) {
    console.log(`\n====== LICENSE ASSIGNMENT EMAIL (DEV MODE) ======`);
    console.log(`To: ${email}`);
    console.log(`Name: ${firstName}`);
    console.log(`Organization: ${organizationName}`);
    console.log(`Set Password Link: ${setPasswordLink}`);
    console.log(`==================================================\n`);
    return;
  }

  const mailOptions = {
    from: `"Rev Winner" <${GMAIL_USER}>`,
    to: email,
    subject: 'Rev Winner - License Assigned',
    text: `Hello ${firstName},\n\nYou have been granted access to Rev Winner by ${organizationName}.\n\nTo activate your account, please create your password by clicking the link below:\n\n${setPasswordLink}\n\nThis link will expire in 24 hours.\n\nYour login email: ${email}\n\nBest regards,\nRev Winner Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Rev Winner</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1E3A8A;">License Assigned 🎉</h2>
          <p>Hello ${firstName},</p>
          <p>You have been granted access to Rev Winner by <strong>${organizationName}</strong>.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 2px solid #C026D3; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #C026D3;">Your Account Details</h3>
            <div style="margin: 15px 0;">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Login Email:</div>
              <div style="font-family: monospace; font-size: 16px; color: #1E3A8A; font-weight: bold;">${email}</div>
            </div>
          </div>

          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e3a8a; font-weight: bold;">📌 Next Step</p>
            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 14px;">Click the button below to create your secure password and activate your account.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${setPasswordLink}" style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Set Your Password
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center;">This link will expire in 24 hours.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Best regards,<br>
            Rev Winner Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`License assignment email sent to ${email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending license assignment email:', error);
    throw new Error('Failed to send license assignment email');
  }
}

export async function sendLicenseAccessNotificationEmail(
  email: string,
  firstName: string,
  organizationName: string
): Promise<void> {
  const loginUrl = `${getAppUrl()}/login`;
  
  if (!transporter) {
    console.log(`\n====== LICENSE ACCESS NOTIFICATION (DEV MODE) ======`);
    console.log(`To: ${email}`);
    console.log(`Name: ${firstName}`);
    console.log(`Organization: ${organizationName}`);
    console.log(`Login URL: ${loginUrl}`);
    console.log(`===================================================\n`);
    return;
  }

  const mailOptions = {
    from: `"Rev Winner" <${GMAIL_USER}>`,
    to: email,
    subject: 'Rev Winner - License Access Granted',
    text: `Hello ${firstName},\n\nGreat news! You have been granted access to Rev Winner by ${organizationName}.\n\nYou can now log in using your existing account credentials:\n\n${loginUrl}\n\nYour login email: ${email}\n\nBest regards,\nRev Winner Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Rev Winner</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1E3A8A;">Access Granted 🎉</h2>
          <p>Hello ${firstName},</p>
          <p>Great news! You have been granted access to Rev Winner by <strong>${organizationName}</strong>.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 2px solid #C026D3; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #C026D3;">Your Account Details</h3>
            <div style="margin: 15px 0;">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Login Email:</div>
              <div style="font-family: monospace; font-size: 16px; color: #1E3A8A; font-weight: bold;">${email}</div>
            </div>
          </div>

          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e3a8a; font-weight: bold;">✅ You're All Set!</p>
            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 14px;">You can log in now using your existing password.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Log In Now
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Best regards,<br>
            Rev Winner Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`License access notification sent to ${email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending license access notification:', error);
    throw new Error('Failed to send license access notification');
  }
}

export async function sendLicenseManagerInvitationEmail(
  email: string,
  managerName: string,
  resetToken: string,
  purchaseDetails: {
    platformAccessCount: number;
    sessionMinutesCount: number;
    daiCount: number;
    trainMeCount: number;
    totalAmount: string;
    buyerName: string;
  }
): Promise<void> {
  const setPasswordLink = `${getAppUrl()}/setup-license-manager?token=${resetToken}`;
  
  if (!transporter) {
    console.log(`\n====== LICENSE MANAGER INVITATION (DEV MODE) ======`);
    console.log(`To: ${email}`);
    console.log(`Manager Name: ${managerName}`);
    console.log(`Set Password Link: ${setPasswordLink}`);
    console.log(`Purchase Details:`, purchaseDetails);
    console.log(`===================================================\n`);
    return;
  }

  const mailOptions = {
    from: `"Rev Winner" <${GMAIL_USER}>`,
    to: email,
    subject: 'Rev Winner - You\'ve Been Assigned as License Manager',
    text: `Hello ${managerName},\n\nCongratulations! You have been designated as a License Manager for Rev Winner by ${purchaseDetails.buyerName}.\n\nYour team package includes:\n- ${purchaseDetails.platformAccessCount} Platform Access license(s)\n- ${purchaseDetails.sessionMinutesCount} Session Minutes package(s)\n${purchaseDetails.daiCount > 0 ? `- ${purchaseDetails.daiCount} DAI add-on(s)\n` : ''}${purchaseDetails.trainMeCount > 0 ? `- ${purchaseDetails.trainMeCount} Train Me add-on(s)\n` : ''}\nTo activate your License Manager account and start assigning licenses to your team members, please create your password by clicking the link below:\n\n${setPasswordLink}\n\nThis link will expire in 24 hours.\n\nYour login email: ${email}\n\nBest regards,\nRev Winner Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Rev Winner</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1E3A8A;">License Manager Assigned 🎉</h2>
          <p>Hello ${managerName},</p>
          <p>Congratulations! You have been designated as a <strong>License Manager</strong> for Rev Winner by <strong>${purchaseDetails.buyerName}</strong>.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 2px solid #C026D3; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #C026D3;">Your Team Package</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Platform Access Licenses</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #1E3A8A;">${purchaseDetails.platformAccessCount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Session Minutes Packages</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #1E3A8A;">${purchaseDetails.sessionMinutesCount}</td>
              </tr>
              ${purchaseDetails.daiCount > 0 ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">DAI Add-ons</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #1E3A8A;">${purchaseDetails.daiCount}</td>
              </tr>
              ` : ''}
              ${purchaseDetails.trainMeCount > 0 ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Train Me Add-ons</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #1E3A8A;">${purchaseDetails.trainMeCount}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 2px solid #1E3A8A; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1E3A8A;">Your Account Details</h3>
            <div style="margin: 15px 0;">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Login Email:</div>
              <div style="font-family: monospace; font-size: 16px; color: #1E3A8A; font-weight: bold;">${email}</div>
            </div>
          </div>

          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e; font-weight: bold;">🔑 As License Manager, you can:</p>
            <ul style="margin: 10px 0 0 0; color: #78350f; font-size: 14px; padding-left: 20px;">
              <li>Assign licenses to team members</li>
              <li>Revoke licenses when needed</li>
              <li>Monitor license usage</li>
              <li>Manage your team's access</li>
            </ul>
          </div>

          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e3a8a; font-weight: bold;">📌 Next Step</p>
            <p style="margin: 10px 0 0 0; color: #1e40af; font-size: 14px;">Click the button below to create your secure password and activate your License Manager account.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${setPasswordLink}" style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Activate Your Account
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center;">This link will expire in 24 hours.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Best regards,<br>
            Rev Winner Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`License Manager invitation sent to ${email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending License Manager invitation:', error);
    throw new Error('Failed to send License Manager invitation');
  }
}

export async function sendNewRegistrationNotification(
  userData: {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    company?: string;
  }
): Promise<void> {
  if (!transporter) {
    console.log(`\n====== NEW REGISTRATION NOTIFICATION (DEV MODE) ======`);
    console.log(`New User Registered:`);
    console.log(`Name: ${userData.firstName} ${userData.lastName}`);
    console.log(`Email: ${userData.email}`);
    console.log(`Username: ${userData.username}`);
    console.log(`Company: ${userData.company || 'N/A'}`);
    console.log(`Time: ${new Date().toLocaleString()}`);
    console.log(`=======================================================\n`);
    return;
  }

  const mailOptions = {
    from: `"Rev Winner Notifications" <${GMAIL_USER}>`,
    to: 'sales@revwinner.com',
    subject: '🎉 New User Registration - Rev Winner',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; }
          .header { background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; }
          .content { padding: 30px; }
          .badge { display: inline-block; background: linear-gradient(135deg, #C026D3, #7C3AED); color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; }
          .info-card { background: #f9fafb; border-left: 4px solid #C026D3; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .field { margin-bottom: 15px; }
          .label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .value { font-size: 16px; color: #1f2937; font-weight: 500; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
          a { color: #7c3aed; text-decoration: none; }
          .cta { background: linear-gradient(135deg, #C026D3, #7C3AED); color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; margin-top: 20px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New User Registration</h1>
          </div>
          <div class="content">
            <div class="badge">Rev Winner Platform</div>
            
            <p style="font-size: 16px; color: #1f2937;">A new user has successfully registered on the Rev Winner platform:</p>
            
            <div class="info-card">
              <div class="field">
                <div class="label">Full Name</div>
                <div class="value">${userData.firstName} ${userData.lastName}</div>
              </div>
              
              <div class="field">
                <div class="label">Email Address</div>
                <div class="value"><a href="mailto:${userData.email}">${userData.email}</a></div>
              </div>
              
              <div class="field">
                <div class="label">Username</div>
                <div class="value">${userData.username}</div>
              </div>
              
              ${userData.company ? `
              <div class="field">
                <div class="label">Company</div>
                <div class="value">${userData.company}</div>
              </div>
              ` : ''}
              
              <div class="field">
                <div class="label">Registration Date</div>
                <div class="value">${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</div>
              </div>
              
              <div class="field">
                <div class="label">Account Status</div>
                <div class="value">✅ Email verification pending</div>
              </div>
              
              <div class="field">
                <div class="label">Trial Plan</div>
                <div class="value">3 sessions (max 60 minutes each)</div>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>📊 User Activity:</strong> Monitor their trial usage and reach out when they show engagement</p>
              <p style="margin-top: 10px; font-size: 12px; color: #9ca3af;">This is an automated notification from Rev Winner</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`New registration notification sent to sales@revwinner.com - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending registration notification email:', error);
  }
}

// Send notification email when chatbot lead is captured
export async function sendChatbotLeadEmail(leadData: {
  fullName: string;
  email: string;
  phone: string;
  companyName?: string;
  jobTitle?: string;
}): Promise<void> {
  if (!transporter) {
    console.log(`Chatbot lead email would be sent: ${leadData.fullName} (${leadData.email})`);
    return;
  }

  // Send internal notification to support (default) - will be routed later based on conversation
  const mailOptions = {
    from: `"Rev Winner Chatbot" <${GMAIL_USER}>`,
    to: 'support@revwinner.com',
    subject: `🤖 New Chatbot Lead: ${leadData.fullName}`,
    text: `New lead captured via Rev Winner AI Chatbot\n\nFull Name: ${leadData.fullName}\nEmail: ${leadData.email}\nPhone: ${leadData.phone}\n${leadData.companyName ? `Company: ${leadData.companyName}\n` : ''}${leadData.jobTitle ? `Job Title: ${leadData.jobTitle}\n` : ''}\n\nThe lead is now chatting with our AI assistant. Follow up promptly!`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="background-color: #f3f4f6; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🤖 New Chatbot Lead</h1>
            </div>
            
            <div style="padding: 30px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">A new lead has been captured via the Rev Winner AI Chatbot!</p>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <div style="margin-bottom: 15px;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Full Name</div>
                  <div style="color: #111827; font-size: 16px; font-weight: 500;">${leadData.fullName}</div>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Email</div>
                  <div style="color: #111827; font-size: 16px;"><a href="mailto:${leadData.email}" style="color: #C026D3; text-decoration: none;">${leadData.email}</a></div>
                </div>
                
                <div style="margin-bottom: 15px;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Phone</div>
                  <div style="color: #111827; font-size: 16px;"><a href="tel:${leadData.phone}" style="color: #C026D3; text-decoration: none;">${leadData.phone}</a></div>
                </div>
                
                ${leadData.companyName ? `
                <div style="margin-bottom: 15px;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Company</div>
                  <div style="color: #111827; font-size: 16px;">${leadData.companyName}</div>
                </div>
                ` : ''}
                
                ${leadData.jobTitle ? `
                <div style="margin-bottom: 15px;">
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Job Title</div>
                  <div style="color: #111827; font-size: 16px;">${leadData.jobTitle}</div>
                </div>
                ` : ''}
                
                <div>
                  <div style="color: #6b7280; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Status</div>
                  <div style="color: #111827; font-size: 16px;">💬 Currently chatting with AI assistant</div>
                </div>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>⚡ Action Required:</strong> The lead is actively engaging with our chatbot. Follow up promptly to maintain momentum!</p>
              </div>
            </div>
            
            <div style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">This is an automated notification from Rev Winner AI Chatbot</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Chatbot lead notification sent - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending chatbot lead email:', error);
    throw error;
  }
}

// Send conversation summary email (routed to sales or support based on intent)
export async function sendChatbotConversationEmail(
  leadData: {
    fullName: string;
    email: string;
    phone: string;
    companyName?: string;
    jobTitle?: string;
  },
  conversationHistory: Array<{ role: string; content: string }>,
  intent: 'sales' | 'support'
): Promise<void> {
  if (!transporter) {
    console.log(`Conversation email would be sent to ${intent}@revwinner.com`);
    return;
  }

  const recipient = intent === 'sales' ? 'sales@revwinner.com' : 'support@revwinner.com';
  const conversationHtml = conversationHistory
    .map((msg, idx) => `
      <div style="margin-bottom: 15px; padding: 15px; background-color: ${msg.role === 'user' ? '#ede9fe' : '#f9fafb'}; border-radius: 8px;">
        <div style="color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 5px;">
          ${msg.role === 'user' ? '👤 User' : '🤖 AI Assistant'}
        </div>
        <div style="color: #111827; font-size: 14px; white-space: pre-wrap;">${msg.content}</div>
      </div>
    `)
    .join('');

  const mailOptions = {
    from: `"Rev Winner Chatbot" <${GMAIL_USER}>`,
    to: recipient,
    subject: `🤖 Chatbot Conversation - ${leadData.fullName} (${intent === 'sales' ? 'Sales Lead' : 'Support Request'})`,
    text: `Chatbot conversation with ${leadData.fullName}\n\nLead Info:\n${leadData.fullName} (${leadData.email})\nPhone: ${leadData.phone}\n${leadData.companyName ? `Company: ${leadData.companyName}\n` : ''}${leadData.jobTitle ? `Job Title: ${leadData.jobTitle}\n` : ''}\n\nConversation:\n${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n\n')}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <div style="background-color: #f3f4f6; padding: 20px;">
          <div style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, ${intent === 'sales' ? '#10b981' : '#3b82f6'} 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🤖 Chatbot ${intent === 'sales' ? 'Sales Lead' : 'Support Request'}</h1>
            </div>
            
            <div style="padding: 30px;">
              <h2 style="color: #111827; margin-top: 0;">Lead Information</h2>
              
              <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <div style="margin-bottom: 10px;"><strong>Name:</strong> ${leadData.fullName}</div>
                <div style="margin-bottom: 10px;"><strong>Email:</strong> <a href="mailto:${leadData.email}" style="color: #C026D3;">${leadData.email}</a></div>
                <div style="margin-bottom: 10px;"><strong>Phone:</strong> <a href="tel:${leadData.phone}" style="color: #C026D3;">${leadData.phone}</a></div>
                ${leadData.companyName ? `<div style="margin-bottom: 10px;"><strong>Company:</strong> ${leadData.companyName}</div>` : ''}
                ${leadData.jobTitle ? `<div style="margin-bottom: 10px;"><strong>Job Title:</strong> ${leadData.jobTitle}</div>` : ''}
              </div>
              
              <h2 style="color: #111827;">Conversation History</h2>
              ${conversationHtml}
            </div>
            
            <div style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">Automated email from Rev Winner AI Chatbot</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Conversation summary sent to ${recipient} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending conversation email to ${recipient}:`, error);
    throw error;
  }
}

// Send license/subscription expiry warning email
export async function sendExpiryWarningEmail(
  email: string,
  firstName: string,
  expiryType: 'license' | 'subscription' | 'addon',
  daysRemaining: number,
  packageDetails: {
    name: string;
    expiryDate: Date;
    organizationName?: string;
  }
): Promise<void> {
  const appUrl = getAppUrl();
  const renewLink = expiryType === 'license' 
    ? `${appUrl}/license-manager` 
    : `${appUrl}/packages`;
  
  const urgencyColor = daysRemaining <= 3 ? '#dc2626' : '#f59e0b';
  const urgencyText = daysRemaining <= 3 ? 'URGENT' : 'Reminder';
  
  const expiryTypeLabel = expiryType === 'license' ? 'License Package' 
    : expiryType === 'subscription' ? 'Subscription' 
    : 'Add-on';

  if (!transporter) {
    console.log(`\n====== EXPIRY WARNING EMAIL (DEV MODE) ======`);
    console.log(`To: ${email}`);
    console.log(`Name: ${firstName}`);
    console.log(`Type: ${expiryTypeLabel}`);
    console.log(`Days Remaining: ${daysRemaining}`);
    console.log(`Package: ${packageDetails.name}`);
    console.log(`Expiry Date: ${packageDetails.expiryDate.toLocaleDateString()}`);
    console.log(`Renew Link: ${renewLink}`);
    console.log(`==============================================\n`);
    return;
  }

  const mailOptions = {
    from: `"Rev Winner" <${GMAIL_USER}>`,
    to: email,
    subject: `${urgencyText}: Your Rev Winner ${expiryTypeLabel} expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${urgencyColor} 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Rev Winner</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <div style="background-color: ${urgencyColor}; color: white; padding: 10px 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <strong>⏰ ${urgencyText}: ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''} Remaining</strong>
          </div>
          
          <p>Hello ${firstName},</p>
          <p>Your Rev Winner <strong>${expiryTypeLabel}</strong> is expiring soon:</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 2px solid ${urgencyColor}; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Package</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${packageDetails.name}</td>
              </tr>
              ${packageDetails.organizationName ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Organization</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold;">${packageDetails.organizationName}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Expiry Date</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: ${urgencyColor};">${packageDetails.expiryDate.toLocaleDateString('en-US', { dateStyle: 'long' })}</td>
              </tr>
            </table>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            ${daysRemaining <= 3 
              ? 'To avoid interruption to your service, please renew immediately.' 
              : 'Renew now to ensure uninterrupted access to Rev Winner.'}
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${renewLink}" style="background: linear-gradient(135deg, #C026D3 0%, #1E3A8A 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Renew Now
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Need help? Contact us at support@revwinner.com<br>
            Rev Winner Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Expiry warning sent to ${email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending expiry warning email:', error);
    throw new Error('Failed to send expiry warning email');
  }
}

// Send license revocation notification email
export async function sendLicenseRevocationEmail(
  email: string,
  firstName: string,
  organizationName: string,
  revokedBy: string,
  reason?: string
): Promise<void> {
  const appUrl = getAppUrl();

  if (!transporter) {
    console.log(`\n====== LICENSE REVOCATION EMAIL (DEV MODE) ======`);
    console.log(`To: ${email}`);
    console.log(`Name: ${firstName}`);
    console.log(`Organization: ${organizationName}`);
    console.log(`Revoked By: ${revokedBy}`);
    console.log(`Reason: ${reason || 'Not specified'}`);
    console.log(`=================================================\n`);
    return;
  }

  const mailOptions = {
    from: `"Rev Winner" <${GMAIL_USER}>`,
    to: email,
    subject: 'Rev Winner - License Access Revoked',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6b7280 0%, #1E3A8A 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Rev Winner</h1>
        </div>
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1E3A8A;">License Access Revoked</h2>
          <p>Hello ${firstName},</p>
          <p>Your Rev Winner license access has been revoked by <strong>${organizationName}</strong>.</p>
          
          ${reason ? `
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;"><strong>Reason:</strong> ${reason}</p>
          </div>
          ` : ''}

          <p style="color: #6b7280; font-size: 14px;">
            If you believe this was done in error, please contact your organization's License Manager.
          </p>

          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
              <strong>Want your own license?</strong><br>
              You can purchase an individual subscription at <a href="${appUrl}/packages" style="color: #C026D3;">${appUrl}/packages</a>
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Best regards,<br>
            Rev Winner Team
          </p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`License revocation notification sent to ${email} - Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending license revocation email:', error);
  }
}
