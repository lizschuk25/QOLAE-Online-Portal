// socketServer.js – Real-time Lawyers Tracking Database(ADMIN)API WebSocket Engine (api.qolae.com)

import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';
import https from 'https';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';


// Initialize Prisma client
const prisma = new PrismaClient();

const fastify = Fastify({ logger: true });

// 🛡️ CACHE-BUSTING MIDDLEWARE - Prevent stale content
fastify.addHook('onRequest', async (request, reply) => {
  // Add cache-busting headers to all responses
  reply.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
  reply.header('Last-Modified', new Date().toUTCString());
  reply.header('ETag', `"${Date.now()}"`);
});

fastify.register(fastifyIO, {
  cors: {
    origin: [
      'https://admin.qolae.com',
      'https://lawyers.qolae.com',
      'https://casemanagers.qolae.com',
      'https://clients.qolae.com',
      'https://readers.qolae.com'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// 🧠 WebSocket Event Logic
fastify.ready().then(() => {
  fastify.io.on('connection', (socket) => {
    const socketId = socket.id;
    console.log(`🟢 WebSocket connected: ${socketId}`);

    // Join admin room for real-time updates
    socket.join('admin-dashboard');

    // ================================
    // WORKFLOW EVENTS (for admin.qolae.com)
    // ================================

    // Ready to Generate Documents
    socket.on('ready-to-generate-documents', async (data) => {
      console.log(`📡 WebSocket: Ready to Generate Documents for PIN: ${data.pin}`);
      console.log(`📊 Received data:`, JSON.stringify(data, null, 2));
      
      // Validate input
      if (!data || !data.pin) {
        console.error(`❌ Invalid data received:`, data);
        socket.emit('workflow-result', {
          type: 'ready-to-generate-documents',
          pin: data?.pin || 'unknown',
          success: false,
          data: {
            error: 'Invalid data received - missing PIN'
          },
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      try {
        // Import and use the CheckboxLogic function directly
        const { handleReadyToGenerateDocuments } = await import('/var/www/admin.qolae.com/backend/src/scripts/CheckboxLogic.js');
        
        // Execute the workflow with socket for real-time updates
        const result = await handleReadyToGenerateDocuments(data.pin, socket);
        
        // Broadcast to all admin clients if successful
        if (result.success) {
          fastify.io.to('admin-dashboard').emit('workflow-update', {
            type: 'ready-to-generate-documents',
            pin: data.pin,
            success: true,
            message: result.alreadyCompleted ? 'Documents already generated!' : 'Documents generated successfully!'
          });
        }
        
      } catch (error) {
        console.error('❌ WebSocket workflow error:', error);
        socket.emit('workflow-error', {
          type: 'ready-to-generate-documents',
          pin: data.pin,
          error: error.message
        });
      }
    });

    // Send Email
    socket.on('send-email', async (data) => {
      console.log(`📡 WebSocket: Send Email for PIN: ${data.pin}`);
      
      try {
        // Validate input
        if (!data || !data.pin) {
          console.error(`❌ Invalid data received for send-email:`, data);
          socket.emit('workflow-result', {
            type: 'send-email',
            pin: data?.pin || 'unknown',
            success: false,
            data: {
              error: 'Invalid data received - missing PIN'
            },
            timestamp: new Date().toISOString()
          });
          return;
        }
        
        // Import and use the CheckboxLogic function directly
        const { handleSendEmail } = await import('/var/www/admin.qolae.com/backend/src/scripts/CheckboxLogic.js');
        
        // Execute the workflow with socket for real-time updates
        const result = await handleSendEmail(data.pin, socket);
        
        // Broadcast to all admin clients if successful
        if (result.success) {
          fastify.io.to('admin-dashboard').emit('workflow-update', {
            type: 'send-email',
            pin: data.pin,
            success: true,
            message: result.alreadyCompleted ? 'Email already sent!' : 'Email sent successfully!'
          });
        }
        
      } catch (error) {
        console.error('❌ WebSocket email error:', error);
        socket.emit('workflow-error', {
          type: 'send-email',
          pin: data.pin,
          error: error.message
        });
      }
    });

    // Push to Repository
    socket.on('push-to-repository', async (data) => {
      console.log(`📡 WebSocket: Push to Repository for PIN: ${data.pin}`);
      
      try {
        // Validate input
        if (!data || !data.pin) {
          console.error(`❌ Invalid data received for push-to-repository:`, data);
          socket.emit('workflow-result', {
            type: 'push-to-repository',
            pin: data?.pin || 'unknown',
            success: false,
            data: {
              error: 'Invalid data received - missing PIN'
            },
            timestamp: new Date().toISOString()
          });
          return;
        }
        
        // Import and use the CheckboxLogic function directly
        const { handlePushToCentralRepository } = await import('/var/www/admin.qolae.com/backend/src/scripts/CheckboxLogic.js');
        
        // Execute the workflow with socket for real-time updates
        const result = await handlePushToCentralRepository(data.pin, socket);
        
        // Broadcast to all admin clients if successful
        if (result.success) {
          fastify.io.to('admin-dashboard').emit('workflow-update', {
            type: 'push-to-repository',
            pin: data.pin,
            success: true,
            message: result.alreadyCompleted ? 'Already pushed to repository!' : 'Pushed to central repository successfully!'
          });
          
          // 🎉 CELEBRATION: Workflow Complete!
          if (result.workflowComplete) {
            console.log(`🎉 WORKFLOW COMPLETE for PIN: ${data.pin}!`);
            fastify.io.to('admin-dashboard').emit('workflow-celebration', {
              type: 'workflow-complete',
              pin: data.pin,
              message: '🎉 Workflow Complete! All steps sealed and successful!',
              timestamp: new Date().toISOString()
            });
          }
        }
        
      } catch (error) {
        console.error('❌ WebSocket push error:', error);
        socket.emit('workflow-error', {
          type: 'push-to-repository',
          pin: data.pin,
          error: error.message
        });
      }
    });

    // ================================
    // NOTES EVENTS (Real-time updates)
    // ================================
    
    // Add Note
    socket.on('add-note', async (data) => {
      console.log(`📝 WebSocket: Add Note for PIN: ${data.pin}`);
      
      try {
        // Import the Notes functions from Admin Dashboard
        const { addNoteForLawyer } = await import('/var/www/admin.qolae.com/backend/src/scripts/CheckboxLogic.js');
        
        // Add the note
        const result = await addNoteForLawyer(data.pin, data.text, data.author || 'admin');
        
        if (result.success) {
          // Broadcast to ALL admin dashboard clients for real-time update
          fastify.io.to('admin-dashboard').emit('notes-updated', {
            pin: data.pin,
            note: result.note,
            totalNotes: result.totalNotes,
            action: 'added',
            timestamp: new Date().toISOString()
          });
          
          // Send success to the requesting client
          socket.emit('note-result', {
            success: true,
            message: 'Note added successfully',
            note: result.note,
            totalNotes: result.totalNotes
          });
          
          console.log(`✅ Note added and broadcasted for PIN: ${data.pin}`);
        } else {
          socket.emit('note-result', {
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('❌ Error adding note:', error);
        socket.emit('note-result', {
          success: false,
          error: error.message
        });
      }
    });
    
    // Update Note
    socket.on('update-note', async (data) => {
      console.log(`✏️ WebSocket: Update Note ${data.noteId} for PIN: ${data.pin}`);
      
      try {
        const { updateNoteForLawyer } = await import('/var/www/admin.qolae.com/backend/src/scripts/CheckboxLogic.js');
        
        const result = await updateNoteForLawyer(data.pin, data.noteId, data.text, data.author || 'admin');
        
        if (result.success) {
          // Broadcast update to all clients
          fastify.io.to('admin-dashboard').emit('notes-updated', {
            pin: data.pin,
            note: result.note,
            totalNotes: result.totalNotes,
            action: 'updated',
            timestamp: new Date().toISOString()
          });
          
          socket.emit('note-result', {
            success: true,
            message: 'Note updated successfully'
          });
        } else {
          socket.emit('note-result', {
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('❌ Error updating note:', error);
        socket.emit('note-result', {
          success: false,
          error: error.message
        });
      }
    });
    
    // Delete Note
    socket.on('delete-note', async (data) => {
      console.log(`🗑️ WebSocket: Delete Note ${data.noteId} for PIN: ${data.pin}`);
      
      try {
        const { deleteNoteForLawyer } = await import('/var/www/admin.qolae.com/backend/src/scripts/CheckboxLogic.js');
        
        const result = await deleteNoteForLawyer(data.pin, data.noteId);
        
        if (result.success) {
          // Broadcast deletion to all clients
          fastify.io.to('admin-dashboard').emit('notes-updated', {
            pin: data.pin,
            deletedNoteId: data.noteId,
            totalNotes: result.totalNotes,
            action: 'deleted',
            timestamp: new Date().toISOString()
          });
          
          socket.emit('note-result', {
            success: true,
            message: 'Note deleted successfully'
          });
        } else {
          socket.emit('note-result', {
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        console.error('❌ Error deleting note:', error);
        socket.emit('note-result', {
          success: false,
          error: error.message
        });
      }
    });
    
    // Get Notes
    socket.on('get-notes', async (data) => {
      console.log(`📋 WebSocket: Get Notes for PIN: ${data.pin}`);
      
      try {
        const { getNotesForLawyer } = await import('/var/www/admin.qolae.com/backend/src/scripts/CheckboxLogic.js');
        
        const result = await getNotesForLawyer(data.pin);
        
        socket.emit('notes-data', {
          success: result.success,
          notes: result.notes || [],
          totalNotes: result.totalNotes || 0
        });
      } catch (error) {
        console.error('❌ Error getting notes:', error);
        socket.emit('notes-data', {
          success: false,
          error: error.message,
          notes: []
        });
      }
    });

    // ================================
    // QUEUE MONITORING EVENTS (for admin dashboard)
    // ================================
    
    // Start queue monitoring
    socket.on('queue-monitor-start', () => {
      console.log(`📊 Queue monitoring started for: ${socket.id}`);
      socket.join('queue-monitor');
      
      // Import and get current queue statistics
      (async () => {
        try {
          const { getQueueStatistics } = await import('/var/www/admin.qolae.com/backend/src/utils/WorkflowQueue.js');
          const stats = getQueueStatistics();
          
          socket.emit('queue-stats', {
            type: 'initial',
            statistics: stats,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error('❌ Error getting initial queue stats:', error);
        }
      })();
    });
    
    // Stop queue monitoring
    socket.on('queue-monitor-stop', () => {
      console.log(`📊 Queue monitoring stopped for: ${socket.id}`);
      socket.leave('queue-monitor');
    });
    
    // Add job to queue via WebSocket
    socket.on('queue-add-job', async (data) => {
      console.log(`📋 WebSocket: Add job to queue ${data.queueName}`);
      
      try {
        const { queueJob } = await import('/var/www/admin.qolae.com/backend/src/utils/WorkflowQueue.js');
        
        const jobId = await queueJob(data.queueName, data.jobData, {
          priority: data.priority || 5,
          maxRetries: data.maxRetries || 3
        });
        
        socket.emit('queue-job-added', {
          success: true,
          jobId,
          queueName: data.queueName,
          message: 'Job added to queue successfully'
        });
        
        // Broadcast to queue monitors
        fastify.io.to('queue-monitor').emit('queue-update', {
          type: 'job-added',
          queueName: data.queueName,
          jobId,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('❌ Error adding job to queue:', error);
        socket.emit('queue-job-added', {
          success: false,
          error: error.message
        });
      }
    });

    // ================================
    // LAWYER EVENTS (for future use)
    // ================================

    // Lawyer logs in
    socket.on('lawyerLoggedIn', ({ pin }) => {
      console.log(`👤 Lawyer logged in: ${pin}`);
      fastify.io.to('admin-dashboard').emit('adminNotify', {
        type: 'lawyerLoggedIn',
        pin,
        timestamp: new Date().toISOString()
      });
    });

    // Lawyer downloaded TOB
    socket.on('lawyerTOBDownloaded', ({ pin }) => {
      console.log(`📥 Lawyer downloaded TOB: ${pin}`);
      fastify.io.to('admin-dashboard').emit('adminNotify', {
        type: 'lawyerTOBDownloaded',
        pin,
        timestamp: new Date().toISOString()
      });
    });

    // Disconnect logging
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Disconnected ${socketId} — Reason: ${reason}`);
    });
  });
  
  console.log('🔌 WebSocket handlers registered');
});

// 🌐 Start server on port 3003 (correct port for api.qolae.com)
fastify.listen({ port: 3003, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error('❌ Failed to start WebSocket server:', err);
    process.exit(1);
  }
  console.log('✅ Socket.IO server running on port 3003');
  console.log('🔌 WebSocket server ready for real-time workflow updates');
}); 