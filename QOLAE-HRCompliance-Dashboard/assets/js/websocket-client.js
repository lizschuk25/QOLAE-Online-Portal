// ==============================================
// QOLAE HR COMPLIANCE DASHBOARD - WEBSOCKET CLIENT
// ==============================================
// Purpose: WebSocket client for real-time communication
// Author: Phoenix Agent
// Date: October 14, 2025
// ==============================================

// ==============================================
// WEBSOCKET CLIENT CLASS
// ==============================================
class WebSocketClient {
    constructor(options = {}) {
        this.url = options.url || this.getWebSocketUrl();
        this.protocols = options.protocols || [];
        this.reconnectInterval = options.reconnectInterval || 3000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        this.heartbeatInterval = options.heartbeatInterval || 30000;
        
        this.ws = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.heartbeatTimer = null;
        this.reconnectTimer = null;
        
        this.messageHandlers = new Map();
        this.connectionHandlers = [];
        this.disconnectionHandlers = [];
        this.errorHandlers = [];
        
        this.messageQueue = [];
        this.isReconnecting = false;
        
        // Initialize connection
        this.connect();
    }

    // ==============================================
    // CONNECTION MANAGEMENT
    // ==============================================
    getWebSocketUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        return `${protocol}//${host}/ws`;
    }

    connect() {
        try {
            console.log('🔌 Connecting to WebSocket server...');
            
            this.ws = new WebSocket(this.url, this.protocols);
            
            this.ws.onopen = (event) => {
                console.log('✅ WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.isReconnecting = false;
                
                // Start heartbeat
                this.startHeartbeat();
                
                // Process queued messages
                this.processMessageQueue();
                
                // Notify connection handlers
                this.connectionHandlers.forEach(handler => handler(event));
                
                // Send connection notification
                this.showConnectionStatus('Connected', 'success');
            };
            
            this.ws.onmessage = (event) => {
                this.handleMessage(event);
            };
            
            this.ws.onclose = (event) => {
                console.log('🔌 WebSocket connection closed:', event.code, event.reason);
                this.isConnected = false;
                this.stopHeartbeat();
                
                // Notify disconnection handlers
                this.disconnectionHandlers.forEach(handler => handler(event));
                
                // Attempt to reconnect if not a clean close
                if (event.code !== 1000 && !this.isReconnecting) {
                    this.attemptReconnect();
                } else {
                    this.showConnectionStatus('Disconnected', 'error');
                }
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.errorHandlers.forEach(handler => handler(error));
                this.showConnectionStatus('Connection Error', 'error');
            };
            
        } catch (error) {
            console.error('❌ Failed to create WebSocket connection:', error);
            this.handleConnectionError(error);
        }
    }

    disconnect() {
        console.log('🔌 Disconnecting WebSocket...');
        this.isReconnecting = true;
        this.stopHeartbeat();
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        
        this.isConnected = false;
    }

    // ==============================================
    // RECONNECTION LOGIC
    // ==============================================
    attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            this.showConnectionStatus('Connection Failed', 'error');
            return;
        }
        
        this.reconnectAttempts++;
        this.isReconnecting = true;
        
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.showConnectionStatus(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`, 'warning');
        
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, this.reconnectInterval);
    }

    // ==============================================
    // HEARTBEAT MECHANISM
    // ==============================================
    startHeartbeat() {
        this.stopHeartbeat(); // Clear any existing heartbeat
        
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.send({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }
        }, this.heartbeatInterval);
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    // ==============================================
    // MESSAGE HANDLING
    // ==============================================
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            // Handle pong responses
            if (data.type === 'pong') {
                console.log('🏓 Received pong from server');
                return;
            }
            
            console.log('📨 Received WebSocket message:', data);
            
            // Route message to appropriate handler
            this.routeMessage(data);
            
        } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
        }
    }

    routeMessage(data) {
        const { type, ...payload } = data;
        
        // Get handlers for this message type
        const handlers = this.messageHandlers.get(type) || [];
        
        if (handlers.length === 0) {
            console.warn(`⚠️ No handlers registered for message type: ${type}`);
            return;
        }
        
        // Execute all handlers for this message type
        handlers.forEach(handler => {
            try {
                handler(payload, data);
            } catch (error) {
                console.error(`❌ Error in message handler for ${type}:`, error);
            }
        });
    }

    // ==============================================
    // MESSAGE SENDING
    // ==============================================
    send(data) {
        if (!this.isConnected || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket not connected, queuing message:', data);
            this.messageQueue.push(data);
            return false;
        }
        
        try {
            const message = JSON.stringify(data);
            this.ws.send(message);
            console.log('📤 Sent WebSocket message:', data);
            return true;
        } catch (error) {
            console.error('❌ Failed to send WebSocket message:', error);
            this.messageQueue.push(data); // Queue for retry
            return false;
        }
    }

    processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        console.log(`📤 Processing ${this.messageQueue.length} queued messages...`);
        
        const messages = [...this.messageQueue];
        this.messageQueue = [];
        
        messages.forEach(message => {
            this.send(message);
        });
    }

    // ==============================================
    // EVENT HANDLERS
    // ==============================================
    onMessage(type, handler) {
        if (!this.messageHandlers.has(type)) {
            this.messageHandlers.set(type, []);
        }
        this.messageHandlers.get(type).push(handler);
    }

    offMessage(type, handler) {
        if (!this.messageHandlers.has(type)) return;
        
        const handlers = this.messageHandlers.get(type);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
        }
    }

    onConnect(handler) {
        this.connectionHandlers.push(handler);
    }

    onDisconnect(handler) {
        this.disconnectionHandlers.push(handler);
    }

    onError(handler) {
        this.errorHandlers.push(handler);
    }

    // ==============================================
    // HR COMPLIANCE SPECIFIC HANDLERS
    // ==============================================
    setupHRComplianceHandlers() {
        console.log('🏢 Setting up HR Compliance WebSocket handlers...');
        
        // Compliance submitted handler
        this.onMessage('compliance_submitted', (payload) => {
            console.log('📋 Compliance submitted:', payload);
            this.handleComplianceSubmitted(payload);
        });
        
        // Reference received handler
        this.onMessage('reference_received', (payload) => {
            console.log('📝 Reference received:', payload);
            this.handleReferenceReceived(payload);
        });
        
        // Compliance approved handler
        this.onMessage('compliance_approved', (payload) => {
            console.log('✅ Compliance approved:', payload);
            this.handleComplianceApproved(payload);
        });
        
        // New starter registered handler
        this.onMessage('new_starter_registered', (payload) => {
            console.log('👤 New starter registered:', payload);
            this.handleNewStarterRegistered(payload);
        });
        
        // System alert handler
        this.onMessage('system_alert', (payload) => {
            console.log('🚨 System alert:', payload);
            this.handleSystemAlert(payload);
        });
        
        // Workflow update handler
        this.onMessage('workflow_update', (payload) => {
            console.log('🔄 Workflow update:', payload);
            this.handleWorkflowUpdate(payload);
        });
        
        console.log('✅ HR Compliance WebSocket handlers set up');
    }

    // ==============================================
    // HR COMPLIANCE EVENT HANDLERS
    // ==============================================
    handleComplianceSubmitted(payload) {
        // Update dashboard stats
        this.updateDashboardStats();
        
        // Show notification
        this.showNotification(`${payload.personName} submitted compliance documents`, 'info');
        
        // Update recent activity
        this.addRecentActivity('compliance_submitted', `${payload.personName} submitted compliance documents`);
        
        // Play notification sound
        this.playNotificationSound('success');
        
        // Trigger custom event
        this.dispatchCustomEvent('complianceSubmitted', payload);
    }

    handleReferenceReceived(payload) {
        // Update reference status
        this.updateReferenceStatus(payload.complianceId, payload.referenceType);
        
        // Show notification
        this.showNotification(`${payload.referenceType} reference received for ${payload.personName}`, 'success');
        
        // Update recent activity
        this.addRecentActivity('reference_received', `${payload.referenceType} reference received`);
        
        // Play notification sound
        this.playNotificationSound('success');
        
        // Trigger custom event
        this.dispatchCustomEvent('referenceReceived', payload);
    }

    handleComplianceApproved(payload) {
        // Update dashboard stats
        this.updateDashboardStats();
        
        // Show notification
        this.showNotification(`${payload.personName}'s compliance has been approved`, 'success');
        
        // Update recent activity
        this.addRecentActivity('compliance_approved', `${payload.personName} compliance approved`);
        
        // Play notification sound
        this.playNotificationSound('success');
        
        // Trigger custom event
        this.dispatchCustomEvent('complianceApproved', payload);
    }

    handleNewStarterRegistered(payload) {
        // Update dashboard stats
        this.updateNewStarterStats();
        
        // Show notification
        this.showNotification(`${payload.starterName} has been registered as a new starter`, 'info');
        
        // Update recent activity
        this.addRecentActivity('new_starter_registered', `${payload.starterName} registered`);
        
        // Play notification sound
        this.playNotificationSound('success');
        
        // Trigger custom event
        this.dispatchCustomEvent('newStarterRegistered', payload);
    }

    handleSystemAlert(payload) {
        // Show alert notification
        this.showNotification(payload.message, 'error');
        
        // Update recent activity
        this.addRecentActivity('system_alert', payload.message);
        
        // Play alert sound
        this.playNotificationSound('error');
        
        // Trigger custom event
        this.dispatchCustomEvent('systemAlert', payload);
    }

    handleWorkflowUpdate(payload) {
        // Update workflow status
        this.updateWorkflowStatus(payload);
        
        // Show notification
        this.showNotification(`Workflow update: ${payload.message}`, 'info');
        
        // Update recent activity
        this.addRecentActivity('workflow_update', payload.message);
        
        // Play notification sound
        this.playNotificationSound('info');
        
        // Trigger custom event
        this.dispatchCustomEvent('workflowUpdate', payload);
    }

    // ==============================================
    // UI UPDATE METHODS
    // ==============================================
    updateDashboardStats() {
        // Trigger dashboard stats update
        if (window.dashboardManager && window.dashboardManager.updateStats) {
            window.dashboardManager.updateStats();
        }
    }

    updateReferenceStatus(complianceId, referenceType) {
        // Update reference status in UI
        const statusElement = document.querySelector(`[data-compliance-id="${complianceId}"] .reference-status.${referenceType}`);
        if (statusElement) {
            statusElement.textContent = 'Received';
            statusElement.classList.add('received');
        }
    }

    updateNewStarterStats() {
        // Update new starter stats in UI
        const statsElement = document.querySelector('.stat-card[data-stat="new-starters"] .stat-number');
        if (statsElement) {
            const currentCount = parseInt(statsElement.textContent) || 0;
            statsElement.textContent = currentCount + 1;
        }
    }

    updateWorkflowStatus(payload) {
        // Update workflow status in UI
        const workflowElement = document.querySelector(`[data-workflow-id="${payload.workflowId}"]`);
        if (workflowElement) {
            const statusElement = workflowElement.querySelector('.workflow-status');
            if (statusElement) {
                statusElement.textContent = payload.status;
                statusElement.className = `workflow-status ${payload.status}`;
            }
        }
    }

    addRecentActivity(type, text) {
        // Add to recent activity list
        const activityContainer = document.querySelector('.recent-activity .activity-list');
        if (activityContainer) {
            const activityElement = this.createActivityElement(type, text);
            activityContainer.insertBefore(activityElement, activityContainer.firstChild);
            
            // Remove old activities if too many
            const activities = activityContainer.querySelectorAll('.activity-item');
            if (activities.length > 10) {
                activities[activities.length - 1].remove();
            }
        }
    }

    createActivityElement(type, text) {
        const element = document.createElement('div');
        element.className = 'activity-item';
        
        element.innerHTML = `
            <div class="activity-icon ${type}">
                ${this.getActivityIcon(type)}
            </div>
            <div class="activity-content">
                <div class="activity-text">${text}</div>
                <div class="activity-time">Just now</div>
            </div>
        `;
        
        return element;
    }

    getActivityIcon(type) {
        const icons = {
            compliance_submitted: '📋',
            reference_received: '📝',
            compliance_approved: '✅',
            new_starter_registered: '👤',
            system_alert: '🚨',
            workflow_update: '🔄'
        };
        return icons[type] || '📄';
    }

    // ==============================================
    // NOTIFICATION SYSTEM
    // ==============================================
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${this.getNotificationIcon(type)}</div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || 'ℹ️';
    }

    showConnectionStatus(message, type) {
        const statusElement = document.querySelector('.websocket-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `websocket-status ${type}`;
        }
    }

    playNotificationSound(type) {
        const sounds = {
            success: '/sounds/success.mp3',
            error: '/sounds/error.mp3',
            info: '/sounds/working.mp3',
            warning: '/sounds/waiting.mp3'
        };
        
        if (sounds[type]) {
            const audio = new Audio(sounds[type]);
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Sound play failed:', e));
        }
    }

    // ==============================================
    // CUSTOM EVENTS
    // ==============================================
    dispatchCustomEvent(eventName, data) {
        const event = new CustomEvent(`websocket:${eventName}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    // ==============================================
    // UTILITY METHODS
    // ==============================================
    getConnectionState() {
        if (!this.ws) return 'CLOSED';
        
        switch (this.ws.readyState) {
            case WebSocket.CONNECTING: return 'CONNECTING';
            case WebSocket.OPEN: return 'OPEN';
            case WebSocket.CLOSING: return 'CLOSING';
            case WebSocket.CLOSED: return 'CLOSED';
            default: return 'UNKNOWN';
        }
    }

    isReady() {
        return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    getStats() {
        return {
            isConnected: this.isConnected,
            connectionState: this.getConnectionState(),
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length,
            registeredHandlers: this.messageHandlers.size
        };
    }

    // ==============================================
    // ERROR HANDLING
    // ==============================================
    handleConnectionError(error) {
        console.error('❌ WebSocket connection error:', error);
        this.showConnectionStatus('Connection Error', 'error');
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
            if (!this.isConnected && !this.isReconnecting) {
                this.attemptReconnect();
            }
        }, this.reconnectInterval);
    }
}

// ==============================================
// INITIALIZE WEBSOCKET CLIENT
// ==============================================
const wsClient = new WebSocketClient({
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000
});

// Set up HR Compliance specific handlers
wsClient.setupHRComplianceHandlers();

// ==============================================
// GLOBAL ACCESS
// ==============================================
window.wsClient = wsClient;

// ==============================================
// EXPORT FOR TESTING
// ==============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSocketClient;
}
