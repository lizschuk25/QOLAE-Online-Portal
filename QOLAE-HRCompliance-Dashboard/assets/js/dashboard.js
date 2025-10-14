// ==============================================
// QOLAE HR COMPLIANCE DASHBOARD - MAIN JAVASCRIPT
// ==============================================
// Purpose: Main dashboard functionality for HR Compliance
// Author: Phoenix Agent
// Date: October 14, 2025
// ==============================================

// ==============================================
// DASHBOARD INITIALIZATION
// ==============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏢 QOLAE HR Compliance Dashboard initialized');
    
    // Initialize all dashboard components
    initializeDashboard();
    initializeWebSocket();
    initializeEventListeners();
    loadDashboardData();
    
    // Start periodic updates
    startPeriodicUpdates();
});

// ==============================================
// DASHBOARD INITIALIZATION
// ==============================================
function initializeDashboard() {
    console.log('📊 Initializing dashboard components...');
    
    // Initialize progress bars
    initializeProgressBars();
    
    // Initialize status badges
    initializeStatusBadges();
    
    // Initialize quick actions
    initializeQuickActions();
    
    // Initialize recent activity
    initializeRecentActivity();
    
    console.log('✅ Dashboard components initialized');
}

// ==============================================
// WEBSOCKET CONNECTION
// ==============================================
let websocket = null;

function initializeWebSocket() {
    try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = function(event) {
            console.log('🔌 WebSocket connected to HR Compliance Dashboard');
            showNotification('Connected to real-time updates', 'success');
        };
        
        websocket.onmessage = function(event) {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };
        
        websocket.onclose = function(event) {
            console.log('🔌 WebSocket disconnected, attempting to reconnect...');
            showNotification('Connection lost, attempting to reconnect...', 'warning');
            
            // Attempt to reconnect after 3 seconds
            setTimeout(initializeWebSocket, 3000);
        };
        
        websocket.onerror = function(error) {
            console.error('❌ WebSocket error:', error);
            showNotification('Connection error occurred', 'error');
        };
        
    } catch (error) {
        console.error('❌ Failed to initialize WebSocket:', error);
        showNotification('Real-time updates unavailable', 'warning');
    }
}

// ==============================================
// WEBSOCKET MESSAGE HANDLER
// ==============================================
function handleWebSocketMessage(data) {
    console.log('📨 Received WebSocket message:', data);
    
    switch (data.type) {
        case 'compliance_submitted':
            handleComplianceSubmitted(data);
            break;
        case 'reference_received':
            handleReferenceReceived(data);
            break;
        case 'compliance_approved':
            handleComplianceApproved(data);
            break;
        case 'new_starter_registered':
            handleNewStarterRegistered(data);
            break;
        case 'system_alert':
            handleSystemAlert(data);
            break;
        default:
            console.log('📨 Unknown message type:', data.type);
    }
}

// ==============================================
// EVENT HANDLERS
// ==============================================
function handleComplianceSubmitted(data) {
    console.log('📋 New compliance submission:', data);
    
    // Update dashboard stats
    updateComplianceStats();
    
    // Show notification
    showNotification(`${data.personName} submitted compliance documents`, 'info');
    
    // Update recent activity
    addRecentActivity('compliance_submitted', `${data.personName} submitted compliance documents`);
    
    // Play notification sound
    playNotificationSound('success');
}

function handleReferenceReceived(data) {
    console.log('📝 Reference received:', data);
    
    // Update reference status
    updateReferenceStatus(data.complianceId, data.referenceType);
    
    // Show notification
    showNotification(`${data.referenceType} reference received for ${data.personName}`, 'success');
    
    // Update recent activity
    addRecentActivity('reference_received', `${data.referenceType} reference received`);
    
    // Play notification sound
    playNotificationSound('success');
}

function handleComplianceApproved(data) {
    console.log('✅ Compliance approved:', data);
    
    // Update dashboard stats
    updateComplianceStats();
    
    // Show notification
    showNotification(`${data.personName}'s compliance has been approved`, 'success');
    
    // Update recent activity
    addRecentActivity('compliance_approved', `${data.personName} compliance approved`);
    
    // Play notification sound
    playNotificationSound('success');
}

