// routes/HealthMonitorRoutes.js (SSOT)
// 🚀 Workflow Health Monitoring API Routes for QOLAE
// Author: Claude & Liz 👑
// Purpose: Real-time health monitoring, performance metrics, predictive alerts

import healthMonitor, { 
  monitorWorkflowStart, 
  monitorWorkflowComplete,
  monitorWorkflowRetry,
  getHealthMetrics,
} from '../utils/WorkflowHealthMonitor.js';

export default async function HealthMonitorRoutes(fastify, options) {
  
  // 📊 Get current health metrics
  fastify.get('/api/health/metrics', async (request, reply) => {
    try {
      const metrics = getHealthMetrics();
      
      reply.send({
        success: true,
        metrics,
        healthStatus: getHealthStatus(metrics.systemHealth)
      });
      
    } catch (error) {
      console.error('❌ Health metrics error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get health metrics'
      });
    }
  });
  
  // 🚀 Record workflow start
  fastify.post('/api/health/workflow/start', async (request, reply) => {
    try {
      const { pin, step, metadata = {} } = request.body;
      
      if (!pin || !step) {
        return reply.code(400).send({
          success: false,
          error: 'PIN and step are required'
        });
      }
      
      const workflowId = monitorWorkflowStart(pin, step, metadata);
      
      reply.send({
        success: true,
        workflowId,
        message: 'Workflow monitoring started'
      });
      
    } catch (error) {
      console.error('❌ Workflow start monitoring error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to start workflow monitoring'
      });
    }
  });
  
  // ✅ Record workflow completion
  fastify.post('/api/health/workflow/complete', async (request, reply) => {
    try {
      const { workflowId, success = true, details = {} } = request.body;
      
      if (!workflowId) {
        return reply.code(400).send({
          success: false,
          error: 'Workflow ID is required'
        });
      }
      
      monitorWorkflowComplete(workflowId, success, details);
      
      reply.send({
        success: true,
        message: 'Workflow completion recorded'
      });
      
    } catch (error) {
      console.error('❌ Workflow complete monitoring error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to record workflow completion'
      });
    }
  });
  
  // 🔄 Record workflow retry
  fastify.post('/api/health/workflow/retry', async (request, reply) => {
    try {
      const { workflowId, attemptNumber } = request.body;
      
      if (!workflowId || !attemptNumber) {
        return reply.code(400).send({
          success: false,
          error: 'Workflow ID and attempt number are required'
        });
      }
      
      monitorWorkflowRetry(workflowId, attemptNumber);
      
      reply.send({
        success: true,
        message: 'Workflow retry recorded'
      });
      
    } catch (error) {
      console.error('❌ Workflow retry monitoring error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to record workflow retry'
      });
    }
  });
  
  // 🚨 Get active alerts
  fastify.get('/api/health/alerts', async (request, reply) => {
    try {
      const metrics = getHealthMetrics();
      const { severity } = request.query;
      
      let alerts = metrics.activeAlerts;
      
      if (severity) {
        alerts = alerts.filter(a => a.severity === severity);
      }
      
      reply.send({
        success: true,
        alerts,
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      });
      
    } catch (error) {
      console.error('❌ Alerts fetch error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get alerts'
      });
    }
  });
  
  // 📈 Get performance statistics
  fastify.get('/api/health/performance', async (request, reply) => {
    try {
      const metrics = getHealthMetrics();
      
      reply.send({
        success: true,
        performance: metrics.performanceByStep,
        statistics: metrics.statistics,
        systemHealth: metrics.systemHealth
      });
      
    } catch (error) {
      console.error('❌ Performance metrics error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get performance metrics'
      });
    }
  });
  
  // 🔮 Get predictions and insights
  fastify.get('/api/health/predictions', async (request, reply) => {
    try {
      const metrics = getHealthMetrics();
      
      reply.send({
        success: true,
        predictions: metrics.statistics.predictions,
        insights: generateInsights(metrics)
      });
      
    } catch (error) {
      console.error('❌ Predictions error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get predictions'
      });
    }
  });
  
  // 📊 Export metrics for analysis
  fastify.get('/api/health/export', async (request, reply) => {
    try {
      const exportData = await healthMonitor.exportMetrics();
      
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="health-metrics-${Date.now()}.json"`);
      reply.send(exportData);
      
    } catch (error) {
      console.error('❌ Export error:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to export metrics'
      });
    }
  });
  
  // 🌊 WebSocket endpoint for real-time monitoring
  fastify.get('/api/health/stream', { websocket: true }, (connection, req) => {
    console.log('📡 Health monitor WebSocket connected');
    
    // Send initial metrics
    connection.socket.send(JSON.stringify({
      type: 'initial',
      data: getHealthMetrics()
    }));
    
    // Subscribe to health events
    const handlers = {
      'workflow:started': (data) => {
        connection.socket.send(JSON.stringify({
          type: 'workflow_started',
          data
        }));
      },
      'workflow:completed': (data) => {
        connection.socket.send(JSON.stringify({
          type: 'workflow_completed',
          data
        }));
      },
      'workflow:retry': (data) => {
        connection.socket.send(JSON.stringify({
          type: 'workflow_retry',
          data
        }));
      },
      'alert:new': (data) => {
        connection.socket.send(JSON.stringify({
          type: 'alert',
          data
        }));
      },
      'health:update': (data) => {
        connection.socket.send(JSON.stringify({
          type: 'health_update',
          data
        }));
      }
    };
    
    // Register all handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      healthMonitor.on(event, handler);
    });
    
    // Cleanup on disconnect
    connection.socket.on('close', () => {
      console.log('📡 Health monitor WebSocket disconnected');
      // Remove all handlers
      Object.entries(handlers).forEach(([event, handler]) => {
        healthMonitor.off(event, handler);
      });
    });
  });
}

// Helper function to get health status
function getHealthStatus(score) {
  if (score >= 90) return '🟢 Excellent';
  if (score >= 75) return '🟡 Good';
  if (score >= 50) return '🟠 Fair';
  if (score >= 25) return '🔴 Poor';
  return '💀 Critical';
}

// Generate actionable insights
function generateInsights(metrics) {
  const insights = [];
  
  // Check system health
  if (metrics.systemHealth < 50) {
    insights.push({
      type: 'action_required',
      message: 'System health is critical. Immediate attention needed.',
      priority: 'high'
    });
  }
  
  // Check active workflows
  if (metrics.activeWorkflows > 20) {
    insights.push({
      type: 'optimization',
      message: `${metrics.activeWorkflows} workflows running. Consider scaling resources.`,
      priority: 'medium'
    });
  }
  
  // Check failure patterns
  const failedSteps = {};
  metrics.recentFailed.forEach(w => {
    failedSteps[w.step] = (failedSteps[w.step] || 0) + 1;
  });
  
  Object.entries(failedSteps).forEach(([step, count]) => {
    if (count > 3) {
      insights.push({
        type: 'pattern_detected',
        message: `${step} has failed ${count} times recently`,
        priority: 'high'
      });
    }
  });
  
  return insights;
}