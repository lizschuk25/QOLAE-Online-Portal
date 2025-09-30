// utils/WorkflowHealthMonitor.js (SSOT)
// 🚀 Real-Time Workflow Health Monitoring System for QOLAE
// Author: Claude & Liz 👑
// Purpose: Monitor workflow performance, detect bottlenecks, predict failures

import { PrismaClient } from '@prisma/client';
import EventEmitter from 'events';

const prisma = new PrismaClient();

// =====================================
// 🚀 WORKFLOW HEALTH MONITORING SYSTEM
// =====================================

export class WorkflowHealthMonitor extends EventEmitter {
  constructor() {
    super();
    
    // Performance thresholds
    this.thresholds = {
      avgDurationWarning: 30000,    // 30 seconds
      avgDurationCritical: 60000,   // 1 minute
      failureRateWarning: 0.1,      // 10% failure rate
      failureRateCritical: 0.25,    // 25% failure rate
      retryRateWarning: 0.2,        // 20% retry rate
      backlogWarning: 50,           // 50 pending workflows
      backlogCritical: 100,         // 100 pending workflows
    };
    
    // Real-time metrics storage
    this.metrics = {
      workflows: new Map(),         // Active workflows
      completed: [],                // Last 100 completed
      failed: [],                   // Last 50 failures
      performance: new Map(),       // Performance by step
      alerts: [],                   // Active alerts
      systemHealth: 100,            // Overall health score 0-100
    };
    
    // Start monitoring
    this.startMonitoring();
  }

  // 🏥 Calculate overall system health score
  calculateSystemHealth() {
    let healthScore = 100;
    const recentWorkflows = this.metrics.completed.slice(-50);
    
    if (recentWorkflows.length === 0) return healthScore;
    
    // Calculate failure rate
    const failures = recentWorkflows.filter(w => !w.success).length;
    const failureRate = failures / recentWorkflows.length;
    
    if (failureRate > this.thresholds.failureRateCritical) {
      healthScore -= 40;
    } else if (failureRate > this.thresholds.failureRateWarning) {
      healthScore -= 20;
    }
    
    // Calculate average duration
    const avgDuration = recentWorkflows.reduce((sum, w) => sum + (w.duration || 0), 0) / recentWorkflows.length;
    
    if (avgDuration > this.thresholds.avgDurationCritical) {
      healthScore -= 30;
    } else if (avgDuration > this.thresholds.avgDurationWarning) {
      healthScore -= 15;
    }
    
    // Check active alerts
    const criticalAlerts = this.metrics.alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = this.metrics.alerts.filter(a => a.severity === 'warning').length;
    
    healthScore -= (criticalAlerts * 10);
    healthScore -= (warningAlerts * 5);
    
    // Check backlog
    const activeCount = this.metrics.workflows.size;
    if (activeCount > this.thresholds.backlogCritical) {
      healthScore -= 20;
    } else if (activeCount > this.thresholds.backlogWarning) {
      healthScore -= 10;
    }
    
    return Math.max(0, Math.min(100, healthScore));
  }

  // 📊 Record workflow start
  recordWorkflowStart(pin, step, metadata = {}) {
    const workflowId = `${pin}-${step}-${Date.now()}`;
    
    const workflow = {
      id: workflowId,
      pin,
      step,
      startTime: Date.now(),
      status: 'running',
      metadata,
      retries: 0,
    };
    
    this.metrics.workflows.set(workflowId, workflow);
    
    // Emit event for real-time dashboard
    this.emit('workflow:started', workflow);
    
    console.log(`📊 Monitoring workflow start: ${step} for PIN: ${pin}`);
    
    return workflowId;
  }

  // ✅ Record workflow completion
  recordWorkflowComplete(workflowId, success = true, details = {}) {
    const workflow = this.metrics.workflows.get(workflowId);
    
    if (!workflow) {
      console.warn(`⚠️ Unknown workflow: ${workflowId}`);
      return;
    }
    
    workflow.endTime = Date.now();
    workflow.duration = workflow.endTime - workflow.startTime;
    workflow.success = success;
    workflow.status = success ? 'completed' : 'failed';
    workflow.details = details;
    
    // Move to completed/failed list
    if (success) {
      this.metrics.completed.push(workflow);
      // Keep only last 100
      if (this.metrics.completed.length > 100) {
        this.metrics.completed.shift();
      }
    } else {
      this.metrics.failed.push(workflow);
      // Keep only last 50
      if (this.metrics.failed.length > 50) {
        this.metrics.failed.shift();
      }
    }
    
    // Remove from active
    this.metrics.workflows.delete(workflowId);
    
    // Update performance metrics
    this.updatePerformanceMetrics(workflow);
    
    // Check for alerts
    this.checkAlerts(workflow);
    
    // Update system health
    this.metrics.systemHealth = this.calculateSystemHealth();
    
    // Emit event
    this.emit('workflow:completed', workflow);
    
    console.log(`📊 Workflow ${success ? 'completed' : 'failed'}: ${workflow.step} for PIN: ${workflow.pin} (${workflow.duration}ms)`);
  }

