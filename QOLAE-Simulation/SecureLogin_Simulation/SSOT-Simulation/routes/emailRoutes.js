// ==============================================
// emailRoutes.js - Email Service Routes
// Organized by Location Block Pattern
// Handles: Email sending, templates, TOB completion notifications
// ==============================================

// ==============================================
// LOCATION BLOCK A: IMPORTS & DEPENDENCIES
// A.1: Core Dependencies
// A.2: Database & Email Configuration
// ==============================================

// A.1: Core Dependencies
import { sendEmail, testEmailConfig } from '../controllers/emailController.js';
import { generateIntroEmail } from '../utils/IntroductoryEmail.js';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma.js';
import { Pool } from 'pg';

// A.2: Database Configuration
const lawyersPool = new Pool({
  connectionString: process.env.LAWYERS_DATABASE_URL || process.env.DATABASE_URL,
});

// Configuration for file paths
const config = {
  centralRepository: process.env.CENTRAL_REPOSITORY_PATH,
  paths: {
    signedTob: 'signed-tob',
    temp: 'temp',
    original: 'original'
  }
};

// ==============================================
// LOCATION BLOCK B: HELPER FUNCTIONS
// B.1: File Path Builder
// ==============================================

// B.1: File Path Builder
const buildFilePath = (type, fileName) => {
  const subPath = config.paths[type] || 'uploads';
  return path.join(config.centralRepository, subPath, fileName);
};

// ==============================================
// LOCATION BLOCK C: ROUTE DEFINITIONS
// C.1: Email Configuration & Testing
// C.2: Lawyer Introduction Email Workflow
// C.3: Email Template Management
// C.4: TOB Completion Email Workflow (NEW)
// C.5: Health Check
// ==============================================

