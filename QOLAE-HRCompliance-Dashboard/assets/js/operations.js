// ==============================================
// QOLAE HR COMPLIANCE DASHBOARD - OPERATIONS JAVASCRIPT
// ==============================================
// Purpose: Operations management functionality for HR Compliance
// Author: Phoenix Agent
// Date: October 14, 2025
// ==============================================

// ==============================================
// OPERATIONS MANAGEMENT CLASS
// ==============================================
class OperationsManager {
    constructor() {
        this.currentUser = null;
        this.operations = [];
        this.isInitialized = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    // ==============================================
    // INITIALIZATION
    // ==============================================
    async initialize() {
        console.log('🔧 Initializing Operations Manager...');
        
        try {
            // Load current user
            await this.loadCurrentUser();
            
            // Load operations data
            await this.loadOperations();
            
            // Initialize UI components
            this.initializeUI();
            
            // Set up event listeners
            this.setupEventListeners();
            
            this.isInitialized = true;
            console.log('✅ Operations Manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Operations Manager:', error);
            this.showError('Failed to initialize operations system');
        }
    }

    // ==============================================
    // USER MANAGEMENT
    // ==============================================
    async loadCurrentUser() {
        try {
            const response = await fetch('/api/user/current');
            if (response.ok) {
                this.currentUser = await response.json();
                console.log('👤 Current user loaded:', this.currentUser.name);
            } else {
                throw new Error('Failed to load current user');
            }
        } catch (error) {
            console.error('❌ Failed to load current user:', error);
            // Set default user for development
            this.currentUser = {
                id: 'liz',
                name: 'Liz Chukwu',
                role: 'admin',
                permissions: ['all']
            };
        }
    }

    // ==============================================
    // OPERATIONS DATA LOADING
    // ==============================================
    async loadOperations() {
        try {
            console.log('📊 Loading operations data...');
            
            const [workload, assignments, monitoring] = await Promise.all([
                this.loadWorkloadData(),
                this.loadAssignmentData(),
                this.loadMonitoringData()
            ]);
            
            this.operations = {
                workload,
                assignments,
                monitoring,
                lastUpdated: new Date()
            };
            
            console.log('✅ Operations data loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to load operations data:', error);
            this.operations = this.getDefaultOperations();
        }
    }

    async loadWorkloadData() {
        try {
            const response = await fetch('/api/operations/workload');
            if (!response.ok) throw new Error('Failed to load workload data');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to load workload data:', error);
            return this.getDefaultWorkload();
        }
    }

    async loadAssignmentData() {
        try {
            const response = await fetch('/api/operations/assignments');
            if (!response.ok) throw new Error('Failed to load assignment data');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to load assignment data:', error);
            return this.getDefaultAssignments();
        }
    }

    async loadMonitoringData() {
        try {
            const response = await fetch('/api/operations/monitoring');
            if (!response.ok) throw new Error('Failed to load monitoring data');
            return await response.json();
        } catch (error) {
            console.error('❌ Failed to load monitoring data:', error);
            return this.getDefaultMonitoring();
        }
    }

    // ==============================================
    // UI INITIALIZATION
    // ==============================================
    initializeUI() {
        console.log('🎨 Initializing operations UI...');
        
        // Initialize workload dashboard
        this.initializeWorkloadDashboard();
        
        // Initialize assignment management
        this.initializeAssignmentManagement();
        
        // Initialize monitoring dashboard
        this.initializeMonitoringDashboard();
        
        // Initialize quick actions
        this.initializeQuickActions();
        
        console.log('✅ Operations UI initialized');
    }

    initializeWorkloadDashboard() {
        const workloadContainer = document.querySelector('.workload-dashboard');
        if (!workloadContainer) return;
        
        // Create workload cards
        this.createWorkloadCards(workloadContainer);
        
        // Initialize workload charts
        this.initializeWorkloadCharts();
    }

    initializeAssignmentManagement() {
        const assignmentContainer = document.querySelector('.assignment-management');
        if (!assignmentContainer) return;
        
        // Create assignment table
        this.createAssignmentTable(assignmentContainer);
        
        // Initialize assignment filters
        this.initializeAssignmentFilters();
    }

    initializeMonitoringDashboard() {
        const monitoringContainer = document.querySelector('.monitoring-dashboard');
        if (!monitoringContainer) return;
        
        // Create monitoring widgets
        this.createMonitoringWidgets(monitoringContainer);
        
        // Initialize real-time updates
        this.initializeRealTimeMonitoring();
    }

    initializeQuickActions() {
        const quickActionsContainer = document.querySelector('.operations-quick-actions');
        if (!quickActionsContainer) return;
        
        // Create quick action buttons
        this.createQuickActionButtons(quickActionsContainer);
    }

    // ==============================================
    // WORKLOAD MANAGEMENT
    // ==============================================
    createWorkloadCards(container) {
        const workload = this.operations.workload;
        
        container.innerHTML = `
            <div class="workload-grid">
                <div class="workload-card">
                    <div class="card-header">
                        <h3 class="card-title">Active Cases</h3>
                        <div class="card-icon">📋</div>
                    </div>
                    <div class="workload-stat">
                        <div class="stat-number">${workload.activeCases}</div>
                        <div class="stat-label">Currently Active</div>
                    </div>
                    <div class="workload-trend ${workload.casesTrend > 0 ? 'positive' : 'negative'}">
                        ${workload.casesTrend > 0 ? '↗' : '↘'} ${Math.abs(workload.casesTrend)}% from last week
                    </div>
                </div>
                
                <div class="workload-card">
                    <div class="card-header">
                        <h3 class="card-title">Case Managers</h3>
                        <div class="card-icon">👥</div>
                    </div>
                    <div class="workload-stat">
                        <div class="stat-number">${workload.activeCaseManagers}</div>
                        <div class="stat-label">Currently Active</div>
                    </div>
                    <div class="workload-trend ${workload.managersTrend > 0 ? 'positive' : 'negative'}">
                        ${workload.managersTrend > 0 ? '↗' : '↘'} ${Math.abs(workload.managersTrend)}% from last week
                    </div>
                </div>
                
                <div class="workload-card">
                    <div class="card-header">
                        <h3 class="card-title">Average Load</h3>
                        <div class="card-icon">⚖️</div>
                    </div>
                    <div class="workload-stat">
                        <div class="stat-number">${workload.averageLoad}</div>
                        <div class="stat-label">Cases per Manager</div>
                    </div>
                    <div class="workload-trend ${workload.loadTrend > 0 ? 'positive' : 'negative'}">
                        ${workload.loadTrend > 0 ? '↗' : '↘'} ${Math.abs(workload.loadTrend)}% from last week
                    </div>
                </div>
                
                <div class="workload-card">
                    <div class="card-header">
                        <h3 class="card-title">Completion Rate</h3>
                        <div class="card-icon">✅</div>
                    </div>
                    <div class="workload-stat">
                        <div class="stat-number">${workload.completionRate}%</div>
                        <div class="stat-label">This Month</div>
                    </div>
                    <div class="workload-trend ${workload.completionTrend > 0 ? 'positive' : 'negative'}">
                        ${workload.completionTrend > 0 ? '↗' : '↘'} ${Math.abs(workload.completionTrend)}% from last month
                    </div>
                </div>
            </div>
        `;
    }

    initializeWorkloadCharts() {
        // Initialize workload distribution chart
        this.createWorkloadChart();
        
        // Initialize completion timeline chart
        this.createCompletionChart();
    }

    createWorkloadChart() {
        const chartContainer = document.querySelector('.workload-chart');
        if (!chartContainer) return;
        
        // Create simple workload visualization
        const workload = this.operations.workload;
        const maxLoad = Math.max(...workload.managerLoads.map(m => m.load));
        
        chartContainer.innerHTML = `
            <div class="chart-header">
                <h4>Workload Distribution</h4>
            </div>
            <div class="chart-content">
                ${workload.managerLoads.map(manager => `
                    <div class="workload-bar">
                        <div class="manager-name">${manager.name}</div>
                        <div class="load-bar">
                            <div class="load-fill" style="width: ${(manager.load / maxLoad) * 100}%"></div>
                        </div>
                        <div class="load-value">${manager.load} cases</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createCompletionChart() {
        const chartContainer = document.querySelector('.completion-chart');
        if (!chartContainer) return;
        
        // Create completion timeline visualization
        const completion = this.operations.workload.completionTimeline;
        
        chartContainer.innerHTML = `
            <div class="chart-header">
                <h4>Completion Timeline</h4>
            </div>
            <div class="chart-content">
                <div class="timeline-chart">
                    ${completion.map(day => `
                        <div class="timeline-day">
                            <div class="day-label">${day.date}</div>
                            <div class="day-bar">
                                <div class="completed-fill" style="height: ${day.completed}%"></div>
                                <div class="pending-fill" style="height: ${day.pending}%"></div>
                            </div>
                            <div class="day-stats">
                                <span class="completed">${day.completedCount}</span>
                                <span class="pending">${day.pendingCount}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // ==============================================
    // ASSIGNMENT MANAGEMENT
    // ==============================================
    createAssignmentTable(container) {
        const assignments = this.operations.assignments;
        
        container.innerHTML = `
            <div class="assignment-header">
                <h3>Case Assignments</h3>
                <div class="assignment-filters">
                    <select id="status-filter" class="filter-select">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                    </select>
                    <select id="manager-filter" class="filter-select">
                        <option value="all">All Managers</option>
                        ${assignments.managers.map(manager => 
                            `<option value="${manager.id}">${manager.name}</option>`
                        ).join('')}
                    </select>
                </div>
            </div>
            <div class="assignment-table-container">
                <table class="assignment-table">
                    <thead>
                        <tr>
                            <th>Case ID</th>
                            <th>Client</th>
                            <th>Case Manager</th>
                            <th>Status</th>
                            <th>Priority</th>
                            <th>Assigned Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${assignments.cases.map(caseItem => `
                            <tr data-case-id="${caseItem.id}">
                                <td>${caseItem.id}</td>
                                <td>${caseItem.clientName}</td>
                                <td>${caseItem.caseManager}</td>
                                <td>
                                    <span class="status-badge ${caseItem.status}">${caseItem.status}</span>
                                </td>
                                <td>
                                    <span class="priority-badge ${caseItem.priority}">${caseItem.priority}</span>
                                </td>
                                <td>${this.formatDate(caseItem.assignedDate)}</td>
                                <td>
                                    <button class="action-button action-button-primary" data-action="view" data-id="${caseItem.id}">
                                        View
                                    </button>
                                    <button class="action-button action-button-secondary" data-action="reassign" data-id="${caseItem.id}">
                                        Reassign
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    initializeAssignmentFilters() {
        const statusFilter = document.getElementById('status-filter');
        const managerFilter = document.getElementById('manager-filter');
        
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterAssignments('status', e.target.value);
            });
        }
        
        if (managerFilter) {
            managerFilter.addEventListener('change', (e) => {
                this.filterAssignments('manager', e.target.value);
            });
        }
    }

    filterAssignments(filterType, filterValue) {
        const rows = document.querySelectorAll('.assignment-table tbody tr');
        
        rows.forEach(row => {
            let showRow = true;
            
            if (filterType === 'status' && filterValue !== 'all') {
                const status = row.querySelector('.status-badge').textContent.toLowerCase();
                showRow = status === filterValue;
            }
            
            if (filterType === 'manager' && filterValue !== 'all') {
                const managerCell = row.cells[2].textContent.trim();
                showRow = managerCell.includes(filterValue);
            }
            
            row.style.display = showRow ? '' : 'none';
        });
    }

    // ==============================================
    // MONITORING DASHBOARD
    // ==============================================
    createMonitoringWidgets(container) {
        const monitoring = this.operations.monitoring;
        
        container.innerHTML = `
            <div class="monitoring-grid">
                <div class="monitoring-widget">
                    <div class="widget-header">
                        <h4>System Health</h4>
                        <div class="health-indicator ${monitoring.systemHealth.status}"></div>
                    </div>
                    <div class="widget-content">
                        <div class="health-metrics">
                            <div class="metric">
                                <span class="metric-label">CPU Usage</span>
                                <span class="metric-value">${monitoring.systemHealth.cpuUsage}%</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Memory Usage</span>
                                <span class="metric-value">${monitoring.systemHealth.memoryUsage}%</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Disk Usage</span>
                                <span class="metric-value">${monitoring.systemHealth.diskUsage}%</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="monitoring-widget">
                    <div class="widget-header">
                        <h4>Database Status</h4>
                        <div class="status-indicator ${monitoring.database.status}"></div>
                    </div>
                    <div class="widget-content">
                        <div class="db-metrics">
                            <div class="metric">
                                <span class="metric-label">Connections</span>
                                <span class="metric-value">${monitoring.database.connections}</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Response Time</span>
                                <span class="metric-value">${monitoring.database.responseTime}ms</span>
                            </div>
                            <div class="metric">
                                <span class="metric-label">Uptime</span>
                                <span class="metric-value">${monitoring.database.uptime}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="monitoring-widget">
                    <div class="widget-header">
                        <h4>Active Users</h4>
                        <div class="user-count">${monitoring.activeUsers}</div>
                    </div>
                    <div class="widget-content">
                        <div class="user-list">
                            ${monitoring.users.map(user => `
                                <div class="user-item">
                                    <div class="user-avatar">${user.name.charAt(0)}</div>
                                    <div class="user-info">
                                        <div class="user-name">${user.name}</div>
                                        <div class="user-role">${user.role}</div>
                                    </div>
                                    <div class="user-status ${user.status}"></div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    initializeRealTimeMonitoring() {
        // Set up real-time monitoring updates
        setInterval(() => {
            this.updateMonitoringData();
        }, 30000); // Update every 30 seconds
    }

    async updateMonitoringData() {
        try {
            const response = await fetch('/api/operations/monitoring');
            if (response.ok) {
                const newData = await response.json();
                this.operations.monitoring = newData;
                this.updateMonitoringWidgets();
            }
        } catch (error) {
            console.error('❌ Failed to update monitoring data:', error);
        }
    }

    updateMonitoringWidgets() {
        // Update monitoring widgets with new data
        const monitoring = this.operations.monitoring;
        
        // Update system health
        const cpuElement = document.querySelector('.health-metrics .metric:nth-child(1) .metric-value');
        const memoryElement = document.querySelector('.health-metrics .metric:nth-child(2) .metric-value');
        const diskElement = document.querySelector('.health-metrics .metric:nth-child(3) .metric-value');
        
        if (cpuElement) cpuElement.textContent = `${monitoring.systemHealth.cpuUsage}%`;
        if (memoryElement) memoryElement.textContent = `${monitoring.systemHealth.memoryUsage}%`;
        if (diskElement) diskElement.textContent = `${monitoring.systemHealth.diskUsage}%`;
        
        // Update database status
        const connectionsElement = document.querySelector('.db-metrics .metric:nth-child(1) .metric-value');
        const responseTimeElement = document.querySelector('.db-metrics .metric:nth-child(2) .metric-value');
        
        if (connectionsElement) connectionsElement.textContent = monitoring.database.connections;
        if (responseTimeElement) responseTimeElement.textContent = `${monitoring.database.responseTime}ms`;
    }

    // ==============================================
    // QUICK ACTIONS
    // ==============================================
    createQuickActionButtons(container) {
        container.innerHTML = `
            <div class="quick-actions-grid">
                <button class="quick-action" data-action="assign-case">
                    <div class="action-icon">📋</div>
                    <div class="action-text">Assign Case</div>
                </button>
                <button class="quick-action" data-action="reassign-case">
                    <div class="action-icon">🔄</div>
                    <div class="action-text">Reassign Case</div>
                </button>
                <button class="quick-action" data-action="workload-report">
                    <div class="action-icon">📊</div>
                    <div class="action-text">Workload Report</div>
                </button>
                <button class="quick-action" data-action="system-status">
                    <div class="action-icon">🔍</div>
                    <div class="action-text">System Status</div>
                </button>
            </div>
        `;
    }

    // ==============================================
    // EVENT LISTENERS
    // ==============================================
    setupEventListeners() {
        console.log('🎧 Setting up operations event listeners...');
        
        // Quick action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.quick-action')) {
                this.handleQuickAction(e);
            }
        });
        