function handleNewStarterRegistered(data) {
    console.log('👤 New starter registered:', data);
    
    // Update dashboard stats
    updateNewStarterStats();
    
    // Show notification
    showNotification(`${data.starterName} has been registered as a new starter`, 'info');
    
    // Update recent activity
    addRecentActivity('new_starter_registered', `${data.starterName} registered`);
    
    // Play notification sound
    playNotificationSound('success');
}

function handleSystemAlert(data) {
    console.log('🚨 System alert:', data);
    
    // Show alert notification
    showNotification(data.message, 'error');
    
    // Update recent activity
    addRecentActivity('system_alert', data.message);
    
    // Play alert sound
    playNotificationSound('error');
}

// ==============================================
// EVENT LISTENERS
// ==============================================
function initializeEventListeners() {
    console.log('🎧 Setting up event listeners...');
    
    // Quick action buttons
    const quickActionButtons = document.querySelectorAll('.quick-action');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', handleQuickAction);
    });
    
    // Action buttons
    const actionButtons = document.querySelectorAll('.action-button');
    actionButtons.forEach(button => {
        button.addEventListener('click', handleActionButton);
    });
    
    // Status badge clicks
    const statusBadges = document.querySelectorAll('.status-badge');
    statusBadges.forEach(badge => {
        badge.addEventListener('click', handleStatusBadgeClick);
    });
    
    // Document upload zones
    const uploadZones = document.querySelectorAll('.upload-zone');
    uploadZones.forEach(zone => {
        initializeUploadZone(zone);
    });
    
    console.log('✅ Event listeners initialized');
}

// ==============================================
// QUICK ACTION HANDLER
// ==============================================
function handleQuickAction(event) {
    event.preventDefault();
    
    const action = event.currentTarget.dataset.action;
    const actionText = event.currentTarget.querySelector('.quick-action-text').textContent;
    
    console.log(`🚀 Quick action triggered: ${action}`);
    
    // Show loading state
    showLoadingState(event.currentTarget);
    
    // Execute action based on type
    switch (action) {
        case 'new-starter':
            openNewStarterModal();
            break;
        case 'compliance-review':
            openComplianceReview();
            break;
        case 'documents-library':
            openDocumentsLibrary();
            break;
        case 'reports':
            openReports();
            break;
        default:
            console.warn('⚠️ Unknown quick action:', action);
    }
    
    // Hide loading state after action
    setTimeout(() => {
        hideLoadingState(event.currentTarget);
    }, 1000);
}

// ==============================================
// ACTION BUTTON HANDLER
// ==============================================
function handleActionButton(event) {
    event.preventDefault();
    
    const action = event.currentTarget.dataset.action;
    const buttonText = event.currentTarget.textContent;
    
    console.log(`🔘 Action button clicked: ${action}`);
    
    // Show loading state
    showLoadingState(event.currentTarget);
    
    // Execute action
    executeAction(action);
    
    // Hide loading state
    setTimeout(() => {
        hideLoadingState(event.currentTarget);
    }, 1000);
}

// ==============================================
// STATUS BADGE HANDLER
// ==============================================
function handleStatusBadgeClick(event) {
    const status = event.currentTarget.dataset.status;
    const personId = event.currentTarget.dataset.personId;
    
    console.log(`🏷️ Status badge clicked: ${status} for person ${personId}`);
    
    // Open status details modal
    openStatusDetails(status, personId);
}

// ==============================================
// DASHBOARD DATA LOADING
// ==============================================
async function loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    
    try {
        // Show loading indicators
        showLoadingIndicators();
        
        // Load all dashboard data in parallel
        const [stats, recentActivity, pendingCompliance] = await Promise.all([
            loadDashboardStats(),
            loadRecentActivity(),
            loadPendingCompliance()
        ]);
        
        // Update dashboard with loaded data
        updateDashboardStats(stats);
        updateRecentActivityList(recentActivity);
        updatePendingComplianceList(pendingCompliance);
        
        // Hide loading indicators
        hideLoadingIndicators();
        
        console.log('✅ Dashboard data loaded successfully');
        
    } catch (error) {
        console.error('❌ Failed to load dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
        hideLoadingIndicators();
    }
}

