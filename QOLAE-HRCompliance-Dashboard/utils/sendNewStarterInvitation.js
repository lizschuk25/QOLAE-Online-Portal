// ==============================================
// SEND NEW STARTER INVITATION EMAIL
// ==============================================
// Purpose: Send invitation email to new starters with PIN and portal link
// Author: Atlas Agent
// Date: October 14, 2025
// Integration: Uses QOLAE email service from API Dashboard
// ==============================================

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ==============================================
// EMAIL CONFIGURATION
// ==============================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ionos.co.uk',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// ==============================================
// SEND NEW STARTER INVITATION EMAIL
// ==============================================
/**
 * Sends invitation email to new starter with PIN and portal access
 * @param {Object} newStarterData - New starter information
 * @param {string} newStarterData.pin - Unique new starter PIN
 * @param {string} newStarterData.name - Full name
 * @param {string} newStarterData.email - Email address
 * @param {string} newStarterData.role - Job role/position
 * @returns {Promise<Object>} - Email send result
 */
export async function sendNewStarterInvitation(newStarterData) {
  try {
    console.log('\n📧 === SENDING NEW STARTER INVITATION EMAIL ===');
    console.log(`Recipient: ${newStarterData.name} <${newStarterData.email}>`);
    console.log(`PIN: ${newStarterData.pin}`);

    const { pin, name, email, role } = newStarterData;

    // Portal URL
    const portalUrl = process.env.HRCOMPLIANCE_PORTAL_URL || 'https://hrcompliance.qolae.com';
    const newStarterPortalUrl = `${portalUrl}/new-starter-login?pin=${pin}`;

    // Email subject
    const subject = `Thank You for Applying to QOLAE - Next Steps for ${role} Role`;

    // Email HTML body
    const htmlBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f9fafb;
            padding: 30px 20px;
            border-radius: 0 0 10px 10px;
          }
          .pin-box {
            background: white;
            border: 2px solid #667eea;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .pin-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          .pin-value {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 2px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
          }
          .checklist {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .checklist-item {
            padding: 10px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .checklist-item:last-child {
            border-bottom: none;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 Thank You for Applying to QOLAE</h1>
          <p>Next step: Complete your application</p>
        </div>

        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>

          <p>Thank you for applying for the <strong>${role}</strong> position at QOLAE.</p>

          <p>To continue with your application, please complete the compliance process by submitting the required documents via our secure portal. This will take approximately 15-20 minutes and is an essential part of our recruitment process.</p>

          <div class="pin-box">
            <div class="pin-label">Your Unique Identification PIN</div>
            <div class="pin-value">${pin}</div>
          </div>

          <p><strong>⚠️ Important:</strong> Please keep this PIN secure and do not share it with anyone. You will need it to access your portal.</p>

          <div style="text-align: center;">
            <a href="${newStarterPortalUrl}" class="button">Access Your Portal</a>
          </div>

          <div class="checklist">
            <h3>📋 What You'll Need to Submit:</h3>

            <div class="checklist-item">
              ✅ <strong>Application Form</strong> - Complete your personal details
            </div>

            <div class="checklist-item">
              ✅ <strong>Identity Documents</strong> - Passport or Driver's License + Birth Certificate
            </div>

            <div class="checklist-item">
              ✅ <strong>Proof of Address</strong> - Recent utility bill or bank statement (dated within 3 months)
            </div>

            <div class="checklist-item">
              ✅ <strong>Professional References</strong> - Contact details for 2 professional references
            </div>

            <div class="checklist-item">
              ✅ <strong>Qualifications</strong> - Copies of relevant certificates (if applicable)
            </div>

            <div class="checklist-item">
              ✅ <strong>DBS/PVG Check</strong> - Information for background check
            </div>
          </div>

          <p><strong>Timeline:</strong> Please complete your compliance submission within <strong>7 days</strong> of receiving this email. Once submitted, our HR team will review your application and documents, and we will contact you regarding the next steps.</p>

          <p><strong>Questions or Need Help?</strong><br>
          If you have any questions or encounter any issues, please contact our HR team at <a href="mailto:hr@qolae.com">hr@qolae.com</a> or call us at +44 (0) 131 XXX XXXX.</p>

          <p>Thank you again for your interest in joining QOLAE. We look forward to reviewing your application!</p>

          <p>Best regards,<br>
          <strong>QOLAE HR Team</strong></p>
        </div>

        <div class="footer">
          <p>Quality of Life & Excellence Ltd<br>
          Edinburgh, Scotland<br>
          This is an automated email. Please do not reply directly to this message.</p>

          <p style="margin-top: 20px;">
            <small>🔒 Your data is protected in accordance with GDPR and UK data protection laws. For more information, see our <a href="${portalUrl}/privacy-policy">Privacy Policy</a>.</small>
          </p>
        </div>
      </body>
      </html>
    `;

    // Plain text fallback
    const textBody = `
Thank You for Applying to QOLAE

Dear ${name},

Thank you for applying for the ${role} position at QOLAE.

Your Unique Identification PIN: ${pin}

To continue with your application, please complete the compliance process by accessing your secure portal at:
${newStarterPortalUrl}

You will need to submit the following documents:
- Application Form
- Identity Documents (Passport/Driver's License + Birth Certificate)
- Proof of Address (utility bill or bank statement dated within 3 months)
- Professional References (contact details for 2 references)
- Qualifications (copies of certificates, if applicable)
- DBS/PVG Check information

Please complete your submission within 7 days. Once submitted, our HR team will review your application and we will contact you regarding the next steps.

If you have any questions, contact us at hr@qolae.com or call +44 (0) 131 XXX XXXX.

Thank you again for your interest in joining QOLAE. We look forward to reviewing your application!

Best regards,
QOLAE HR Team

---
Quality of Life & Excellence Ltd
Edinburgh, Scotland

This is an automated email. Please do not reply directly to this message.
    `;

    // Send email
    const mailOptions = {
      from: '"QOLAE HR Team" <Liz.Chukwu@qolae.com>',
      to: email,
      subject: subject,
      text: textBody,
      html: htmlBody
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully');
    console.log(`Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      recipient: email,
      pin: pin,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Failed to send new starter invitation email:', error);
    throw error;
  }
}

// ==============================================
// SEND REMINDER EMAIL (IF NOT COMPLETED)
// ==============================================
/**
 * Sends reminder email to new starter if compliance not completed
 * @param {Object} newStarterData - New starter information
 * @returns {Promise<Object>} - Email send result
 */
export async function sendReminderEmail(newStarterData) {
  try {
    console.log('\n🔔 === SENDING REMINDER EMAIL ===');
    console.log(`Recipient: ${newStarterData.name} <${newStarterData.email}>`);

    const { pin, name, email } = newStarterData;
    const portalUrl = process.env.HRCOMPLIANCE_PORTAL_URL || 'https://hrcompliance.qolae.com';
    const newStarterPortalUrl = `${portalUrl}/new-starter-login?pin=${pin}`;

    const subject = `Reminder: Complete Your QOLAE New Starter Compliance`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px; }
          .content { padding: 20px; background: #f9fafb; border-radius: 8px; margin-top: 20px; }
          .button { display: inline-block; background: #f59e0b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>⏰ Reminder: Complete Your Compliance</h2>
        </div>
        <div class="content">
          <p>Dear <strong>${name}</strong>,</p>
          <p>This is a friendly reminder that your new starter compliance submission is still pending.</p>
          <p>Your PIN: <strong>${pin}</strong></p>
          <div style="text-align: center;">
            <a href="${newStarterPortalUrl}" class="button">Complete Your Submission</a>
          </div>
          <p>If you have any questions, please contact our HR team at <a href="mailto:hr@qolae.com">hr@qolae.com</a>.</p>
          <p>Best regards,<br><strong>QOLAE HR Team</strong></p>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: '"QOLAE HR Team" <Liz.Chukwu@qolae.com>',
      to: email,
      subject: subject,
      html: htmlBody
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Reminder email sent successfully');

    return {
      success: true,
      messageId: info.messageId,
      recipient: email,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Failed to send reminder email:', error);
    throw error;
  }
}

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default {
  sendNewStarterInvitation,
  sendReminderEmail
};