        // Assignment table actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.assignment-table .action-button')) {
                this.handleAssignmentAction(e);
            }
        });
        
        // Monitoring widget interactions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.monitoring-widget')) {
                this.handleMonitoringClick(e);
            }
        });
        
        console.log('✅ Operations event listeners set up');
    }

    handleQuickAction(event) {
        const action = event.currentTarget.dataset.action;
        console.log(`🚀 Quick action triggered: ${action}`);
        
        switch (action) {
            case 'assign-case':
                this.openAssignCaseModal();
                break;
            case 'reassign-case':
                this.openReassignCaseModal();
                break;
            case 'workload-report':
                this.generateWorkloadReport();
                break;
            case 'system-status':
                this.showSystemStatus();
                break;
            default:
                console.warn('⚠️ Unknown quick action:', action);
        }
    }

    handleAssignmentAction(event) {
        const action = event.target.dataset.action;
        const caseId = event.target.dataset.id;
        
        console.log(`🔘 Assignment action: ${action} for case ${caseId}`);
        
        switch (action) {
            case 'view':
                this.viewCaseDetails(caseId);
                break;
            case 'reassign':
                this.reassignCase(caseId);
                break;
            default:
                console.warn('⚠️ Unknown assignment action:', action);
        }
    }

    handleMonitoringClick(event) {
        const widget = event.currentTarget;
        const widgetType = widget.querySelector('.widget-header h4').textContent;
        
        console.log(`🔍 Monitoring widget clicked: ${widgetType}`);
        
        // Open detailed monitoring view
        this.openDetailedMonitoring(widgetType);
    }

    // ==============================================
    // ACTION IMPLEMENTATIONS
    // ==============================================
    openAssignCaseModal() {
        console.log('📋 Opening assign case modal...');
        // Implementation will be added by respective agents
        this.showNotification('Assign case functionality coming soon', 'info');
    }

    openReassignCaseModal() {
        console.log('🔄 Opening reassign case modal...');
        // Implementation will be added by respective agents
        this.showNotification('Reassign case functionality coming soon', 'info');
    }

    generateWorkloadReport() {
        console.log('📊 Generating workload report...');
        // Implementation will be added by respective agents
        this.showNotification('Workload report generation coming soon', 'info');
    }

    showSystemStatus() {
        console.log('🔍 Showing system status...');
        // Implementation will be added by respective agents
        this.showNotification('System status view coming soon', 'info');
    }

    viewCaseDetails(caseId) {
        console.log(`👁️ Viewing case details: ${caseId}`);
        // Implementation will be added by respective agents
        this.showNotification(`Viewing case ${caseId} details`, 'info');
    }

    reassignCase(caseId) {
        console.log(`🔄 Reassigning case: ${caseId}`);
        // Implementation will be added by respective agents
        this.showNotification(`Reassigning case ${caseId}`, 'info');
    }

    openDetailedMonitoring(widgetType) {
        console.log(`🔍 Opening detailed monitoring: ${widgetType}`);
        // Implementation will be added by respective agents
        this.showNotification(`Opening ${widgetType} details`, 'info');
    }

    // ==============================================
    // UTILITY FUNCTIONS
    // ==============================================
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    // ==============================================
    // DEFAULT DATA
    // ==============================================
    getDefaultOperations() {
        return {
            workload: this.getDefaultWorkload(),
            assignments: this.getDefaultAssignments(),
            monitoring: this.getDefaultMonitoring(),
            lastUpdated: new Date()
        };
    }

    getDefaultWorkload() {
        return {
            activeCases: 12,
            activeCaseManagers: 4,
            averageLoad: 3.0,
            completionRate: 85,
            casesTrend: 5,
            managersTrend: 0,
            loadTrend: -2,
            completionTrend: 3,
            managerLoads: [
                { name: 'Sarah Johnson', load: 4 },
                { name: 'Michael Chen', load: 3 },
                { name: 'Emily Rodriguez', load: 2 },
                { name: 'David Thompson', load: 3 }
            ],
            completionTimeline: [
                { date: 'Mon', completed: 80, pending: 20, completedCount: 4, pendingCount: 1 },
                { date: 'Tue', completed: 90, pending: 10, completedCount: 5, pendingCount: 1 },
                { date: 'Wed', completed: 70, pending: 30, completedCount: 3, pendingCount: 2 },
                { date: 'Thu', completed: 85, pending: 15, completedCount: 4, pendingCount: 1 },
                { date: 'Fri', completed: 95, pending: 5, completedCount: 6, pendingCount: 0 }
            ]
        };
    }

    getDefaultAssignments() {
        return {
            managers: [
                { id: 'sarah', name: 'Sarah Johnson' },
                { id: 'michael', name: 'Michael Chen' },
                { id: 'emily', name: 'Emily Rodriguez' },
                { id: 'david', name: 'David Thompson' }
            ],
            cases: [
                { id: 'CASE-001', clientName: 'John Smith', caseManager: 'Sarah Johnson', status: 'active', priority: 'high', assignedDate: '2025-10-10' },
                { id: 'CASE-002', clientName: 'Jane Doe', caseManager: 'Michael Chen', status: 'pending', priority: 'medium', assignedDate: '2025-10-11' },
                { id: 'CASE-003', clientName: 'Bob Wilson', caseManager: 'Emily Rodriguez', status: 'active', priority: 'low', assignedDate: '2025-10-12' },
                { id: 'CASE-004', clientName: 'Alice Brown', caseManager: 'David Thompson', status: 'completed', priority: 'high', assignedDate: '2025-10-09' }
            ]
        };
    }

    getDefaultMonitoring() {
        return {
            systemHealth: {
                status: 'healthy',
                cpuUsage: 45,
                memoryUsage: 62,
                diskUsage: 38
            },
            database: {
                status: 'healthy',
                connections: 12,
                responseTime: 15,
                uptime: '99.9%'
            },
            activeUsers: 8,
            users: [
                { name: 'Liz Chukwu', role: 'Admin', status: 'active' },
                { name: 'Sarah Johnson', role: 'Case Manager', status: 'active' },
                { name: 'Michael Chen', role: 'Case Manager', status: 'idle' },
                { name: 'Emily Rodriguez', role: 'Case Manager', status: 'active' }
            ]
        };
    }
}

// ==============================================
// INITIALIZE OPERATIONS MANAGER
// ==============================================
const operationsManager = new OperationsManager();

// ==============================================
// EXPORT FOR TESTING
// ==============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OperationsManager;
}