// ==============================================
// API CALLS
// ==============================================
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) throw new Error('Failed to load stats');
        return await response.json();
    } catch (error) {
        console.error('❌ Failed to load dashboard stats:', error);
        return getDefaultStats();
    }
}

async function loadRecentActivity() {
    try {
        const response = await fetch('/api/dashboard/recent-activity');
        if (!response.ok) throw new Error('Failed to load recent activity');
        return await response.json();
    } catch (error) {
        console.error('❌ Failed to load recent activity:', error);
        return getDefaultRecentActivity();
    }
}

async function loadPendingCompliance() {
    try {
        const response = await fetch('/api/compliance/pending');
        if (!response.ok) throw new Error('Failed to load pending compliance');
        return await response.json();
    } catch (error) {
        console.error('❌ Failed to load pending compliance:', error);
        return [];
    }
}

// ==============================================
// UI UPDATES
// ==============================================
function updateDashboardStats(stats) {
    // Update stat cards
    if (stats.totalCompliance) {
        updateStatCard('total-compliance', stats.totalCompliance);
    }
    if (stats.pendingCompliance) {
        updateStatCard('pending-compliance', stats.pendingCompliance);
    }
    if (stats.approvedCompliance) {
        updateStatCard('approved-compliance', stats.approvedCompliance);
    }
    if (stats.newStarters) {
        updateStatCard('new-starters', stats.newStarters);
    }
}

function updateStatCard(statId, value) {
    const statElement = document.getElementById(statId);
    if (statElement) {
        const numberElement = statElement.querySelector('.stat-number');
        if (numberElement) {
            animateNumber(numberElement, parseInt(numberElement.textContent) || 0, value);
        }
    }
}

function updateRecentActivityList(activities) {
    const activityContainer = document.querySelector('.recent-activity .activity-list');
    if (!activityContainer) return;
    
    activityContainer.innerHTML = '';
    
    activities.forEach(activity => {
        const activityElement = createActivityElement(activity);
        activityContainer.appendChild(activityElement);
    });
}

function updatePendingComplianceList(complianceList) {
    const complianceContainer = document.querySelector('.pending-compliance-list');
    if (!complianceContainer) return;
    
    complianceContainer.innerHTML = '';
    
    complianceList.forEach(compliance => {
        const complianceElement = createComplianceElement(compliance);
        complianceContainer.appendChild(complianceElement);
    });
}

// ==============================================
// UI ELEMENT CREATION
// ==============================================
function createActivityElement(activity) {
    const element = document.createElement('div');
    element.className = 'activity-item';
    
    element.innerHTML = `
        <div class="activity-icon ${activity.type}">
            ${getActivityIcon(activity.type)}
        </div>
        <div class="activity-content">
            <div class="activity-text">${activity.text}</div>
            <div class="activity-time">${formatTime(activity.timestamp)}</div>
        </div>
    `;
    
    return element;
}

function createComplianceElement(compliance) {
    const element = document.createElement('div');
    element.className = 'compliance-item';
    
    element.innerHTML = `
        <div class="compliance-info">
            <div class="compliance-name">${compliance.personName}</div>
            <div class="compliance-type">${compliance.personType}</div>
        </div>
        <div class="compliance-status ${compliance.status}">
            ${compliance.status}
        </div>
        <div class="compliance-actions">
            <button class="action-button action-button-primary" data-action="review" data-id="${compliance.id}">
                Review
            </button>
        </div>
    `;
    
    return element;
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function playNotificationSound(type) {
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

function showLoadingState(element) {
    element.classList.add('loading');
    element.style.pointerEvents = 'none';
}

function hideLoadingState(element) {
    element.classList.remove('loading');
    element.style.pointerEvents = 'auto';
}

function showLoadingIndicators() {
    const indicators = document.querySelectorAll('.loading-indicator');
    indicators.forEach(indicator => indicator.style.display = 'block');
}

function hideLoadingIndicators() {
    const indicators = document.querySelectorAll('.loading-indicator');
    indicators.forEach(indicator => indicator.style.display = 'none');
}

function animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * progress);
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
        return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
        return `${Math.floor(diff / 60000)} minutes ago`;
    } else if (diff < 86400000) { // Less than 1 day
        return `${Math.floor(diff / 3600000)} hours ago`;
    } else {
        return date.toLocaleDateString();
    }
}

