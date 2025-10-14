// ==============================================
// REFERENCE COLLECTION UTILITY
// ==============================================
// Agent: Sage
// Date: October 14, 2025
// Purpose: Utilities for collecting references (phone call or email)
// Dependencies: NotificationService
// ==============================================

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// ==============================================
// REFERENCE FORM STRUCTURE
// ==============================================
export const REFERENCE_QUESTIONS = {
  professional: [
    {
      id: 'relationship',
      question: 'What is/was your professional relationship with the candidate?',
      type: 'text',
      required: true
    },
    {
      id: 'duration',
      question: 'How long have you known the candidate in a professional capacity?',
      type: 'text',
      required: true
    },
    {
      id: 'role_description',
      question: 'What was the candidate\'s role and key responsibilities?',
      type: 'textarea',
      required: true
    },
    {
      id: 'performance',
      question: 'How would you rate the candidate\'s overall performance?',
      type: 'select',
      options: ['Outstanding', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement'],
      required: true
    },
    {
      id: 'strengths',
      question: 'What are the candidate\'s key professional strengths?',
      type: 'textarea',
      required: true
    },
    {
      id: 'areas_for_development',
      question: 'Are there any areas where the candidate could improve?',
      type: 'textarea',
      required: false
    },
    {
      id: 'reliability',
      question: 'How would you rate the candidate\'s reliability and punctuality?',
      type: 'select',
      options: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
      required: true
    },
    {
      id: 'teamwork',
      question: 'How well does the candidate work in a team environment?',
      type: 'select',
      options: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
      required: true
    },
    {
      id: 'professional_conduct',
      question: 'Can you comment on the candidate\'s professional conduct and integrity?',
      type: 'textarea',
      required: true
    },
    {
      id: 'would_rehire',
      question: 'Would you re-employ or work with this candidate again?',
      type: 'select',
      options: ['Yes, without hesitation', 'Yes, probably', 'Possibly', 'Probably not', 'No'],
      required: true
    },
    {
      id: 'additional_comments',
      question: 'Any additional comments or information you would like to share?',
      type: 'textarea',
      required: false
    }
  ],

  character: [
    {
      id: 'relationship',
      question: 'What is your relationship with the candidate?',
      type: 'text',
      required: true
    },
    {
      id: 'duration',
      question: 'How long have you known the candidate?',
      type: 'text',
      required: true
    },
    {
      id: 'context',
      question: 'In what context do you know the candidate?',
      type: 'textarea',
      required: true
    },
    {
      id: 'personal_qualities',
      question: 'What personal qualities would you highlight about the candidate?',
      type: 'textarea',
      required: true
    },
    {
      id: 'integrity',
      question: 'Can you comment on the candidate\'s integrity and trustworthiness?',
      type: 'textarea',
      required: true
    },
    {
      id: 'communication_skills',
      question: 'How would you describe the candidate\'s communication skills?',
      type: 'select',
      options: ['Excellent', 'Very Good', 'Good', 'Fair', 'Poor'],
      required: true
    },
    {
      id: 'work_ethic',
      question: 'How would you describe the candidate\'s work ethic and commitment?',
      type: 'textarea',
      required: true
    },
    {
      id: 'suitability',
      question: 'Do you believe the candidate is suitable for working with confidential medical reports?',
      type: 'select',
      options: ['Yes, definitely', 'Yes, probably', 'Unsure', 'Probably not', 'No'],
      required: true
    },
    {
      id: 'concerns',
      question: 'Do you have any concerns or reservations about the candidate?',
      type: 'textarea',
      required: false
    },
    {
      id: 'recommendation',
      question: 'Would you recommend this candidate for the position?',
      type: 'select',
      options: ['Yes, highly recommend', 'Yes, recommend', 'Recommend with reservations', 'Do not recommend'],
      required: true
    },
    {
      id: 'additional_comments',
      question: 'Any additional comments you would like to share?',
      type: 'textarea',
      required: false
    }
  ]
};

// ==============================================
// GENERATE REFERENCE FORM HTML (FOR EMAIL)
// ==============================================
export function generateReferenceFormHTML({ readerName, readerPin, referenceType, refereeName, formUrl }) {
  const logoUrl = 'https://api.qolae.com/central-repository/images/qolaeNewLogo.svg';
  const questions = REFERENCE_QUESTIONS[referenceType];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 20px auto;
          padding: 20px;
          line-height: 1.6;
          background-color: #f9fafb;
        }
        .container {
          background-color: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo img {
          max-width: 400px;
          height: auto;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 30px;
        }
        .header h2 {
          margin: 0;
          font-size: 24px;
        }
        .greeting {
          font-size: 16px;
          color: #374151;
          margin-bottom: 20px;
        }
        .info-box {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box strong {
          color: #1e40af;
        }
        .cta-button {
          display: inline-block;
          background: #10b981;
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
          text-align: center;
        }
        .cta-button:hover {
          background: #059669;
        }
        .questions-preview {
          background: #f3f4f6;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .questions-preview h3 {
          color: #693382;
          margin-top: 0;
        }
        .questions-preview ol {
          margin: 15px 0;
          padding-left: 25px;
        }
        .questions-preview li {
          margin-bottom: 10px;
          color: #374151;
        }
        .important-note {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .important-note strong {
          color: #92400e;
        }
        .signature {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
        }
        .signature p {
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <img src="${logoUrl}" alt="QOLAE Logo">
        </div>

        <div class="header">
          <h2>${referenceType === 'professional' ? 'Professional' : 'Character'} Reference Request</h2>
        </div>

        <p class="greeting">Dear ${refereeName},</p>

        <p>I hope this message finds you well. I am writing to request your assistance in providing a reference for <strong>${readerName}</strong>, who has applied to join our team at QOLAE as a report reviewer.</p>

        <div class="info-box">
          <p><strong>📋 Candidate Details:</strong></p>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li><strong>Name:</strong> ${readerName}</li>
            <li><strong>Reference PIN:</strong> ${readerPin}</li>
            <li><strong>Reference Type:</strong> ${referenceType === 'professional' ? 'Professional' : 'Character'}</li>
          </ul>
        </div>

        <p>As part of our HR compliance process, we require two references for all new team members. ${readerName} has nominated you as their <strong>${referenceType} reference</strong>.</p>

        <p><strong>What we need from you:</strong></p>
        <ul>
          <li>Complete the reference form via the secure link below</li>
          <li>Provide honest feedback about ${readerName}'s ${referenceType === 'professional' ? 'professional capabilities and work performance' : 'character, integrity, and suitability'}</li>
          <li>Digitally sign the reference form</li>
          <li>Estimated time to complete: <strong>10-15 minutes</strong></li>
        </ul>

        <div style="text-align: center;">
          <a href="${formUrl}" class="cta-button" target="_blank" rel="noopener noreferrer">
            📝 Complete Reference Form
          </a>
        </div>

        <div class="questions-preview">
          <h3>📋 Preview of Questions:</h3>
          <p style="color: #6b7280; font-style: italic;">The form includes the following areas:</p>
          <ol style="margin-top: 15px;">
            ${questions.slice(0, 5).map(q => `<li>${q.question}</li>`).join('')}
            <li style="color: #6b7280; font-style: italic;">...and ${questions.length - 5} more questions</li>
          </ol>
        </div>

        <div class="important-note">
          <p><strong>⚠️ Confidentiality Notice:</strong></p>
          <p style="margin: 10px 0;">This reference is confidential and will only be seen by QOLAE's HR Compliance team. The candidate will be notified that we have received your reference, but will not see the detailed contents unless required by law.</p>
        </div>

        <p>If you have any questions about this reference request or need to discuss the candidate in more detail, please don't hesitate to contact me directly.</p>

        <p><strong>Reference Link (valid for 14 days):</strong></p>
        <p style="background: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 14px;">
          <a href="${formUrl}" target="_blank">${formUrl}</a>
        </p>

        <p>Thank you very much for taking the time to provide this reference. Your input is invaluable in helping us make the right hiring decisions.</p>

        <br>
        <p>Kindest regards and Best wishes,</p>
        <br>
        <p><strong>Liz</strong></p>

        <div class="signature">
          <p>
            <strong>Liz Chukwu.RN</strong><br>
            Clinical Director & Case Manager<br>
            |Case Management & Rehabilitation|Clinical Negligence|Mediation|<br>
            E: <a href="mailto:Liz.Chukwu@qolae.com">Liz.Chukwu@qolae.com</a><br>
            T: 07960 247 764<br>
            QOLAE™
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==============================================
// SEND REFERENCE REQUEST EMAIL
// ==============================================
export async function sendReferenceRequestEmail({ readerName, readerPin, referenceType, refereeName, refereeEmail, formUrl }) {
  try {
    console.log('\n📧 === SENDING REFERENCE REQUEST EMAIL ===');
    console.log(`Referee: ${refereeName} (${refereeEmail})`);
    console.log(`Reference Type: ${referenceType}`);

    // Create transporter
    const transporter = nodemailer.createTransporter({
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

    // Verify SMTP connection
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully');
    } catch (smtpVerifyError) {
      console.error('❌ SMTP Verification Error:', smtpVerifyError);
      throw new Error('Failed to connect to email server');
    }

    // Generate email HTML
    const emailHtml = generateReferenceFormHTML({
      readerName,
      readerPin,
      referenceType,
      refereeName,
      formUrl
    });

    // Build email message
    const message = {
      from: process.env.EMAIL_FROM || 'Liz Chukwu <Liz.Chukwu@qolae.com>',
      to: refereeEmail,
      subject: `Reference Request for ${readerName} - QOLAE HR Compliance`,
      html: emailHtml
    };

    // Send email
    console.log('📤 Sending reference request email...');

    const info = await transporter.sendMail(message);

    console.log('✅ Reference request email sent successfully!');
    console.log('📧 Message ID:', info.messageId || 'not available');

    return {
      success: true,
      messageId: info.messageId || 'not available',
      recipient: refereeEmail
    };

  } catch (error) {
    console.error('❌ REFERENCE REQUEST EMAIL ERROR:', error);
    throw error;
  }
}

// ==============================================
// VALIDATE REFERENCE FORM DATA
// ==============================================
export function validateReferenceFormData(referenceType, formData) {
  const questions = REFERENCE_QUESTIONS[referenceType];
  const errors = [];

  questions.forEach(question => {
    if (question.required && (!formData[question.id] || formData[question.id].trim() === '')) {
      errors.push(`${question.question} is required`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ==============================================
// FORMAT REFERENCE FORM FOR DISPLAY
// ==============================================
export function formatReferenceFormDisplay(referenceType, formData) {
  const questions = REFERENCE_QUESTIONS[referenceType];

  return questions.map(question => ({
    question: question.question,
    answer: formData[question.id] || 'Not answered',
    type: question.type
  }));
}

// ==============================================
// EXPORT FUNCTIONS
// ==============================================
export default {
  REFERENCE_QUESTIONS,
  generateReferenceFormHTML,
  sendReferenceRequestEmail,
  validateReferenceFormData,
  formatReferenceFormDisplay
};
