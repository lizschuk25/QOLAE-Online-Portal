// ==============================================
// NOTIFICATION SERVICE
// ==============================================
// Purpose: Centralized notification system for HR Compliance Dashboard
// Author: Phoenix Agent
// Date: October 14, 2025
// Features: WebSocket, Email, SMS, In-app notifications
// ==============================================

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ==============================================
// NOTIFICATION TYPES
// ==============================================
export const NOTIFICATION_TYPE = {
  COMPLIANCE_SUBMITTED: 'compliance_submitted',
  REFERENCE_RECEIVED: 'reference_received',
  COMPLIANCE_APPROVED: 'compliance_approved',
  COMPLIANCE_REJECTED: 'compliance_rejected',
  NEW_STARTER_REGISTERED: 'new_starter_registered',
  SYSTEM_ALERT: 'system_alert',
  WORKFLOW_UPDATE: 'workflow_update'
};

export const NOTIFICATION_CHANNEL = {
  WEBSOCKET: 'websocket',
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app'
};

// ==============================================
// NOTIFICATION SERVICE CLASS
// ==============================================
export class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.websocketClients = new Map(); // Store active WebSocket connections
    this.initEmailTransporter();
  }

  // ==============================================
  // INITIALIZE EMAIL TRANSPORTER
  // ==============================================
  initEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransporter({
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
        debug: false,
        logger: false
      });
      
      console.log('✅ Email transporter initialized');
    } catch (error) {
      console.error('❌ Failed to initialize email transporter:', error);
    }
  }

  // ==============================================
  // REGISTER WEBSOCKET CLIENT
  // ==============================================
  registerWebSocketClient(clientId, socket) {
    this.websocketClients.set(clientId, socket);
    console.log(`🔌 WebSocket client registered: ${clientId}`);
  }

  // ==============================================
  // UNREGISTER WEBSOCKET CLIENT
  // ==============================================
  unregisterWebSocketClient(clientId) {
    this.websocketClients.delete(clientId);
    console.log(`🔌 WebSocket client unregistered: ${clientId}`);
  }

  // ==============================================
  // SEND NOTIFICATION (MAIN METHOD)
  // ==============================================
  async sendNotification(notification) {
    try {
      console.log(`\n📢 === SENDING NOTIFICATION ===`);
      console.log(`Type: ${notification.type}, Channel: ${notification.channel}`);
      console.log(`Recipient: ${notification.recipient}`);
      
      const results = [];
      
      // Send via WebSocket (always try this first for real-time updates)
      if (notification.channel === NOTIFICATION_CHANNEL.WEBSOCKET || 
          notification.channel === NOTIFICATION_CHANNEL.IN_APP) {
        const wsResult = await this.sendWebSocketNotification(notification);
        results.push(wsResult);
      }
      
      // Send via Email
      if (notification.channel === NOTIFICATION_CHANNEL.EMAIL) {
        const emailResult = await this.sendEmailNotification(notification);
        results.push(emailResult);
      }
      
      // Send via SMS (if configured)
      if (notification.channel === NOTIFICATION_CHANNEL.SMS) {
        const smsResult = await this.sendSMSNotification(notification);
        results.push(smsResult);
      }
      
      console.log(`✅ Notification sent successfully via ${results.length} channel(s)`);
      return {
        success: true,
        results,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      throw error;
    }
  }

  // ==============================================
  // SEND WEBSOCKET NOTIFICATION
  // ==============================================
  async sendWebSocketNotification(notification) {
    try {
      const message = {
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        timestamp: new Date().toISOString(),
        id: notification.id || this.generateNotificationId()
      };
      
      // Send to specific client if recipient is specified
      if (notification.recipient) {
        const client = this.websocketClients.get(notification.recipient);
        if (client && client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(message));
          console.log(`📡 WebSocket notification sent to ${notification.recipient}`);
          return { channel: 'websocket', success: true, recipient: notification.recipient };
        } else {
          console.warn(`⚠️ WebSocket client ${notification.recipient} not found or not connected`);
          return { channel: 'websocket', success: false, error: 'Client not connected' };
        }
      }
      
      // Broadcast to all connected clients
      let sentCount = 0;
      this.websocketClients.forEach((client, clientId) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(message));
          sentCount++;
        }
      });
      
      console.log(`📡 WebSocket notification broadcasted to ${sentCount} clients`);
      return { channel: 'websocket', success: true, recipients: sentCount };
      
    } catch (error) {
      console.error('❌ Failed to send WebSocket notification:', error);
      return { channel: 'websocket', success: false, error: error.message };
    }
  }

  // ==============================================
  // SEND EMAIL NOTIFICATION
  // ==============================================
  async sendEmailNotification(notification) {
    try {
      if (!this.emailTransporter) {
        throw new Error('Email transporter not initialized');
      }
      
      // Verify SMTP connection
      await this.emailTransporter.verify();
      
      const emailMessage = {
        from: process.env.EMAIL_FROM || 'QOLAE HR Compliance <noreply@qolae.com>',
        to: notification.recipient,
        subject: notification.title || 'QOLAE HR Compliance Notification',
        html: this.generateEmailHTML(notification),
        text: notification.message
      };
      
      const info = await this.emailTransporter.sendMail(emailMessage);
      
      console.log(`📧 Email notification sent to ${notification.recipient}`);
      return { 
        channel: 'email', 
        success: true, 
        recipient: notification.recipient,
        messageId: info.messageId 
      };
      
    } catch (error) {
      console.error('❌ Failed to send email notification:', error);
      return { channel: 'email', success: false, error: error.message };
    }
  }

  // ==============================================
  // SEND SMS NOTIFICATION (PLACEHOLDER)
  // ==============================================
  async sendSMSNotification(notification) {
    try {
      // This would integrate with an SMS service like Twilio
      console.log(`📱 SMS notification would be sent to ${notification.recipient}: ${notification.message}`);
      
      return { 
        channel: 'sms', 
        success: true, 
        recipient: notification.recipient,
        message: 'SMS service not configured'
      };
      
    } catch (error) {
      console.error('❌ Failed to send SMS notification:', error);
      return { channel: 'sms', success: false, error: error.message };
    }
  }

  // ==============================================
  // GENERATE EMAIL HTML
  // ==============================================
  generateEmailHTML(notification) {
    const logoUrl = 'https://api.qolae.com/central-repository/images/qolaeNewLogo.svg';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            line-height: 1.6;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo img {
            max-width: 200px;
            height: auto;
          }
          .notification-type {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .message {
            font-size: 16px;
            color: #374151;
            margin-bottom: 20px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <img src="${logoUrl}" alt="QOLAE Logo">
          </div>
          
          <div class="notification-type">
            ${notification.title || 'HR Compliance Notification'}
          </div>
          
          <div class="message">
            ${notification.message}
          </div>
          
          ${notification.data && notification.data.actionUrl ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${notification.data.actionUrl}" 
                 style="background: #10b981; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 8px; font-weight: bold;">
                Take Action
              </a>
            </div>
          ` : ''}
          
          <div class="footer">
            <p>This is an automated notification from QOLAE HR Compliance Dashboard.</p>
            <p>If you have any questions, please contact Liz at Liz.Chukwu@qolae.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // ==============================================
  // SPECIFIC NOTIFICATION METHODS
  // ==============================================
  
  // Compliance Submitted Notification
  async notifyComplianceSubmitted(personName, personType, complianceId) {
    const notification = {
      type: NOTIFICATION_TYPE.COMPLIANCE_SUBMITTED,
      channel: NOTIFICATION_CHANNEL.WEBSOCKET,
      title: 'New Compliance Submission',
      message: `${personName} (${personType}) has submitted their compliance documents`,
      data: {
        personName,
        personType,
        complianceId,
        actionUrl: `https://hrcompliance.qolae.com/compliance/review/${complianceId}`
      },
      recipient: 'liz' // Liz's WebSocket client ID
    };
    
    return await this.sendNotification(notification);
  }

  // Reference Received Notification
  async notifyReferenceReceived(personName, referenceType, complianceId) {
    const notification = {
      type: NOTIFICATION_TYPE.REFERENCE_RECEIVED,
      channel: NOTIFICATION_CHANNEL.WEBSOCKET,
      title: 'Reference Received',
      message: `${referenceType} reference received for ${personName}`,
      data: {
        personName,
        referenceType,
        complianceId,
        actionUrl: `https://hrcompliance.qolae.com/compliance/review/${complianceId}`
      },
      recipient: 'liz'
    };
    
    return await this.sendNotification(notification);
  }

  // Compliance Approved Notification
  async notifyComplianceApproved(personName, personEmail, personType) {
    const notification = {
      type: NOTIFICATION_TYPE.COMPLIANCE_APPROVED,
      channel: NOTIFICATION_CHANNEL.EMAIL,
      title: 'Compliance Approved - Welcome to QOLAE!',
      message: `Dear ${personName}, your compliance has been approved. You can now access your ${personType} dashboard.`,
      data: {
        personName,
        personType,
        dashboardUrl: personType === 'reader' ? 'https://readers.qolae.com' : 'https://casemanagers.qolae.com'
      },
      recipient: personEmail
    };
    
    return await this.sendNotification(notification);
  }

  // New Starter Registered Notification
  async notifyNewStarterRegistered(starterName, starterEmail, pin) {
    const notification = {
      type: NOTIFICATION_TYPE.NEW_STARTER_REGISTERED,
      channel: NOTIFICATION_CHANNEL.WEBSOCKET,
      title: 'New Starter Registered',
      message: `${starterName} has been registered as a new starter`,
      data: {
        starterName,
        starterEmail,
        pin,
        actionUrl: `https://hrcompliance.qolae.com/new-starter/${pin}`
      },
      recipient: 'liz'
    };
    
    return await this.sendNotification(notification);
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================
  
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get connected WebSocket clients count
  getConnectedClientsCount() {
    return this.websocketClients.size;
  }

  // Get list of connected client IDs
  getConnectedClientIds() {
    return Array.from(this.websocketClients.keys());
  }

  // ==============================================
  // HEALTH CHECK
  // ==============================================
  async healthCheck() {
    try {
      const health = {
        emailTransporter: !!this.emailTransporter,
        websocketClients: this.websocketClients.size,
        timestamp: new Date().toISOString()
      };
      
      // Test email connection if transporter exists
      if (this.emailTransporter) {
        try {
          await this.emailTransporter.verify();
          health.emailConnection = 'healthy';
        } catch (error) {
          health.emailConnection = 'unhealthy';
          health.emailError = error.message;
        }
      }
      
      return health;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// ==============================================
// CREATE SINGLETON INSTANCE
// ==============================================
const notificationService = new NotificationService();

// ==============================================
// DEFAULT EXPORT
// ==============================================
export default notificationService;