export default async function (fastify, opts) {

  // ==============================================
  // C.1: EMAIL CONFIGURATION & TESTING
  // ==============================================

  // 🔧 Test email configuration
  fastify.get('/test-config', async (request, reply) => {
    return await testEmailConfig(request, reply);
  });

  // 📧 Send email with attachments (generic endpoint)
  fastify.post('/send', async (request, reply) => {
    return await sendEmail(request, reply);
  });

  // ==============================================
  // C.2: LAWYER INTRODUCTION EMAIL WORKFLOW
  // ==============================================

  // 📨 Send Email Checkbox Workflow - When checkbox is ticked (from Admin Dashboard)
  fastify.post('/send-lawyer-email/:pin', async (req, reply) => {
    try {
      const { pin } = req.params;
      
      console.log(`📨 Send Email checkbox triggered for PIN: ${pin}`);
      
      // 1. Find the lawyer in database
      const lawyer = await prisma.Lawyer.findUnique({
        where: { pin: pin },
        include: { notes: true, documents: true }
      });
      
      if (!lawyer) {
        return reply.code(404).send({
          success: false,
          error: `Lawyer with PIN ${pin} not found`
        });
      }
      
      // 2. Check if Ready to Generate Documents was completed first
      if (!lawyer.readyToGenerateDocuments) {
        return reply.code(400).send({
          success: false,
          error: 'Must complete "Ready to Generate Documents" before sending email',
          hint: 'Tick the first checkbox to generate customized TOB first'
        });
      }
      
      // 3. Check if email already sent
      if (lawyer.documentsSent) {
        return reply.code(400).send({
          success: false,
          error: 'Email has already been sent to this lawyer',
          hint: 'Check the workflow status - email was already sent'
        });
      }
      
      console.log(`👤 Preparing to send email to: ${lawyer.contactName} at ${lawyer.email}`);
      
      // 4. Use custom email content if it exists, otherwise use template
      let emailContent, emailSubject;
      
      if (lawyer.customEmailContent && lawyer.customEmailContent.trim()) {
        emailContent = generateIntroEmail(lawyer, lawyer.customEmailContent);
        emailSubject = lawyer.customEmailSubject || "Thank You for Connecting with QOLAE – Let's Get Started";
        console.log(`📝 Using custom email content for sending to PIN: ${pin}`);
      } else {
        emailContent = generateIntroEmail(lawyer);
        emailSubject = "Thank You for Connecting with QOLAE – Let's Get Started";
        console.log(`📋 Using template email content for sending to PIN: ${pin}`);
      }
      
      // 5. Prepare attachment paths
      const attachments = [];
      
      // CV.pdf (always included)
      const cvPath = buildFilePath('original', 'CV.pdf');
      if (fs.existsSync(cvPath)) {
        attachments.push({
          name: 'CV.pdf',
          path: cvPath,
          type: 'PDF Document'
        });
      }
      
      // CaseStudies.pdf (always included) 
      const caseStudiesPath = buildFilePath('original', 'CaseStudies.pdf');
      if (fs.existsSync(caseStudiesPath)) {
        attachments.push({
          name: 'CaseStudies.pdf',
          path: caseStudiesPath,
          type: 'PDF Document'
        });
      }
      
      // Customized TOB.pdf (from temp folder)
      const customTOBPath = buildFilePath('temp', `TOB_${pin}.pdf`);
      if (fs.existsSync(customTOBPath)) {
        attachments.push({
          name: `TOB_${pin}.pdf`,
          path: customTOBPath,
          type: 'Customized Terms of Business'
        });
        console.log(`✅ Found customized TOB at: ${customTOBPath}`);
      } else {
        console.error(`❌ Customized TOB not found at: ${customTOBPath}`);
        return reply.code(400).send({
          success: false,
          error: 'Customized TOB not found',
          hint: 'The "Ready to Generate Documents" step may not have completed properly'
        });
      }
      
      console.log(`📎 Email will include ${attachments.length} attachments:`, 
        attachments.map(a => a.name));
      
      // 6. Prepare email data for the email controller
      const emailData = {
        recipient: {
          email: lawyer.email,
          name: lawyer.contactName
        },
        subject: emailSubject,
        emailContent: emailContent,
        attachments: attachments,
        pin: pin,
        lawyerId: lawyer.id,
        type: 'lawyer_introduction'
      };
      
      // 7. Send the email using existing email infrastructure
      const emailResult = await sendEmail({
        body: emailData
      }, {
        send: (response) => response,
        code: (code) => ({ send: (response) => ({ ...response, statusCode: code }) }),
        type: () => ({ send: (response) => response })
      });
      
      // 8. Check if email was sent successfully
      if (emailResult.success) {
        console.log(`✅ Email sent successfully to ${lawyer.email}`);
        
        // 9. Update lawyer record in database
        await prisma.Lawyer.update({
          where: { pin: pin },
          data: {
            sendEmail: true,
            documentsSent: true,
            emailSentAt: new Date(),
            status: 'Email Sent',
            lastModified: new Date()
          }
        });
        
        console.log(`✅ Updated lawyer database record for PIN: ${pin}`);
        
        return reply.send({
          success: true,
          message: `Email sent successfully to ${lawyer.contactName} at ${lawyer.email}`,
          details: {
            recipient: lawyer.email,
            attachments: attachments.map(a => a.name),
            sentAt: new Date().toISOString(),
            pin: pin
          }
        });
        
      } else {
        console.error(`❌ Email sending failed:`, emailResult);
        return reply.code(500).send({
          success: false,
          error: 'Email sending failed',
          details: emailResult.error || 'Unknown email error'
        });
      }
      
    } catch (error) {
      console.error('❌ Error in send email workflow:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error in send email workflow',
        details: error.message
      });
    }
  });

  // ==============================================
  // C.3: EMAIL TEMPLATE MANAGEMENT
  // ==============================================

  // 💾 Save Email Template
  fastify.post('/save-template/:pin', async (req, reply) => {
    try {
      const { pin } = req.params;
      let { subject, content } = req.body;
      
      if (!subject || !content) {
        return reply.code(400).send({
          success: false,
          message: 'Subject and content are required'
        });
      }
      
      console.log(`💾 Saving email template for PIN: ${pin}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content length: ${content.length} characters`);
      
      // Update lawyer record with custom email template
      await prisma.Lawyer.update({
        where: { pin: pin },
        data: {
          customEmailSubject: subject,
          customEmailContent: content,
          lastModified: new Date()
        }
      });
      
      return reply.send({
        success: true,
        message: 'Email template saved successfully',
        pin: pin
      });
      
    } catch (error) {
      console.error('❌ Error saving email template:', error);
      return reply.code(500).send({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  });

  // ==============================================
  // C.4: TOB COMPLETION EMAIL WORKFLOW (NEW)
  // ==============================================

  // 🎉 Send TOB Completion Email with Signed PDF
  fastify.post('/tob-completion', async (request, reply) => {
    try {
      const { pin } = request.body;

      if (!pin) {
        return reply.code(400).send({
          success: false,
          error: 'PIN is required'
        });
      }

      console.log(`🎉 Sending TOB completion email for PIN: ${pin}`);

      // 1. Fetch lawyer details from database
      const lawyerResult = await lawyersPool.query(
        `SELECT id, pin, contact_name, law_firm, email, email_preference
         FROM lawyers
         WHERE pin = $1`,
        [pin]
      );

      if (lawyerResult.rows.length === 0) {
        return reply.code(404).send({
          success: false,
          error: 'Lawyer not found',
          pin: pin
        });
      }

      const lawyer = lawyerResult.rows[0];

      // 2. Check email preference
      if (lawyer.email_preference !== 'yes') {
        console.log(`ℹ️ Lawyer opted out of email notifications - skipping email send`);
        return reply.send({
          success: true,
          message: 'Email not sent - lawyer opted out of email notifications',
          pin: pin,
          skipped: true
        });
      }

      // 3. Get signed PDF from filesystem
      const fileName = `TOB_${pin}_Signed.pdf`;
      const filePath = buildFilePath('signedTob', fileName);

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Signed TOB file not found: ${filePath}`);
        return reply.code(404).send({
          success: false,
          error: 'Signed TOB file not found',
          pin: pin,
          expectedPath: filePath
        });
      }

      console.log(`✅ Found signed TOB at: ${filePath}`);

      // 4. Prepare email content
      const emailSubject = `Your Signed Terms of Business - Ready for Review`;
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Congratulations, ${lawyer.contact_name}! 🎉</h2>
          
          <p>Your Terms of Business has been successfully completed and signed.</p>
          
          <p>Please find your signed document attached to this email for your records.</p>
          
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2d3748; margin-top: 0;">Next Steps:</h3>
            <ul style="color: #4a5568;">
              <li>Review your signed Terms of Business</li>
              <li>Proceed with payment to activate your account</li>
              <li>Start managing your cases with QOLAE</li>
            </ul>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          
          <p style="color: #718096; margin-top: 30px;">
            Best regards,<br>
            <strong>The QOLAE Team</strong>
          </p>
        </div>
      `;

      // 5. Prepare email data
      const emailData = {
        recipient: {
          email: lawyer.email,
          name: lawyer.contact_name
        },
        subject: emailSubject,
        emailContent: emailContent,
        attachments: [
          {
            name: `TOB_Signed_${pin}.pdf`,
            path: filePath,
            type: 'Signed Terms of Business'
          }
        ],
        pin: pin,
        lawyerId: lawyer.id,
        type: 'tob_completion'
      };

      console.log(`📧 Sending completion email to: ${lawyer.email}`);

      // 6. Send the email
      const emailResult = await sendEmail({
        body: emailData
      }, {
        send: (response) => response,
        code: (code) => ({ send: (response) => ({ ...response, statusCode: code }) }),
        type: () => ({ send: (response) => response })
      });

      // 7. Check if email was sent successfully
      if (emailResult.success) {
        console.log(`✅ TOB completion email sent successfully to ${lawyer.email}`);
        
        // Update lawyer record with email sent timestamp
        await lawyersPool.query(
          `UPDATE lawyers 
           SET tob_completion_email_sent_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE pin = $1`,
          [pin]
        );

        return reply.send({
          success: true,
          message: 'TOB completion email sent successfully',
          recipient: lawyer.email,
          sent_at: new Date().toISOString(),
          pin: pin
        });
        
      } else {
        console.error(`❌ TOB completion email failed:`, emailResult);
        return reply.code(500).send({
          success: false,
          error: 'Failed to send TOB completion email',
          details: emailResult.error || 'Unknown email error'
        });
      }

    } catch (error) {
      console.error('❌ Error sending TOB completion email:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error sending TOB completion email',
        details: error.message
      });
    }
  });

  // ==============================================
  // C.5: HEALTH CHECK
  // ==============================================

  // 🏥 Health check for email service
  fastify.get('/health', async (request, reply) => {
    return {
      service: 'email',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      smtpConfigured: !!process.env.SMTP_HOST
    };
  });

}