function getActivityIcon(type) {
    const icons = {
        compliance_submitted: '📋',
        reference_received: '📝',
        compliance_approved: '✅',
        new_starter_registered: '👤',
        system_alert: '🚨'
    };
    return icons[type] || '📄';
}

function getDefaultStats() {
    return {
        totalCompliance: 0,
        pendingCompliance: 0,
        approvedCompliance: 0,
        newStarters: 0
    };
}

function getDefaultRecentActivity() {
    return [
        {
            type: 'info',
            text: 'Dashboard initialized',
            timestamp: new Date().toISOString()
        }
    ];
}

// ==============================================
// PERIODIC UPDATES
// ==============================================
function startPeriodicUpdates() {
    // Update dashboard data every 30 seconds
    setInterval(loadDashboardData, 30000);
    
    // Check WebSocket connection every 60 seconds
    setInterval(checkWebSocketConnection, 60000);
}

function checkWebSocketConnection() {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.log('🔌 WebSocket not connected, attempting to reconnect...');
        initializeWebSocket();
    }
}

// ==============================================
// MODAL FUNCTIONS (Placeholder implementations)
// ==============================================
function openNewStarterModal() {
    console.log('👤 Opening new starter modal...');
    // Implementation will be added by Atlas agent
}

function openComplianceReview() {
    console.log('📋 Opening compliance review...');
    // Implementation will be added by Sage agent
}

function openDocumentsLibrary() {
    console.log('📚 Opening documents library...');
    // Implementation will be added by Mercury agent
}

function openReports() {
    console.log('📊 Opening reports...');
    // Implementation will be added by Mercury agent
}

function executeAction(action) {
    console.log(`🔘 Executing action: ${action}`);
    // Implementation will be added by respective agents
}

function openStatusDetails(status, personId) {
    console.log(`🏷️ Opening status details for ${status}, person ${personId}`);
    // Implementation will be added by respective agents
}

function initializeUploadZone(zone) {
    console.log('📁 Initializing upload zone...');
    // Implementation will be added by Atlas/Iris agents
}

function initializeProgressBars() {
    console.log('📊 Initializing progress bars...');
    // Implementation will be added by respective agents
}

function initializeStatusBadges() {
    console.log('🏷️ Initializing status badges...');
    // Implementation will be added by respective agents
}

function initializeQuickActions() {
    console.log('🚀 Initializing quick actions...');
    // Implementation will be added by respective agents
}

function initializeRecentActivity() {
    console.log('📋 Initializing recent activity...');
    // Implementation will be added by respective agents
}

function addRecentActivity(type, text) {
    console.log(`📋 Adding recent activity: ${type} - ${text}`);
    // Implementation will be added by respective agents
}

function updateComplianceStats() {
    console.log('📊 Updating compliance stats...');
    // Implementation will be added by respective agents
}

function updateReferenceStatus(complianceId, referenceType) {
    console.log(`📝 Updating reference status: ${complianceId} - ${referenceType}`);
    // Implementation will be added by Sage agent
}

function updateNewStarterStats() {
    console.log('👤 Updating new starter stats...');
    // Implementation will be added by Atlas agent
}

// ==============================================
// EXPORT FOR TESTING
// ==============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDashboard,
        loadDashboardData,
        handleWebSocketMessage,
        showNotification,
        playNotificationSound
    };
}