  // 🔄 Record workflow retry
  recordWorkflowRetry(workflowId, attemptNumber) {
    const workflow = this.metrics.workflows.get(workflowId);
    
    if (workflow) {
      workflow.retries = attemptNumber;
      workflow.lastRetryTime = Date.now();
      
      this.emit('workflow:retry', {
        ...workflow,
        attemptNumber
      });
      
      console.log(`🔄 Workflow retry #${attemptNumber}: ${workflow.step} for PIN: ${workflow.pin}`);
    }
  }

  // 📈 Update performance metrics
  updatePerformanceMetrics(workflow) {
    const stepKey = workflow.step;
    
    if (!this.metrics.performance.has(stepKey)) {
      this.metrics.performance.set(stepKey, {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
      });
    }
    
    const perf = this.metrics.performance.get(stepKey);
    
    perf.count++;
    perf.totalDuration += workflow.duration;
    perf.avgDuration = perf.totalDuration / perf.count;
    perf.minDuration = Math.min(perf.minDuration, workflow.duration);
    perf.maxDuration = Math.max(perf.maxDuration, workflow.duration);
    
    if (workflow.success) {
      perf.successCount++;
    } else {
      perf.failureCount++;
    }
    
    perf.successRate = perf.successCount / perf.count;
  }

  // 🚨 Check and generate alerts
  checkAlerts(workflow) {
    const alerts = [];
    
    // Check for slow workflows
    if (workflow.duration > this.thresholds.avgDurationCritical) {
      alerts.push({
        id: `alert-${Date.now()}-slow`,
        type: 'performance',
        severity: 'critical',
        message: `Critical: ${workflow.step} took ${workflow.duration}ms for PIN ${workflow.pin}`,
        timestamp: new Date().toISOString(),
        workflow
      });
    } else if (workflow.duration > this.thresholds.avgDurationWarning) {
      alerts.push({
        id: `alert-${Date.now()}-slow`,
        type: 'performance',
        severity: 'warning',
        message: `Warning: ${workflow.step} took ${workflow.duration}ms for PIN ${workflow.pin}`,
        timestamp: new Date().toISOString(),
        workflow
      });
    }
    
    // Check step failure rate
    const stepPerf = this.metrics.performance.get(workflow.step);
    if (stepPerf && stepPerf.count > 10) {
      const failureRate = stepPerf.failureCount / stepPerf.count;
      
      if (failureRate > this.thresholds.failureRateCritical) {
        alerts.push({
          id: `alert-${Date.now()}-failure`,
          type: 'reliability',
          severity: 'critical',
          message: `Critical: ${workflow.step} has ${(failureRate * 100).toFixed(1)}% failure rate`,
          timestamp: new Date().toISOString()
        });
      } else if (failureRate > this.thresholds.failureRateWarning) {
        alerts.push({
          id: `alert-${Date.now()}-failure`,
          type: 'reliability',
          severity: 'warning',
          message: `Warning: ${workflow.step} has ${(failureRate * 100).toFixed(1)}% failure rate`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Add new alerts
    alerts.forEach(alert => {
      this.metrics.alerts.push(alert);
      this.emit('alert:new', alert);
    });
    
    // Keep only last 50 alerts
    if (this.metrics.alerts.length > 50) {
      this.metrics.alerts = this.metrics.alerts.slice(-50);
    }
  }

  // 📊 Get current health metrics
  getHealthMetrics() {
    const activeWorkflows = Array.from(this.metrics.workflows.values());
    const performanceStats = {};
    
    this.metrics.performance.forEach((stats, step) => {
      performanceStats[step] = {
        ...stats,
        avgDurationFormatted: `${(stats.avgDuration / 1000).toFixed(2)}s`,
        successRatePercent: `${(stats.successRate * 100).toFixed(1)}%`
      };
    });
    
    return {
      systemHealth: this.metrics.systemHealth,
      activeWorkflows: activeWorkflows.length,
      activeWorkflowsList: activeWorkflows,
      recentCompleted: this.metrics.completed.slice(-10),
      recentFailed: this.metrics.failed.slice(-10),
      performanceByStep: performanceStats,
      activeAlerts: this.metrics.alerts.filter(a => 
        new Date() - new Date(a.timestamp) < 3600000 // Last hour
      ),
      statistics: this.calculateStatistics(),
      timestamp: new Date().toISOString()
    };
  }

  // 📈 Calculate detailed statistics
  calculateStatistics() {
    const last24h = Date.now() - (24 * 60 * 60 * 1000);
    const lastHour = Date.now() - (60 * 60 * 1000);
    
    const recent24h = [...this.metrics.completed, ...this.metrics.failed]
      .filter(w => w.startTime > last24h);
    
    const recentHour = [...this.metrics.completed, ...this.metrics.failed]
      .filter(w => w.startTime > lastHour);
    
    return {
      last24Hours: {
        total: recent24h.length,
        successful: recent24h.filter(w => w.success).length,
        failed: recent24h.filter(w => !w.success).length,
        avgDuration: recent24h.reduce((sum, w) => sum + w.duration, 0) / (recent24h.length || 1)
      },
      lastHour: {
        total: recentHour.length,
        successful: recentHour.filter(w => w.success).length,
        failed: recentHour.filter(w => !w.success).length,
        avgDuration: recentHour.reduce((sum, w) => sum + w.duration, 0) / (recentHour.length || 1)
      },
      predictions: this.generatePredictions()
    };
  }

  // 🔮 Generate predictive insights
  generatePredictions() {
    const predictions = [];
    
    // Trend analysis
    const recentMetrics = this.metrics.completed.slice(-20);
    if (recentMetrics.length >= 10) {
      const firstHalf = recentMetrics.slice(0, 10);
      const secondHalf = recentMetrics.slice(10);
      
      const firstAvg = firstHalf.reduce((sum, w) => sum + w.duration, 0) / 10;
      const secondAvg = secondHalf.reduce((sum, w) => sum + w.duration, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg * 1.5) {
        predictions.push({
          type: 'performance_degradation',
          message: 'Performance is degrading - workflows are taking 50% longer',
          severity: 'warning'
        });
      }
    }
    
    // Bottleneck detection
    this.metrics.performance.forEach((stats, step) => {
      if (stats.avgDuration > this.thresholds.avgDurationWarning) {
        predictions.push({
          type: 'bottleneck',
          message: `${step} is a bottleneck - avg time: ${(stats.avgDuration/1000).toFixed(1)}s`,
          severity: 'info'
        });
      }
    });
    
    // Failure prediction
    const recentFailureRate = this.metrics.failed.length / 
      (this.metrics.completed.length + this.metrics.failed.length);
    
    if (recentFailureRate > 0.15) {
      predictions.push({
        type: 'high_failure_risk',
        message: `High failure risk detected - ${(recentFailureRate * 100).toFixed(1)}% failure rate`,
        severity: 'critical'
      });
    }
    
    return predictions;
  }

  // 🔄 Start monitoring loop
  startMonitoring() {
    // Update health every 30 seconds
    setInterval(() => {
      this.metrics.systemHealth = this.calculateSystemHealth();
      this.emit('health:update', this.getHealthMetrics());
    }, 30000);
    
    // Clean up old data every 5 minutes
    setInterval(() => {
      this.cleanupOldData();
    }, 300000);
    
    console.log('🚀 Workflow Health Monitor started');
  }

  // 🧹 Clean up old data
  cleanupOldData() {
    // Clean up stuck workflows (older than 10 minutes)
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    
    this.metrics.workflows.forEach((workflow, id) => {
      if (workflow.startTime < tenMinutesAgo) {
        console.warn(`⚠️ Cleaning up stuck workflow: ${id}`);
        this.recordWorkflowComplete(id, false, { reason: 'timeout' });
      }
    });
  }

  // 📊 Export metrics for analysis
  async exportMetrics() {
    return {
      exportTime: new Date().toISOString(),
      systemHealth: this.metrics.systemHealth,
      performance: Object.fromEntries(this.metrics.performance),
      recentCompleted: this.metrics.completed,
      recentFailed: this.metrics.failed,
      alerts: this.metrics.alerts
    };
  }
}

// Create singleton instance
const healthMonitor = new WorkflowHealthMonitor();

// Export convenience functions
export function monitorWorkflowStart(pin, step, metadata) {
  return healthMonitor.recordWorkflowStart(pin, step, metadata);
}

export function monitorWorkflowComplete(workflowId, success, details) {
  return healthMonitor.recordWorkflowComplete(workflowId, success, details);
}

export function monitorWorkflowRetry(workflowId, attemptNumber) {
  return healthMonitor.recordWorkflowRetry(workflowId, attemptNumber);
}

export function getHealthMetrics() {
  return healthMonitor.getHealthMetrics();
}

export default healthMonitor;