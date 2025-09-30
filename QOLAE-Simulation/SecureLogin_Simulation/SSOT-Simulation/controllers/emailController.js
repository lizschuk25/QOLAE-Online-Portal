import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

// Production file paths
const getLocalFilePath = (relativePath) => {
  return path.join('/var/www/api.qolae.com/central-repository', relativePath);
};

// Test email configuration
export const testEmailConfig = async (req, reply) => {
  console.log('📧 TEST EMAIL CONFIG REQUESTED');
  return {
    nodeEnv: process.env.NODE_ENV,
    smtpConfigured: !!process.env.SMTP_HOST,
    smtpHost: process.env.SMTP_HOST || 'not set',
    emailFrom: process.env.EMAIL_FROM || 'not set',
    timestamp: new Date().toISOString()
  };
};

// Send email with attachments - PRODUCTION VERSION
// Send verification code email
export const sendVerificationCode = async (recipientEmail, verificationCode, lawyerName, lawFirm) => {
  try {
    console.log(`📧 Sending verification code to ${recipientEmail} for ${lawyerName} (${lawFirm})`);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true,
      logger: true,
    });

    // Test SMTP connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (smtpVerifyError) {
      console.error('❌ SMTP Verification Error:', smtpVerifyError);
      throw new Error('Failed to connect to email server');
    }

    // Build verification email
    const message = {
      from: process.env.EMAIL_FROM || 'QOLAE Security <security@qolae.com>',
      to: recipientEmail,
      subject: 'QOLAE 2FA Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #693382; margin-bottom: 10px;">QOLAE Security</h1>
            <h2 style="color: #374151; margin-bottom: 20px;">Two-Factor Authentication</h2>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
              Hello <strong>${lawyerName}</strong>,
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 25px;">
              You've requested a verification code to access your QOLAE Lawyers Dashboard. 
              Please use the code below to complete your authentication:
            </p>
            
            <div style="background: #693382; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
              <h1 style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                ${verificationCode}
              </h1>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #6b7280; font-size: 14px; margin-bottom: 20px; padding-left: 20px;">
              <li>This code will expire in 10 minutes</li>
              <li>Never share this code with anyone</li>
              <li>If you didn't request this code, please contact support immediately</li>
            </ul>
          </div>
          
          <div style="text-align: center; color: #9ca3af; font-size: 12px;">
            <p>This is an automated security message from QOLAE Online Portal</p>
            <p>Law Firm: ${lawFirm}</p>
            <p>If you need assistance, contact Liz at Liz.Chukwu@qolae.com</p>
          </div>
        </div>
      `,
    };

    // Send email
    console.log('📧 Sending verification code email...');
    const info = await transporter.sendMail(message);
    console.log('✅ Verification code email sent successfully!');
    console.log('📧 Message ID:', info.messageId || 'not available');

    return {
      success: true,
      messageId: info.messageId || 'not available',
      recipient: recipientEmail,
    };

  } catch (error) {
    console.error('❌ VERIFICATION CODE EMAIL ERROR:', error);
    throw error;
  }
};

export const sendEmail = async (req, reply) => {
  try {
    console.log('==========================================');
    console.log(`📧 EMAIL REQUEST RECEIVED - PRODUCTION MODE`);
    console.log(`SMTP_HOST: ${process.env.SMTP_HOST || 'not set'}`);
    console.log(`EMAIL_FROM: ${process.env.EMAIL_FROM || 'not set'}`);
    console.log('==========================================');

    // Extract data from request
    const { pin, emailContent, recipient } = req.body;
    console.log(`📧 Received email request for ${recipient?.email || 'unknown recipient'}`);

    // Validation
    if (!recipient || !recipient.email || !emailContent) {
      return reply.code(400).send({ error: 'Missing required email data' });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      debug: true,
      logger: true,
    });

    // Test SMTP connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (smtpVerifyError) {
      console.error('❌ SMTP Verification Error:', smtpVerifyError);
      return reply.code(500).send({
        success: false,
        error: 'Failed to connect to email server',
        details: smtpVerifyError.message
      });
    }

    // Build email message
    const message = {
      from: process.env.EMAIL_FROM || 'Liz Chukwu <Liz.Chukwu@qolae.com>',
      to: recipient.email,
      subject: "Thank You for Connecting with QOLAE – Let's Get Started",
      html: emailContent,
      attachments: [],
    };

    // Add attachments
    console.log('📎 Adding attachments...');

    // 1. CV.pdf
    const cvPath = getLocalFilePath('original/CV.pdf');
    if (fs.existsSync(cvPath)) {
      message.attachments.push({
        filename: 'CV.pdf',
        path: cvPath
      });
      console.log('✅ CV.pdf attached from:', cvPath);
    } else {
      console.warn('⚠️ CV.pdf not found at:', cvPath);
    }

    // 2. CaseStudies.pdf
    const caseStudiesPath = getLocalFilePath('original/CaseStudies.pdf');
    if (fs.existsSync(caseStudiesPath)) {
      message.attachments.push({
        filename: 'CaseStudies.pdf',
        path: caseStudiesPath
      });
      console.log('✅ CaseStudies.pdf attached from:', caseStudiesPath);
    } else {
      console.warn('⚠️ CaseStudies.pdf not found at:', caseStudiesPath);
    }

    // 3. Customized TOB.pdf
    const customTOBPath = getLocalFilePath(`final-tob/TOB_${pin}.pdf`);
    if (fs.existsSync(customTOBPath)) {
      message.attachments.push({
        filename: `TOB_${pin}.pdf`,
        path: customTOBPath
      });
      console.log('✅ Customized TOB attached from:', customTOBPath);
    } else {
      console.warn('⚠️ Customized TOB not found at:', customTOBPath);
      return reply.code(400).send({
        success: false,
        error: 'Customized TOB not found - run "Ready to Generate Documents" first'
      });
    }

    // Send email
    console.log('📧 PRODUCTION MODE: Sending email...');
    console.log('📎 Final attachments:', message.attachments.map(a => a.filename));

    try {
      console.log('📧 Calling transporter.sendMail()...');
      const info = await transporter.sendMail(message);
      console.log('✅ Email sent successfully!');
      console.log('📧 Message ID:', info.messageId || 'not available');

      return reply.send({
        success: true,
        mode: 'production',
        messageId: info.messageId || 'not available',
        recipient: recipient.email,
        attachments: message.attachments.map(a => a.filename),
      });

    } catch (emailError) {
      console.error('❌ EMAIL SENDING ERROR:', emailError);
      return reply.code(500).send({
        success: false,
        error: 'Failed to send email',
        message: emailError.message,
        details: emailError
      });
    }

  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error);
    return reply.code(500).send({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}; 