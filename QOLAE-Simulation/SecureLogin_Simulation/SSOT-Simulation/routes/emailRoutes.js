import { sendEmail, testEmailConfig } from '../controllers/emailController.js';
import { generateIntroEmail } from '../utils/IntroductoryEmail.js';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma.js';

export default async function (fastify, opts) {
  
  // Test email configuration
  fastify.get('/test-config', async (request, reply) => {
    return await testEmailConfig(request, reply);
  });

  // Send email with attachments
  fastify.post('/send', async (request, reply) => {
    return await sendEmail(request, reply);
  });

  // Send Email Checkbox Workflow - When checkbox is ticked (from Admin Dashboard)
  fastify.post('/send-lawyer-email/:pin', async (req, reply) => {
    try {
      const { pin } = req.params;
      
      console.log(`📧 Send Email checkbox triggered for PIN: ${pin}`);
      
      // 1. Find the lawyer in database
      const lawyer = await prisma.lawyer.findUnique({
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
      
      console.log(`📧 Preparing to send email to: ${lawyer.contactName} at ${lawyer.email}`);
      
      // 4. Use custom email content if it exists, otherwise use template
      let emailContent, emailSubject;
      
      if (lawyer.customEmailContent && lawyer.customEmailContent.trim()) {
        emailContent = generateIntroEmail(lawyer, lawyer.customEmailContent);
        emailSubject = lawyer.customEmailSubject || "Thank You for Connecting with QOLAE – Let's Get Started";
        console.log(`📧 Using custom email content for sending to PIN: ${pin}`);
      } else {
        emailContent = generateIntroEmail(lawyer);
        emailSubject = "Thank You for Connecting with QOLAE – Let's Get Started";
        console.log(`📧 Using template email content for sending to PIN: ${pin}`);
      }
      
      // 5. Prepare attachment paths
      const attachments = [];
      
      // CV.pdf (always included)
      const cvPath = '/var/www/api.qolae.com/central-repository/original/CV.pdf';
      if (fs.existsSync(cvPath)) {
        attachments.push({
          name: 'CV.pdf',
          path: cvPath,
          type: 'PDF Document'
        });
      }
      
      // CaseStudies.pdf (always included)  
      const caseStudiesPath = '/var/www/api.qolae.com/central-repository/original/CaseStudies.pdf';
      if (fs.existsSync(caseStudiesPath)) {
        attachments.push({
          name: 'CaseStudies.pdf',
          path: caseStudiesPath,
          type: 'PDF Document'
        });
      }
      
      // Customized TOB.pdf (from temp folder)
      const customTOBPath = `/var/www/api.qolae.com/central-repository/temp/TOB_${pin}.pdf`;
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
        await prisma.lawyer.update({
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

  // Save Email Template
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
      
      // TODO: Add Prisma database connection to save to lawyer model
      console.log(`📧 Saving email template for PIN: ${pin}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content length: ${content.length} characters`);
      
      return reply.send({
        success: true,
        message: 'Email template saved successfully',
        pin: pin
      });
      
    } catch (error) {
      console.error('Error saving email template:', error);
      return reply.code(500).send({
        success: false,
        message: 'Internal server error',
        details: error.message
      });
    }
  });

  // Health check for email service
  fastify.get('/health', async (request, reply) => {
    return {
      service: 'email',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      smtpConfigured: !!process.env.SMTP_HOST
    };
  });

}; 