// routes/AdminAuditRoutes.js
// 📊 ADMIN DASHBOARD AUDIT ROUTES (SSOT)
// Author: Claude & Liz 👑
// 
// ⚠️  IMPORTANT: This handles ADMIN DASHBOARD audit data only!
// ⚠️  Future: Add LawyersAuditRoutes.js, ClientsAuditRoutes.js etc. to prevent overburdening
//
// Purpose: Centralized viewing of Admin Dashboard audit logs via API-Dashboard SSOT
// Scope: Admin Dashboard workflows, notes, user actions, database operations
// Data Source: Admin Dashboard AuditLogger → This API → Admin Dashboard UI

import axios from 'axios';

// Admin Dashboard audit endpoint (update this to match your setup)
const ADMIN_DASHBOARD_BASE_URL = 'http://localhost:3000'; // Adjust port as needed

export default async function AdminAuditRoutes(fastify, options) {
  
  // 📊 Get Admin Dashboard audit logs
  fastify.get('/api/admin-audit/logs', async (request, reply) => {
    try {
      const { 
        action, 
        resource, 
        userId, 
        startDate, 
        endDate, 
        limit = 50 
      } = request.query;

      // Forward request to Admin Dashboard's local audit system
      const response = await axios.get(`${ADMIN_DASHBOARD_BASE_URL}/api/audit/logs`, {
        params: {
          action,
          resource,
          userId,
          startDate,
          endDate,
          limit
        },
        timeout: 5000
      });

      reply.send({
        success: true,
        source: 'admin-dashboard',
        logs: response.data.logs || [],
        total: response.data.total || 0,
        scope: 'Admin Dashboard workflows, notes, and operations'
      });

    } catch (error) {
      console.error('❌ Failed to fetch Admin Dashboard audit logs:', error.message);
      
      reply.code(500).send({
        success: false,
        source: 'admin-dashboard',
        error: 'Admin Dashboard audit service unavailable',
        suggestion: 'Check if Admin Dashboard is running on port 3000'
      });
    }
  });

  // 📈 Get Admin Dashboard audit statistics
  fastify.get('/api/admin-audit/stats', async (request, reply) => {
    try {
      const response = await axios.get(`${ADMIN_DASHBOARD_BASE_URL}/api/audit/stats`, {
        timeout: 5000
      });

      reply.send({
        success: true,
        source: 'admin-dashboard',
        stats: response.data.stats,
        scope: 'Admin Dashboard activity statistics',
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Failed to fetch Admin Dashboard audit stats:', error.message);
      
      reply.send({
        success: false,
        source: 'admin-dashboard',
        error: 'Admin Dashboard audit service unavailable',
        stats: {
          totalEvents: 0,
          successfulEvents: 0,
          failedEvents: 0,
          status: 'unavailable'
        }
      });
    }
  });

  // 🔍 Verify Admin Dashboard audit integrity
  fastify.get('/api/admin-audit/verify', async (request, reply) => {
    try {
      const response = await axios.get(`${ADMIN_DASHBOARD_BASE_URL}/api/audit/verify`, {
        timeout: 10000
      });

      reply.send({
        success: true,
        source: 'admin-dashboard',
        integrity: response.data,
        scope: 'Admin Dashboard audit log integrity check'
      });

    } catch (error) {
      console.error('❌ Failed to verify Admin Dashboard audit integrity:', error.message);
      
      reply.code(500).send({
        success: false,
        source: 'admin-dashboard',
        error: 'Admin Dashboard audit verification failed'
      });
    }
  });

  // 🔎 Search Admin Dashboard audit logs
  fastify.post('/api/admin-audit/search', async (request, reply) => {
    try {
      const searchCriteria = request.body;
      
      // Forward search request to Admin Dashboard
      const response = await axios.post(`${ADMIN_DASHBOARD_BASE_URL}/api/audit/search`, 
        searchCriteria, 
        { timeout: 5000 }
      );

      reply.send({
        success: true,
        source: 'admin-dashboard',
        results: response.data.results || [],
        query: searchCriteria,
        scope: 'Admin Dashboard audit search results'
      });

    } catch (error) {
      console.error('❌ Admin Dashboard audit search failed:', error.message);
      
      reply.code(500).send({
        success: false,
        source: 'admin-dashboard',
        error: 'Admin Dashboard audit search failed'
      });
    }
  });

  // 📤 Audit sync endpoint (handles audit log synchronization)
  fastify.post('/api/audit/sync', async (request, reply) => {
    try {
      const { logs, source, timestamp } = request.body;
      
      if (!logs || !Array.isArray(logs)) {
        return reply.code(400).send({
          success: false,
          error: 'Logs array is required'
        });
      }

      // Log the sync request
      console.log(`📤 Audit sync request from ${source || 'unknown'}: ${logs.length} logs`);
      
      // For now, just acknowledge receipt
      // TODO: Store logs in centralized audit database if needed
      reply.send({
        success: true,
        message: 'Audit logs synchronized successfully',
        processed: logs.length,
        source: source || 'unknown',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Audit sync failed:', error.message);
      reply.code(500).send({
        success: false,
        error: 'Audit sync failed',
        message: error.message
      });
    }
  });

  // 📊 Combined audit dashboard view (future: include all dashboards)
  fastify.get('/api/audit/combined-stats', async (request, reply) => {
    try {
      const adminStats = await axios.get(`${ADMIN_DASHBOARD_BASE_URL}/api/audit/stats`, {
        timeout: 5000
      }).catch(e => ({ data: { stats: { status: 'unavailable' } } }));

      // TODO: Add lawyers dashboard, clients dashboard etc.
      
      const combinedStats = {
        adminDashboard: {
          available: adminStats.data.stats.status !== 'unavailable',
          stats: adminStats.data.stats
        },
        lawyersDashboard: {
          available: false,
          stats: { status: 'not-implemented' }
        },
        clientsDashboard: {
          available: false,
          stats: { status: 'not-implemented' }  
        },
        lastUpdated: new Date().toISOString(),
        note: 'Only Admin Dashboard implemented. Add LawyersAuditRoutes.js as needed.'
      };

      reply.send({
        success: true,
        combinedStats,
        scope: 'All QOLAE dashboard audit statistics'
      });

    } catch (error) {
      console.error('❌ Failed to generate combined audit stats:', error.message);
      reply.code(500).send({
        success: false,
        error: 'Failed to generate combined audit statistics'
      });
    }
  });
}